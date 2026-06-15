-- 1. Tables Table
CREATE TABLE public.tables (
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
    guests INTEGER DEFAULT 0
);

-- 2. Employees Table
CREATE TABLE public.employees (
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
    last_login BIGINT
);

-- 3. Menu Table
CREATE TABLE public.menu (
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
    prep_time INTEGER DEFAULT 15
);

-- 4. Departments Table
CREATE TABLE public.departments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_en TEXT,
    icon TEXT,
    color TEXT,
    description TEXT,
    work_hours TEXT,
    active_orders INTEGER DEFAULT 0,
    last_order_at BIGINT
);

-- 5. Bills Table
CREATE TABLE public.bills (
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
    notes TEXT
);

-- 6. Notifications Table
CREATE TABLE public.notifications (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT,
    target_roles JSONB DEFAULT '[]'::jsonb,
    timestamp BIGINT,
    read BOOLEAN DEFAULT false
);

-- 7. Department Orders (Active Orders)
CREATE TABLE public.dept_orders (
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
    status TEXT
);

-- Realtime Configuration
ALTER PUBLICATION supabase_realtime ADD TABLE tables;
ALTER PUBLICATION supabase_realtime ADD TABLE employees;
ALTER PUBLICATION supabase_realtime ADD TABLE menu;
ALTER PUBLICATION supabase_realtime ADD TABLE departments;
ALTER PUBLICATION supabase_realtime ADD TABLE bills;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE dept_orders;
