-- =============================================
-- AERO — Initial Schema Migration
-- Project: vtngzjobuhqjnckuyrsx
-- =============================================

-- =============================================
-- EXTENSIONES
-- =============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =============================================
-- ENUMS
-- =============================================
CREATE TYPE user_role AS ENUM ('student', 'vendor', 'admin');
CREATE TYPE auth_provider AS ENUM ('email', 'google', 'apple', 'microsoft');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled');
CREATE TYPE payment_method AS ENUM ('qr', 'nequi', 'daviplata', 'card', 'wallet');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE security_level AS ENUM ('high', 'medium', 'low');
CREATE TYPE wallet_tx_type AS ENUM ('topup', 'purchase', 'refund');
CREATE TYPE report_status AS ENUM ('pending', 'generated', 'failed');

-- =============================================
-- PROFILES (extiende auth.users de Supabase)
-- =============================================
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     VARCHAR(255) NOT NULL,
  phone         VARCHAR(20),
  avatar_url    VARCHAR(500),
  role          user_role NOT NULL DEFAULT 'student',
  fcm_token     VARCHAR(500),
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- STUDENTS
-- =============================================
CREATE TABLE students (
  id              UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  university_id   VARCHAR(50),
  wallet_balance  DECIMAL(10,2) DEFAULT 0.00 CHECK (wallet_balance >= 0)
);

