-- =============================================
-- Address-Web — Schema v3 COMPLET
-- Coller dans Supabase > SQL Editor > Run
-- =============================================

-- ============ EXTENSIONS ============
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Full-text search rapide

-- ============ ENUM : plans ============
DO $$ BEGIN
  CREATE TYPE plan_type AS ENUM ('free', 'premium_annual', 'premium_lifetime', 'enterprise');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============ TABLE : profiles (mise à jour) ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan plan_type DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS api_key TEXT,
  ADD COLUMN IF NOT EXISTS api_requests_today INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS api_requests_reset_at DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS profession TEXT DEFAULT 'particulier',
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS telephone TEXT,
  ADD COLUMN IF NOT EXISTS adresses_count INTEGER DEFAULT 0;

-- ============ TABLE : addresses (mise à jour) ============
ALTER TABLE public.addresses
  ADD COLUMN IF NOT EXISTS categorie TEXT DEFAULT 'autre',
  ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS quartier TEXT,
  ADD COLUMN IF NOT EXISTS pays TEXT DEFAULT 'Afrique',
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS verified_by TEXT[] DEFAULT '{}';

-- Index pour la recherche full-text
CREATE INDEX IF NOT EXISTS idx_addresses_repere_trgm ON public.addresses USING gin(repere gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_addresses_ville_trgm ON public.addresses USING gin(ville gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_addresses_public ON public.addresses(is_public);
CREATE INDEX IF NOT EXISTS idx_addresses_coords ON public.addresses(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_addresses_verified ON public.addresses(is_verified);

-- ============ TABLE : api_keys ============
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  key_hash TEXT UNIQUE NOT NULL,
  key_prefix TEXT NOT NULL, -- ex: "aw_live_abc123" (les 16 premiers chars)
  name TEXT DEFAULT 'Clé principale',
  plan plan_type DEFAULT 'free',
  requests_today INTEGER DEFAULT 0,
  requests_total INTEGER DEFAULT 0,
  requests_reset_at DATE DEFAULT CURRENT_DATE,
  daily_limit INTEGER DEFAULT 100, -- free: 100, starter: 10000, business: -1
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON public.api_keys(key_hash);

-- ============ TABLE : api_logs ============
CREATE TABLE IF NOT EXISTS public.api_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER DEFAULT 200,
  response_time_ms INTEGER,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_logs_key ON public.api_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_created ON public.api_logs(created_at DESC);

-- ============ TABLE : verifications (certification communautaire) ============
CREATE TABLE IF NOT EXISTS public.verifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  address_id UUID REFERENCES public.addresses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(address_id, user_id) -- 1 seul vote par utilisateur par adresse
);

-- ============ TABLE : subscriptions (paiements) ============
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan plan_type NOT NULL,
  amount_usd NUMERIC(10,2),
  payment_method TEXT DEFAULT 'manual', -- mobile_money, card, manual
  payment_reference TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ TABLE : qr_orders (commandes plaques QR) ============
CREATE TABLE IF NOT EXISTS public.qr_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
  address_code TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  amount_usd NUMERIC(10,2) DEFAULT 5.00,
  delivery_address TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'printing', 'shipped', 'delivered')),
  payment_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ RLS POLICIES ============
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_orders ENABLE ROW LEVEL SECURITY;

-- API Keys : propriétaire seulement
DROP POLICY IF EXISTS "api_keys_owner" ON public.api_keys;
CREATE POLICY "api_keys_owner" ON public.api_keys
  FOR ALL USING (auth.uid() = user_id);

-- API Logs : propriétaire de la clé
DROP POLICY IF EXISTS "api_logs_owner" ON public.api_logs;
CREATE POLICY "api_logs_owner" ON public.api_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Verifications : lecture publique, écriture auth
DROP POLICY IF EXISTS "verifications_read" ON public.verifications;
CREATE POLICY "verifications_read" ON public.verifications FOR SELECT USING (true);
DROP POLICY IF EXISTS "verifications_write" ON public.verifications;
CREATE POLICY "verifications_write" ON public.verifications
  FOR INSERT WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- Subscriptions : propriétaire seulement
DROP POLICY IF EXISTS "subscriptions_owner" ON public.subscriptions;
CREATE POLICY "subscriptions_owner" ON public.subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- QR Orders : propriétaire seulement
DROP POLICY IF EXISTS "qr_orders_owner" ON public.qr_orders;
CREATE POLICY "qr_orders_owner" ON public.qr_orders
  FOR ALL USING (auth.uid() = user_id);

-- ============ FONCTIONS ============

-- Auto-incrémenter adresses_count
CREATE OR REPLACE FUNCTION handle_address_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    UPDATE public.profiles SET adresses_count = adresses_count + 1 WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_address_insert ON public.addresses;
CREATE TRIGGER trigger_address_insert
  AFTER INSERT ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION handle_address_insert();

-- Auto-décrémenter adresses_count
CREATE OR REPLACE FUNCTION handle_address_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.user_id IS NOT NULL THEN
    UPDATE public.profiles SET adresses_count = GREATEST(adresses_count - 1, 0) WHERE id = OLD.user_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_address_delete ON public.addresses;
CREATE TRIGGER trigger_address_delete
  AFTER DELETE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION handle_address_delete();

-- Certification : auto-badge verified quand >= 3 votes
CREATE OR REPLACE FUNCTION handle_verification_insert()
RETURNS TRIGGER AS $$
DECLARE
  vote_count INTEGER;
BEGIN
  -- Compter les votes pour cette adresse
  SELECT COUNT(*) INTO vote_count FROM public.verifications WHERE address_id = NEW.address_id;
  
  -- Mettre à jour l'adresse
  UPDATE public.addresses
  SET 
    verified_count = vote_count,
    verified_by = array_append(COALESCE(verified_by, '{}'), NEW.user_id::text),
    is_verified = (vote_count >= 3)
  WHERE id = NEW.address_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_verification_insert ON public.verifications;
CREATE TRIGGER trigger_verification_insert
  AFTER INSERT ON public.verifications
  FOR EACH ROW EXECUTE FUNCTION handle_verification_insert();

-- Incrémenter view_count
CREATE OR REPLACE FUNCTION increment_view_count(address_code_param TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.addresses SET view_count = view_count + 1 WHERE address_code = address_code_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recalculer adresses_count pour comptes existants
UPDATE public.profiles p
SET adresses_count = (SELECT COUNT(*) FROM public.addresses a WHERE a.user_id = p.id);

-- ============ STORAGE BUCKET ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('address-photos', 'address-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "photos_public_read" ON storage.objects;
CREATE POLICY "photos_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'address-photos');

DROP POLICY IF EXISTS "photos_auth_upload" ON storage.objects;
CREATE POLICY "photos_auth_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'address-photos' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "photos_owner_delete" ON storage.objects;
CREATE POLICY "photos_owner_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'address-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============ VÉRIFICATION ============
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('addresses', 'profiles', 'api_keys', 'verifications', 'subscriptions', 'qr_orders')
ORDER BY table_name, ordinal_position;
