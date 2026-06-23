-- Production hardening migration for TAKA.
--
-- Apply in a staging Supabase project first. The RLS section assumes every
-- logged-in user has JWT app_metadata.restaurant_id and app_metadata.role.
-- Do not apply the RLS policy section to the current local-code login flow
-- before migrating employees to Supabase Auth.

BEGIN;

-- Columns currently used by the frontend but missing from the base schema.
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS restaurant_name text;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS waiter_code text;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS seated_at bigint;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS seated_duration integer;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS closed_at bigint;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS idempotency_key text;
ALTER TABLE public.dept_orders ADD COLUMN IF NOT EXISTS idempotency_key text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS event_key text;

-- Backfill required tenant fields before tightening constraints.
UPDATE public.tables SET restaurant_id = 'taka-main' WHERE restaurant_id IS NULL;
UPDATE public.employees SET restaurant_id = 'taka-main' WHERE restaurant_id IS NULL;
UPDATE public.menu SET restaurant_id = 'taka-main' WHERE restaurant_id IS NULL;
UPDATE public.departments SET restaurant_id = 'taka-main' WHERE restaurant_id IS NULL;
UPDATE public.bills SET restaurant_id = 'taka-main' WHERE restaurant_id IS NULL;
UPDATE public.notifications SET restaurant_id = 'taka-main' WHERE restaurant_id IS NULL;
UPDATE public.dept_orders SET restaurant_id = 'taka-main' WHERE restaurant_id IS NULL;

ALTER TABLE public.tables ALTER COLUMN restaurant_id SET NOT NULL;
ALTER TABLE public.employees ALTER COLUMN restaurant_id SET NOT NULL;
ALTER TABLE public.menu ALTER COLUMN restaurant_id SET NOT NULL;
ALTER TABLE public.departments ALTER COLUMN restaurant_id SET NOT NULL;
ALTER TABLE public.bills ALTER COLUMN restaurant_id SET NOT NULL;
ALTER TABLE public.notifications ALTER COLUMN restaurant_id SET NOT NULL;
ALTER TABLE public.dept_orders ALTER COLUMN restaurant_id SET NOT NULL;