-- =============================================
-- VENDORS
-- =============================================
CREATE TABLE vendors (
  id              UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  business_name   VARCHAR(255) NOT NULL,
  description     TEXT,
  cover_image_url VARCHAR(500),
  rating_avg      DECIMAL(3,2) DEFAULT 0.00 CHECK (rating_avg >= 0 AND rating_avg <= 5),
  rating_count    INTEGER DEFAULT 0,
  schedule_start  TIME DEFAULT '06:00',
  schedule_end    TIME DEFAULT '15:00',
  is_open         BOOLEAN DEFAULT FALSE,
  location_lat    DECIMAL(10,8),
  location_lng    DECIMAL(11,8),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PRODUCTS
-- =============================================
CREATE TABLE products (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id       UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  price           DECIMAL(8,2) NOT NULL CHECK (price > 0),
  category        VARCHAR(100),
  is_available    BOOLEAN DEFAULT TRUE,
  stock_limit     INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PRODUCT IMAGES (max 3 por producto)
-- =============================================
CREATE TABLE product_images (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url   VARCHAR(500) NOT NULL,
  order_index INTEGER DEFAULT 0 CHECK (order_index BETWEEN 0 AND 2),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_product_images_max3 ON product_images(product_id, order_index);

-- =============================================
-- DELIVERY POINTS
-- =============================================
CREATE TABLE delivery_points (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  lat             DECIMAL(10,8) NOT NULL,
  lng             DECIMAL(11,8) NOT NULL,
  is_illuminated  BOOLEAN DEFAULT TRUE,
  security_level  security_level DEFAULT 'high',
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TIME SLOTS
-- =============================================
CREATE TABLE time_slots (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_point_id   UUID NOT NULL REFERENCES delivery_points(id),
  slot_start          TIME NOT NULL,
  slot_end            TIME NOT NULL,
  date                DATE NOT NULL,
  max_capacity        INTEGER DEFAULT 10 CHECK (max_capacity > 0),
  current_count       INTEGER DEFAULT 0 CHECK (current_count >= 0),
  CONSTRAINT chk_slot_end_after_start CHECK (slot_end > slot_start),
  CONSTRAINT chk_count_not_exceed_capacity CHECK (current_count <= max_capacity)
);

CREATE UNIQUE INDEX idx_time_slots_point_date_start
  ON time_slots(delivery_point_id, date, slot_start);

-- =============================================
-- ORDERS
-- =============================================
CREATE TABLE orders (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id          UUID NOT NULL REFERENCES students(id),
  vendor_id           UUID NOT NULL REFERENCES vendors(id),
  time_slot_id        UUID REFERENCES time_slots(id),
  delivery_point_id   UUID REFERENCES delivery_points(id),
  status              order_status DEFAULT 'pending',
  total_amount        DECIMAL(8,2) NOT NULL CHECK (total_amount > 0),
  payment_method      payment_method NOT NULL,
  payment_status      payment_status DEFAULT 'pending',
  notes               TEXT,
  estimated_minutes   INTEGER,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ORDER ITEMS
-- =============================================
CREATE TABLE order_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id),
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  unit_price  DECIMAL(8,2) NOT NULL CHECK (unit_price > 0),
  subtotal    DECIMAL(8,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

-- =============================================
-- PAYMENTS
-- =============================================
CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID NOT NULL REFERENCES orders(id),
  student_id      UUID NOT NULL REFERENCES students(id),
  amount          DECIMAL(8,2) NOT NULL,
  method          payment_method NOT NULL,
  external_tx_id  VARCHAR(255),
  status          payment_status DEFAULT 'pending',
  failure_reason  VARCHAR(500),
  log_data        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- WALLET TRANSACTIONS
-- =============================================
CREATE TABLE wallet_transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id      UUID NOT NULL REFERENCES students(id),
  type            wallet_tx_type NOT NULL,
  amount          DECIMAL(8,2) NOT NULL,
  balance_after   DECIMAL(8,2) NOT NULL,
  reference       VARCHAR(255),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- RATINGS
-- =============================================
CREATE TABLE ratings (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id     UUID NOT NULL REFERENCES orders(id) UNIQUE,
  student_id   UUID NOT NULL REFERENCES students(id),
  vendor_id    UUID NOT NULL REFERENCES vendors(id),
  hygiene      INTEGER NOT NULL CHECK (hygiene BETWEEN 1 AND 5),
  punctuality  INTEGER NOT NULL CHECK (punctuality BETWEEN 1 AND 5),
  quality      INTEGER NOT NULL CHECK (quality BETWEEN 1 AND 5),
  avg_score    DECIMAL(3,2) GENERATED ALWAYS AS
               ((hygiene + punctuality + quality) / 3.0) STORED,
  comment      TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- FAVORITES
-- =============================================
CREATE TABLE favorites (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id  UUID NOT NULL REFERENCES students(id),
  vendor_id   UUID NOT NULL REFERENCES vendors(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, vendor_id)
);

-- =============================================
-- WEEKLY REPORTS
-- =============================================
CREATE TABLE weekly_reports (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id       UUID NOT NULL REFERENCES vendors(id),
  week_start      DATE NOT NULL,
  week_end        DATE NOT NULL,
  total_orders    INTEGER DEFAULT 0,
  total_revenue   DECIMAL(10,2) DEFAULT 0.00,
  top_product_id  UUID REFERENCES products(id),
  report_data     JSONB DEFAULT '{}',
  pdf_url         VARCHAR(500),
  csv_url         VARCHAR(500),
  generated_at    TIMESTAMPTZ,
  status          report_status DEFAULT 'pending',
  UNIQUE (vendor_id, week_start)
);

-- =============================================
-- ÍNDICES DE PERFORMANCE
-- =============================================
CREATE INDEX idx_orders_student_id ON orders(student_id);
CREATE INDEX idx_orders_vendor_id ON orders(vendor_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_products_vendor_id ON products(vendor_id);
CREATE INDEX idx_products_available ON products(vendor_id, is_available);
CREATE INDEX idx_time_slots_date ON time_slots(date, delivery_point_id);
CREATE INDEX idx_ratings_vendor_id ON ratings(vendor_id);
CREATE INDEX idx_favorites_student_id ON favorites(student_id);
CREATE INDEX idx_vendors_is_open ON vendors(is_open);

-- =============================================
-- TRIGGERS — updated_at automático
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- TRIGGER — Crear perfil al registrarse (auth.users)
-- =============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- TRIGGER — Actualizar rating promedio del vendedor
-- =============================================
CREATE OR REPLACE FUNCTION update_vendor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE vendors
  SET
    rating_avg   = (SELECT AVG(avg_score) FROM ratings WHERE vendor_id = NEW.vendor_id),
    rating_count = (SELECT COUNT(*) FROM ratings WHERE vendor_id = NEW.vendor_id)
  WHERE id = NEW.vendor_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_vendor_rating
  AFTER INSERT OR UPDATE ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_vendor_rating();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Profiles: own read/write
CREATE POLICY "profiles: own read" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles: own update" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Students: own read/write
CREATE POLICY "students: own" ON students
  FOR ALL USING (auth.uid() = id);

-- Vendors: public read, own write
CREATE POLICY "vendors: public read" ON vendors
  FOR SELECT USING (true);
CREATE POLICY "vendors: own write" ON vendors
  FOR ALL USING (auth.uid() = id);

-- Products: public read, vendor write own
CREATE POLICY "products: public read" ON products
  FOR SELECT USING (true);
CREATE POLICY "products: vendor write" ON products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM vendors WHERE vendors.id = products.vendor_id AND vendors.id = auth.uid())
  );

-- Product images: public read, vendor write
CREATE POLICY "product_images: public read" ON product_images
  FOR SELECT USING (true);
CREATE POLICY "product_images: vendor write" ON product_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM products p
      JOIN vendors v ON v.id = p.vendor_id
      WHERE p.id = product_images.product_id AND v.id = auth.uid()
    )
  );

-- Delivery points: public read (admin write handled via service role)
CREATE POLICY "delivery_points: public read" ON delivery_points
  FOR SELECT USING (true);

-- Time slots: public read
CREATE POLICY "time_slots: public read" ON time_slots
  FOR SELECT USING (true);

-- Orders: student own, vendor own
CREATE POLICY "orders: student own" ON orders
  FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "orders: vendor read" ON orders
  FOR SELECT USING (auth.uid() = vendor_id);
CREATE POLICY "orders: vendor update status" ON orders
  FOR UPDATE USING (auth.uid() = vendor_id);

-- Order items: linked to order access
CREATE POLICY "order_items: student read" ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.student_id = auth.uid())
  );
CREATE POLICY "order_items: vendor read" ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.vendor_id = auth.uid())
  );

-- Payments: student own read
CREATE POLICY "payments: student own" ON payments
  FOR SELECT USING (auth.uid() = student_id);

-- Wallet transactions: student own
CREATE POLICY "wallet_transactions: student own" ON wallet_transactions
  FOR ALL USING (auth.uid() = student_id);

-- Ratings: public read, student write own
CREATE POLICY "ratings: public read" ON ratings
  FOR SELECT USING (true);
CREATE POLICY "ratings: student write" ON ratings
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Favorites: student own
CREATE POLICY "favorites: student own" ON favorites
  FOR ALL USING (auth.uid() = student_id);

-- Weekly reports: vendor own
CREATE POLICY "weekly_reports: vendor own" ON weekly_reports
  FOR SELECT USING (auth.uid() = vendor_id);
