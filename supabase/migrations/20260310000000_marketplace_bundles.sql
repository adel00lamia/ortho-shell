-- Marketplace bundles: group multiple listings at a discount
CREATE TABLE IF NOT EXISTS marketplace_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price_cents INT NOT NULL DEFAULT 0,
  original_price_cents INT NOT NULL DEFAULT 0,  -- sum of individual prices
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  cover_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketplace_bundle_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID NOT NULL REFERENCES marketplace_bundles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE(bundle_id, listing_id)
);

-- RLS
ALTER TABLE marketplace_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_bundle_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published bundles"
  ON marketplace_bundles FOR SELECT
  USING (status = 'published' OR seller_id = auth.uid());

CREATE POLICY "Sellers manage own bundles"
  ON marketplace_bundles FOR ALL
  USING (seller_id = auth.uid());

CREATE POLICY "Bundle items visible with bundle"
  ON marketplace_bundle_items FOR SELECT
  USING (bundle_id IN (
    SELECT id FROM marketplace_bundles WHERE status = 'published' OR seller_id = auth.uid()
  ));

CREATE POLICY "Sellers manage own bundle items"
  ON marketplace_bundle_items FOR ALL
  USING (bundle_id IN (
    SELECT id FROM marketplace_bundles WHERE seller_id = auth.uid()
  ));
