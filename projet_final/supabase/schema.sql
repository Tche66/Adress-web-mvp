-- =============================================
-- Address-Web v2 — Schema Supabase complet
-- Coller dans : Supabase > SQL Editor > New Query > Run
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLE : profiles
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  nom TEXT,
  telephone TEXT,
  photo_url TEXT,
  profession TEXT,                          -- Raison d'utilisation / métier
  bio TEXT,                                 -- Description courte
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  adresses_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLE : addresses
-- =============================================
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  address_code TEXT UNIQUE NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  repere TEXT DEFAULT '',
  ville TEXT NOT NULL,
  pays TEXT DEFAULT 'Afrique',
  quartier TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  photos TEXT[] DEFAULT '{}',              -- URLs photos stockées dans Supabase Storage
  categorie TEXT DEFAULT 'autre' CHECK (categorie IN ('maison','commerce','bureau','restaurant','entrepot','evenement','autre')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_addresses_code ON public.addresses(address_code);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_ville ON public.addresses(ville);
CREATE INDEX IF NOT EXISTS idx_addresses_public ON public.addresses(is_public);
CREATE INDEX IF NOT EXISTS idx_addresses_coords ON public.addresses(latitude, longitude);

-- =============================================
-- RLS
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- Profils : lecture publique (nom, photo), écriture par le propriétaire
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;
CREATE POLICY "profiles_public_read" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_own_write" ON public.profiles;
CREATE POLICY "profiles_own_write" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- Adresses : lecture publique si is_public=true OU propriétaire
DROP POLICY IF EXISTS "addresses_public_read" ON public.addresses;
CREATE POLICY "addresses_public_read" ON public.addresses
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "addresses_insert_auth" ON public.addresses;
CREATE POLICY "addresses_insert_auth" ON public.addresses
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "addresses_update_own" ON public.addresses;
CREATE POLICY "addresses_update_own" ON public.addresses
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "addresses_delete_own" ON public.addresses;
CREATE POLICY "addresses_delete_own" ON public.addresses
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- STORAGE : bucket pour photos d'adresses
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('address-photos', 'address-photos', true)
ON CONFLICT DO NOTHING;

-- Politique storage : lecture publique
DROP POLICY IF EXISTS "photos_public_read" ON storage.objects;
CREATE POLICY "photos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'address-photos');

-- Politique storage : upload par utilisateurs connectés
DROP POLICY IF EXISTS "photos_auth_upload" ON storage.objects;
CREATE POLICY "photos_auth_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'address-photos' AND auth.role() = 'authenticated');

-- Politique storage : suppression par propriétaire
DROP POLICY IF EXISTS "photos_owner_delete" ON storage.objects;
CREATE POLICY "photos_owner_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'address-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =============================================
-- FONCTIONS
-- =============================================
CREATE OR REPLACE FUNCTION increment_view_count(address_code_param TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.addresses SET view_count = view_count + 1 WHERE address_code = address_code_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_addresses_updated_at ON public.addresses;
CREATE TRIGGER trigger_addresses_updated_at
  BEFORE UPDATE ON public.addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Créer profil automatiquement à l'inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nom)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'nom')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Mettre à jour compteur adresses
CREATE OR REPLACE FUNCTION update_address_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.user_id IS NOT NULL THEN
    UPDATE profiles SET adresses_count = adresses_count + 1 WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' AND OLD.user_id IS NOT NULL THEN
    UPDATE profiles SET adresses_count = GREATEST(adresses_count - 1, 0) WHERE id = OLD.user_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_address_count ON public.addresses;
CREATE TRIGGER trigger_address_count
  AFTER INSERT OR DELETE ON public.addresses FOR EACH ROW EXECUTE FUNCTION update_address_count();