-- Data-shape constraints.
DO $$
BEGIN
  ALTER TABLE public.tables
    ADD CONSTRAINT tables_status_check
    CHECK (status IN ('empty', 'eating', 'bill_requested', 'unavailable'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.dept_orders
    ADD CONSTRAINT dept_orders_status_check
    CHECK (status IS NULL OR status IN ('new', 'preparing', 'ready', 'delivered', 'completed', 'cancelled'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.bills
    ADD CONSTRAINT bills_totals_non_negative_check
    CHECK (
      coalesce(subtotal, 0) >= 0
      AND coalesce(tax, 0) >= 0
      AND coalesce(service_charge, 0) >= 0
      AND coalesce(total, 0) >= 0
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.menu
    ADD CONSTRAINT menu_price_non_negative_check
    CHECK (price >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Idempotency and lookup indexes.
CREATE UNIQUE INDEX IF NOT EXISTS bills_restaurant_bill_uidx
  ON public.bills (restaurant_id, id);

CREATE UNIQUE INDEX IF NOT EXISTS bills_restaurant_table_session_uidx
  ON public.bills (restaurant_id, table_id, seated_at)
  WHERE seated_at IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS bills_restaurant_idempotency_uidx
  ON public.bills (restaurant_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS dept_orders_restaurant_idempotency_uidx
  ON public.dept_orders (restaurant_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS notifications_restaurant_event_uidx
  ON public.notifications (restaurant_id, event_key)
  WHERE event_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS tables_restaurant_status_idx
  ON public.tables (restaurant_id, status);

CREATE INDEX IF NOT EXISTS dept_orders_restaurant_table_idx
  ON public.dept_orders (restaurant_id, table_id);

CREATE INDEX IF NOT EXISTS dept_orders_restaurant_status_idx
  ON public.dept_orders (restaurant_id, status);

CREATE INDEX IF NOT EXISTS bills_restaurant_timestamp_idx
  ON public.bills (restaurant_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS bills_restaurant_table_timestamp_idx
  ON public.bills (restaurant_id, table_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS notifications_restaurant_timestamp_idx
  ON public.notifications (restaurant_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS notifications_restaurant_read_timestamp_idx
  ON public.notifications (restaurant_id, read, timestamp DESC);

CREATE INDEX IF NOT EXISTS notifications_restaurant_department_timestamp_idx
  ON public.notifications (restaurant_id, target_department, timestamp DESC);

CREATE INDEX IF NOT EXISTS menu_restaurant_department_available_idx
  ON public.menu (restaurant_id, department, available);

CREATE UNIQUE INDEX IF NOT EXISTS employees_restaurant_code_uidx
  ON public.employees (restaurant_id, code)
  WHERE code IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS employees_restaurant_username_uidx
  ON public.employees (restaurant_id, lower(username))
  WHERE username IS NOT NULL;

-- Realtime deletes need old row data for reliable client reconciliation.
ALTER TABLE public.tables REPLICA IDENTITY FULL;
ALTER TABLE public.dept_orders REPLICA IDENTITY FULL;
ALTER TABLE public.bills REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Auth helpers for RLS. These read Supabase Auth JWT custom claims.
CREATE OR REPLACE FUNCTION public.app_restaurant_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT nullif(
    coalesce(
      auth.jwt() -> 'app_metadata' ->> 'restaurant_id',
      auth.jwt() ->> 'restaurant_id'
    ),
    ''
  )
$$;

CREATE OR REPLACE FUNCTION public.app_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT nullif(
    coalesce(
      auth.jwt() -> 'app_metadata' ->> 'role',
      auth.jwt() ->> 'role'
    ),
    ''
  )
$$;

CREATE OR REPLACE FUNCTION public.has_app_role(allowed_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.app_role() = ANY(allowed_roles)
$$;

-- Atomic order submission. Move the frontend to supabase.rpc('submit_order')
-- so table updates and department-order creation succeed or fail together.
CREATE OR REPLACE FUNCTION public.submit_order(
  p_order_id text,
  p_table_id text,
  p_waiter_code text,
  p_waiter_name text,
  p_items jsonb,
  p_notes text DEFAULT '',
  p_guests integer DEFAULT 1
)
RETURNS public.dept_orders
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_restaurant_id text := public.app_restaurant_id();
  v_table public.tables%ROWTYPE;
  v_order public.dept_orders%ROWTYPE;
  v_subtotal numeric := 0;
  v_now bigint := floor(extract(epoch FROM clock_timestamp()) * 1000);
BEGIN
  IF v_restaurant_id IS NULL THEN
    RAISE EXCEPTION 'Missing restaurant claim';
  END IF;

  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order items cannot be empty';
  END IF;

  SELECT *
  INTO v_table
  FROM public.tables
  WHERE restaurant_id = v_restaurant_id AND id = p_table_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Table not found';
  END IF;

  SELECT coalesce(sum(
    coalesce((item ->> 'price')::numeric, 0)
    * greatest(coalesce((item ->> 'qty')::integer, 0), 0)
  ), 0)
  INTO v_subtotal
  FROM jsonb_array_elements(p_items) item;

  INSERT INTO public.dept_orders (
    id, table_id, table_name, waiter_code, waiter_name, timestamp,
    items, subtotal, tax, service_charge, total, status, restaurant_id,
    idempotency_key
  )
  VALUES (
    p_order_id, p_table_id, v_table.name, p_waiter_code, p_waiter_name, v_now,
    p_items, v_subtotal, 0, 0, v_subtotal, 'new', v_restaurant_id,
    p_order_id
  )
  ON CONFLICT (id) DO UPDATE SET
    items = excluded.items,
    subtotal = excluded.subtotal,
    total = excluded.total
  RETURNING * INTO v_order;

  UPDATE public.tables
  SET
    status = 'eating',
    current_order = coalesce(current_order, '[]'::jsonb) || p_items,
    notes = p_notes,
    subtotal = coalesce(subtotal, 0) + v_subtotal,
    total = coalesce(total, 0) + v_subtotal,
    waiter_code = p_waiter_code,
    guests = p_guests,
    seated_at = coalesce(seated_at, v_now)
  WHERE restaurant_id = v_restaurant_id AND id = p_table_id;

  RETURN v_order;
END $$;

-- Atomic payment close. Move the frontend to supabase.rpc('close_table_invoice')
-- so the bill insert, table reset, and dept_orders delete happen in one DB transaction.
CREATE OR REPLACE FUNCTION public.close_table_invoice(
  p_bill_id text,
  p_table_id text,
  p_payment_method text,
  p_cashier_code text,
  p_cashier_name text,
  p_notes text DEFAULT ''
)
RETURNS public.bills
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_restaurant_id text := public.app_restaurant_id();
  v_table public.tables%ROWTYPE;
  v_bill public.bills%ROWTYPE;
  v_now bigint := floor(extract(epoch FROM clock_timestamp()) * 1000);
BEGIN
  IF v_restaurant_id IS NULL THEN
    RAISE EXCEPTION 'Missing restaurant claim';
  END IF;

  SELECT *
  INTO v_table
  FROM public.tables
  WHERE restaurant_id = v_restaurant_id AND id = p_table_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Table not found';
  END IF;

  INSERT INTO public.bills (
    id, table_id, table_name, cashier_code, cashier_name, waiter_code,
    timestamp, items, subtotal, tax, service_charge, total, payment_method,
    notes, restaurant_id, seated_at, seated_duration, closed_at, idempotency_key
  )
  VALUES (
    p_bill_id, v_table.id, v_table.name, p_cashier_code, p_cashier_name,
    v_table.waiter_code, v_now, coalesce(v_table.current_order, '[]'::jsonb),
    coalesce(v_table.subtotal, 0), coalesce(v_table.tax, 0),
    coalesce(v_table.service_charge, 0), coalesce(v_table.total, 0),
    p_payment_method, coalesce(nullif(p_notes, ''), v_table.notes),
    v_restaurant_id, v_table.seated_at,
    CASE
      WHEN v_table.seated_at IS NULL THEN NULL
      ELSE floor((v_now - v_table.seated_at) / 60000)::integer
    END,
    v_now,
    p_bill_id
  )
  ON CONFLICT (id) DO UPDATE SET
    payment_method = excluded.payment_method,
    notes = excluded.notes,
    closed_at = excluded.closed_at
  RETURNING * INTO v_bill;

  UPDATE public.tables
  SET
    status = 'empty',
    current_order = '[]'::jsonb,
    notes = '',
    subtotal = 0,
    tax = 0,
    service_charge = 0,
    total = 0,
    waiter_code = NULL,
    seated_at = NULL,
    guests = 0
  WHERE restaurant_id = v_restaurant_id AND id = p_table_id;

  DELETE FROM public.dept_orders
  WHERE restaurant_id = v_restaurant_id AND table_id = p_table_id;

  RETURN v_bill;
END $$;

REVOKE EXECUTE ON FUNCTION public.submit_order(text, text, text, text, jsonb, text, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.close_table_invoice(text, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_order(text, text, text, text, jsonb, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.close_table_invoice(text, text, text, text, text, text) TO authenticated;

-- RLS policies. Requires Supabase Auth sessions, not the current local code login.
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dept_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tables_read_same_restaurant ON public.tables;
CREATE POLICY tables_read_same_restaurant ON public.tables
FOR SELECT TO authenticated
USING (restaurant_id = public.app_restaurant_id());

DROP POLICY IF EXISTS tables_write_operational_roles ON public.tables;
CREATE POLICY tables_write_operational_roles ON public.tables
FOR ALL TO authenticated
USING (
  restaurant_id = public.app_restaurant_id()
  AND public.has_app_role(ARRAY['manager', 'admin', 'cashier', 'waiter'])
)
WITH CHECK (
  restaurant_id = public.app_restaurant_id()
  AND public.has_app_role(ARRAY['manager', 'admin', 'cashier', 'waiter'])
);

DROP POLICY IF EXISTS menu_read_same_restaurant ON public.menu;
CREATE POLICY menu_read_same_restaurant ON public.menu
FOR SELECT TO authenticated
USING (restaurant_id = public.app_restaurant_id());

DROP POLICY IF EXISTS menu_manager_write ON public.menu;
CREATE POLICY menu_manager_write ON public.menu
FOR ALL TO authenticated
USING (restaurant_id = public.app_restaurant_id() AND public.has_app_role(ARRAY['manager', 'admin']))
WITH CHECK (restaurant_id = public.app_restaurant_id() AND public.has_app_role(ARRAY['manager', 'admin']));

DROP POLICY IF EXISTS departments_read_same_restaurant ON public.departments;
CREATE POLICY departments_read_same_restaurant ON public.departments
FOR SELECT TO authenticated
USING (restaurant_id = public.app_restaurant_id());

DROP POLICY IF EXISTS departments_manager_write ON public.departments;
CREATE POLICY departments_manager_write ON public.departments
FOR ALL TO authenticated
USING (restaurant_id = public.app_restaurant_id() AND public.has_app_role(ARRAY['manager', 'admin']))
WITH CHECK (restaurant_id = public.app_restaurant_id() AND public.has_app_role(ARRAY['manager', 'admin']));

DROP POLICY IF EXISTS dept_orders_read_same_restaurant ON public.dept_orders;
CREATE POLICY dept_orders_read_same_restaurant ON public.dept_orders
FOR SELECT TO authenticated
USING (restaurant_id = public.app_restaurant_id());

DROP POLICY IF EXISTS dept_orders_write_operational_roles ON public.dept_orders;
CREATE POLICY dept_orders_write_operational_roles ON public.dept_orders
FOR ALL TO authenticated
USING (
  restaurant_id = public.app_restaurant_id()
  AND public.has_app_role(ARRAY['manager', 'admin', 'waiter', 'cashier', 'kitchen', 'bar', 'shisha'])
)
WITH CHECK (
  restaurant_id = public.app_restaurant_id()
  AND public.has_app_role(ARRAY['manager', 'admin', 'waiter', 'cashier', 'kitchen', 'bar', 'shisha'])
);

DROP POLICY IF EXISTS bills_read_cashier_manager ON public.bills;
CREATE POLICY bills_read_cashier_manager ON public.bills
FOR SELECT TO authenticated
USING (
  restaurant_id = public.app_restaurant_id()
  AND public.has_app_role(ARRAY['manager', 'admin', 'cashier'])
);

DROP POLICY IF EXISTS bills_write_cashier_manager ON public.bills;
CREATE POLICY bills_write_cashier_manager ON public.bills
FOR INSERT TO authenticated
WITH CHECK (
  restaurant_id = public.app_restaurant_id()
  AND public.has_app_role(ARRAY['manager', 'admin', 'cashier'])
);

DROP POLICY IF EXISTS notifications_read_same_restaurant ON public.notifications;
CREATE POLICY notifications_read_same_restaurant ON public.notifications
FOR SELECT TO authenticated
USING (restaurant_id = public.app_restaurant_id());

DROP POLICY IF EXISTS notifications_write_operational_roles ON public.notifications;
CREATE POLICY notifications_write_operational_roles ON public.notifications
FOR ALL TO authenticated
USING (
  restaurant_id = public.app_restaurant_id()
  AND public.has_app_role(ARRAY['manager', 'admin', 'waiter', 'cashier', 'kitchen', 'bar', 'shisha'])
)
WITH CHECK (
  restaurant_id = public.app_restaurant_id()
  AND public.has_app_role(ARRAY['manager', 'admin', 'waiter', 'cashier', 'kitchen', 'bar', 'shisha'])
);

DROP POLICY IF EXISTS employees_manager_only ON public.employees;
CREATE POLICY employees_manager_only ON public.employees
FOR ALL TO authenticated
USING (
  restaurant_id = public.app_restaurant_id()
  AND public.has_app_role(ARRAY['manager', 'admin'])
)
WITH CHECK (
  restaurant_id = public.app_restaurant_id()
  AND public.has_app_role(ARRAY['manager', 'admin'])
);

COMMIT;
