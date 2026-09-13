-- =========================================================================
-- Schema PostgreSQL para 3D Calc & MakerPro (Offline-First / Multi-Tenant)
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Configurações Globais por Usuário
CREATE TABLE IF NOT EXISTS settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    energy_kwh_rate NUMERIC(10, 4) DEFAULT 0.85,
    labor_hourly_rate NUMERIC(10, 2) DEFAULT 25.00,
    prep_minutes_default INTEGER DEFAULT 10,
    post_minutes_default INTEGER DEFAULT 15,
    failure_margin_default NUMERIC(5, 2) DEFAULT 10.00,
    markup_default NUMERIC(5, 2) DEFAULT 100.00,
    currency_symbol VARCHAR(10) DEFAULT 'R$',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Impressoras
CREATE TABLE IF NOT EXISTS printers (
    id VARCHAR(100) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    watts NUMERIC(10, 2) DEFAULT 200,
    price NUMERIC(10, 2) DEFAULT 0,
    lifespan_hours NUMERIC(10, 2) DEFAULT 3000,
    maintenance_per_hour NUMERIC(10, 4) DEFAULT 0.50,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_printers_user_sync ON printers(user_id, updated_at);

-- 4. Filamentos
CREATE TABLE IF NOT EXISTS filaments (
    id VARCHAR(100) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(150),
    material VARCHAR(50),
    color VARCHAR(50),
    spool_weight NUMERIC(10, 2) DEFAULT 1000,
    price NUMERIC(10, 2) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_filaments_user_sync ON filaments(user_id, updated_at);

-- 5. Catálogo de Produtos
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(100) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    image_url TEXT,
    weight_grams NUMERIC(10, 2) DEFAULT 0,
    print_hours INTEGER DEFAULT 0,
    print_minutes INTEGER DEFAULT 0,
    filament_id VARCHAR(100),
    filament_name VARCHAR(255),
    printer_id VARCHAR(100),
    printer_name VARCHAR(255),
    cost NUMERIC(10, 2) DEFAULT 0,
    suggested_price NUMERIC(10, 2) DEFAULT 0,
    direct_sale_price NUMERIC(10, 2) DEFAULT 0,
    stock INTEGER DEFAULT 0,
    infill VARCHAR(50),
    layer_height VARCHAR(50),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_products_user_sync ON products(user_id, updated_at);

-- 6. Parceiros de Consignação
CREATE TABLE IF NOT EXISTS partners (
    id VARCHAR(100) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    commission_percent NUMERIC(5, 2) DEFAULT 20.00,
    address TEXT,
    notes TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_partners_user_sync ON partners(user_id, updated_at);

-- 7. Despachos / Remessas em Consignado
CREATE TABLE IF NOT EXISTS dispatches (
    id VARCHAR(100) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    partner_id VARCHAR(100) NOT NULL,
    product_id VARCHAR(100) NOT NULL,
    quantity_sent INTEGER DEFAULT 0,
    quantity_sold INTEGER DEFAULT 0,
    unit_retail_price NUMERIC(10, 2) DEFAULT 0,
    commission_percent NUMERIC(5, 2) DEFAULT 0,
    date_sent TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_dispatches_user_sync ON dispatches(user_id, updated_at);
