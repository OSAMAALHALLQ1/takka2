-- 1. Tables Table
CREATE TABLE IF NOT EXISTS public.tables (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    seats INTEGER DEFAULT 4,
    area TEXT,
    status TEXT DEFAULT 'empty',
    current_order JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    subtotal NUMERIC DEFAULT 0,
    tax NUMERIC DEFAULT 0,
    service_charge NUMERIC DEFAULT 0,
    total NUMERIC DEFAULT 0,
    waiter_code TEXT,
    seated_at BIGINT,
    guests INTEGER DEFAULT 0,
    restaurant_id TEXT DEFAULT 'taka-main'
);

-- 2. Employees Table
CREATE TABLE IF NOT EXISTS public.employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_en TEXT,
    role TEXT NOT NULL,
    username TEXT,
    password TEXT,
    code TEXT UNIQUE,
    phone TEXT,
    email TEXT,
    salary NUMERIC DEFAULT 0,
    active BOOLEAN DEFAULT true,
    last_login BIGINT,
    restaurant_id TEXT DEFAULT 'taka-main'
);

-- 3. Menu Table
CREATE TABLE IF NOT EXISTS public.menu (
    id TEXT PRIMARY KEY,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    name TEXT NOT NULL,
    category TEXT,
    price NUMERIC NOT NULL,
    description TEXT,
    image TEXT,
    department TEXT,
    available BOOLEAN DEFAULT true,
    prep_time INTEGER DEFAULT 15,
    restaurant_id TEXT DEFAULT 'taka-main'
);

-- 4. Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_en TEXT,
    icon TEXT,
    color TEXT,
    description TEXT,
    work_hours TEXT,
    active_orders INTEGER DEFAULT 0,
    last_order_at BIGINT,
    restaurant_id TEXT DEFAULT 'taka-main'
);

-- 5. Bills Table
CREATE TABLE IF NOT EXISTS public.bills (
    id TEXT PRIMARY KEY,
    table_id TEXT,
    table_name TEXT,
    cashier_code TEXT,
    cashier_name TEXT,
    timestamp BIGINT,
    date_formatted TEXT,
    time_formatted TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    subtotal NUMERIC,
    tax NUMERIC,
    service_charge NUMERIC,
    total NUMERIC,
    payment_method TEXT,
    notes TEXT,
    restaurant_id TEXT DEFAULT 'taka-main'
);

-- 6. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT,
    target_roles JSONB DEFAULT '[]'::jsonb,
    target_role TEXT,
    target_department TEXT,
    timestamp BIGINT,
    read BOOLEAN DEFAULT false,
    restaurant_id TEXT DEFAULT 'taka-main'
);

-- 7. Department Orders (Active Orders)
CREATE TABLE IF NOT EXISTS public.dept_orders (
    id TEXT PRIMARY KEY,
    table_id TEXT,
    table_name TEXT,
    waiter_code TEXT,
    waiter_name TEXT,
    timestamp BIGINT,
    items JSONB DEFAULT '[]'::jsonb,
    subtotal NUMERIC,
    tax NUMERIC,
    service_charge NUMERIC,
    total NUMERIC,
    status TEXT,
    restaurant_id TEXT DEFAULT 'taka-main'
);

-- Realtime Configuration
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE tables, employees, menu, departments, bills, notifications, dept_orders;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;
