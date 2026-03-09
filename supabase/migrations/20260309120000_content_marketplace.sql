-- Content marketplace with Stripe Connect
-- Enables trainers to publish and sell content, with platform commission

-- Trainer stripe accounts
CREATE TABLE IF NOT EXISTS trainer_stripe_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_account_id text UNIQUE NOT NULL,
  charges_enabled boolean DEFAULT false,
  payouts_enabled boolean DEFAULT false,
  onboarding_complete boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Published marketplace listings
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  module_id uuid REFERENCES training_modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  short_description text,
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  currency text DEFAULT 'mad' CHECK (currency IN ('mad', 'eur', 'usd')),
  category text NOT NULL,
  tags text[] DEFAULT '{}',
  cover_image_url text,
  preview_url text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'published', 'suspended', 'archived')),
  platform_fee_percent numeric(5,2) DEFAULT 15.00,
  rating_avg numeric(3,2) DEFAULT 0,
  rating_count integer DEFAULT 0,
  purchase_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Purchases / licenses
CREATE TABLE IF NOT EXISTS marketplace_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES marketplace_listings(id) ON DELETE RESTRICT NOT NULL,
  buyer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  stripe_payment_intent_id text,
  stripe_transfer_id text,
  amount_cents integer NOT NULL,
  platform_fee_cents integer NOT NULL,
  seller_payout_cents integer NOT NULL,
  currency text DEFAULT 'mad',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'refunded', 'disputed')),
  purchased_at timestamptz DEFAULT now(),
  UNIQUE(listing_id, buyer_id)
);

-- Reviews
CREATE TABLE IF NOT EXISTS marketplace_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES marketplace_listings(id) ON DELETE CASCADE NOT NULL,
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  purchase_id uuid REFERENCES marketplace_purchases(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  body text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(purchase_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_listings_seller ON marketplace_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_category ON marketplace_listings(category);
CREATE INDEX IF NOT EXISTS idx_purchases_buyer ON marketplace_purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_purchases_listing ON marketplace_purchases(listing_id);
CREATE INDEX IF NOT EXISTS idx_reviews_listing ON marketplace_reviews(listing_id);

-- RLS
ALTER TABLE trainer_stripe_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_reviews ENABLE ROW LEVEL SECURITY;

-- Trainer stripe accounts: only own record
CREATE POLICY "Users see own stripe account" ON trainer_stripe_accounts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own stripe account" ON trainer_stripe_accounts
  FOR ALL USING (auth.uid() = user_id);

-- Listings: published visible to all, own drafts visible to seller
CREATE POLICY "Anyone sees published listings" ON marketplace_listings
  FOR SELECT USING (status = 'published');
CREATE POLICY "Sellers see own listings" ON marketplace_listings
  FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Sellers manage own listings" ON marketplace_listings
  FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers update own listings" ON marketplace_listings
  FOR UPDATE USING (auth.uid() = seller_id);

-- Purchases: buyers see own, sellers see sales
CREATE POLICY "Buyers see own purchases" ON marketplace_purchases
  FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Sellers see their sales" ON marketplace_purchases
  FOR SELECT USING (
    listing_id IN (SELECT id FROM marketplace_listings WHERE seller_id = auth.uid())
  );

-- Reviews: anyone sees reviews on published listings
CREATE POLICY "Anyone reads reviews" ON marketplace_reviews
  FOR SELECT USING (true);
CREATE POLICY "Buyers write reviews" ON marketplace_reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Update listing rating on review insert
CREATE OR REPLACE FUNCTION update_listing_rating()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE marketplace_listings SET
    rating_avg = (SELECT AVG(rating)::numeric(3,2) FROM marketplace_reviews WHERE listing_id = NEW.listing_id),
    rating_count = (SELECT COUNT(*) FROM marketplace_reviews WHERE listing_id = NEW.listing_id),
    updated_at = now()
  WHERE id = NEW.listing_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_listing_rating ON marketplace_reviews;
CREATE TRIGGER trg_update_listing_rating
  AFTER INSERT OR UPDATE OR DELETE ON marketplace_reviews
  FOR EACH ROW EXECUTE FUNCTION update_listing_rating();

-- Increment purchase count on successful purchase
CREATE OR REPLACE FUNCTION increment_purchase_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
    UPDATE marketplace_listings SET
      purchase_count = purchase_count + 1,
      updated_at = now()
    WHERE id = NEW.listing_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_increment_purchases ON marketplace_purchases;
CREATE TRIGGER trg_increment_purchases
  AFTER INSERT OR UPDATE ON marketplace_purchases
  FOR EACH ROW EXECUTE FUNCTION increment_purchase_count();
