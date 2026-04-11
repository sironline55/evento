-- ═══════════════════════════════════════════════════════════
-- EventVMS — Influencer Marketplace Schema
-- ═══════════════════════════════════════════════════════════

-- 1. إضافة نوع المؤثر على worker_profiles
ALTER TABLE worker_profiles ADD COLUMN IF NOT EXISTS profile_type TEXT DEFAULT 'worker';
ALTER TABLE worker_profiles ADD COLUMN IF NOT EXISTS influencer_bio TEXT;
ALTER TABLE worker_profiles ADD COLUMN IF NOT EXISTS influencer_categories TEXT[];
ALTER TABLE worker_profiles ADD COLUMN IF NOT EXISTS tiktok_handle TEXT;
ALTER TABLE worker_profiles ADD COLUMN IF NOT EXISTS tiktok_followers INTEGER DEFAULT 0;
ALTER TABLE worker_profiles ADD COLUMN IF NOT EXISTS instagram_handle TEXT;
ALTER TABLE worker_profiles ADD COLUMN IF NOT EXISTS instagram_followers INTEGER DEFAULT 0;
ALTER TABLE worker_profiles ADD COLUMN IF NOT EXISTS snapchat_handle TEXT;
ALTER TABLE worker_profiles ADD COLUMN IF NOT EXISTS snapchat_followers INTEGER DEFAULT 0;
ALTER TABLE worker_profiles ADD COLUMN IF NOT EXISTS youtube_handle TEXT;
ALTER TABLE worker_profiles ADD COLUMN IF NOT EXISTS youtube_followers INTEGER DEFAULT 0;
ALTER TABLE worker_profiles ADD COLUMN IF NOT EXISTS portfolio_links TEXT[];
ALTER TABLE worker_profiles ADD COLUMN IF NOT EXISTS is_verified_influencer BOOLEAN DEFAULT false;
ALTER TABLE worker_profiles ADD COLUMN IF NOT EXISTS influencer_rating NUMERIC(3,2) DEFAULT 0;
ALTER TABLE worker_profiles ADD COLUMN IF NOT EXISTS total_campaigns INTEGER DEFAULT 0;
ALTER TABLE worker_profiles ADD COLUMN IF NOT EXISTS price_reel INTEGER;
ALTER TABLE worker_profiles ADD COLUMN IF NOT EXISTS price_story INTEGER;
ALTER TABLE worker_profiles ADD COLUMN IF NOT EXISTS price_video INTEGER;
ALTER TABLE worker_profiles ADD COLUMN IF NOT EXISTS price_post INTEGER;

-- 2. Campaign Briefs — المنظم ينشر طلب
CREATE TABLE IF NOT EXISTS campaign_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  event_name TEXT,
  event_date DATE,
  event_location TEXT,
  content_types TEXT[] NOT NULL,        -- ['reel','story','video','post']
  influencer_count INTEGER DEFAULT 1,   -- كم مؤثر يحتاج
  budget_min INTEGER,
  budget_max INTEGER,
  deadline DATE,
  requirements TEXT,
  status TEXT DEFAULT 'open',           -- open|in_review|closed|cancelled
  selected_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  proposals_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Campaign Proposals — المؤثر يتقدم
CREATE TABLE IF NOT EXISTS campaign_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID REFERENCES campaign_briefs(id) ON DELETE CASCADE,
  influencer_id UUID REFERENCES worker_profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  cover_message TEXT NOT NULL,
  proposed_price INTEGER NOT NULL,
  content_plan TEXT,
  portfolio_sample TEXT,
  delivery_days INTEGER DEFAULT 7,
  status TEXT DEFAULT 'pending',        -- pending|accepted|rejected|withdrawn
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(brief_id, influencer_id)
);

-- 4. Campaign Contracts — الاتفاق المعتمد
CREATE TABLE IF NOT EXISTS campaign_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID REFERENCES campaign_briefs(id) ON DELETE CASCADE,
  proposal_id UUID REFERENCES campaign_proposals(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id),
  influencer_id UUID REFERENCES worker_profiles(id),
  agreed_price INTEGER NOT NULL,
  platform_fee INTEGER NOT NULL,        -- 15% من السعر
  influencer_payout INTEGER NOT NULL,   -- 85%
  status TEXT DEFAULT 'active',         -- active|content_submitted|approved|disputed|completed|cancelled
  deadline DATE,
  deliverables TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Escrow Transactions
CREATE TABLE IF NOT EXISTS escrow_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES campaign_contracts(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id),
  influencer_id UUID REFERENCES worker_profiles(id),
  amount INTEGER NOT NULL,
  platform_fee INTEGER NOT NULL,
  influencer_payout INTEGER NOT NULL,
  status TEXT DEFAULT 'held',           -- held|released|refunded|disputed
  payment_ref TEXT,
  held_at TIMESTAMPTZ DEFAULT now(),
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Content Deliverables
CREATE TABLE IF NOT EXISTS content_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES campaign_contracts(id) ON DELETE CASCADE,
  influencer_id UUID REFERENCES worker_profiles(id),
  content_type TEXT NOT NULL,           -- reel|story|video|post
  platform TEXT NOT NULL,               -- tiktok|instagram|snapchat|youtube
  post_url TEXT,
  screenshot_url TEXT,
  caption TEXT,
  views_count INTEGER,
  likes_count INTEGER,
  comments_count INTEGER,
  shares_count INTEGER,
  status TEXT DEFAULT 'submitted',      -- submitted|approved|revision_requested|rejected
  organizer_note TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Campaign Reviews
CREATE TABLE IF NOT EXISTS campaign_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES campaign_contracts(id) ON DELETE CASCADE,
  reviewer_type TEXT NOT NULL,          -- organizer|influencer
  reviewer_id UUID REFERENCES auth.users(id),
  reviewee_id UUID REFERENCES auth.users(id),
  rating INTEGER CHECK(rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(contract_id, reviewer_type)
);

-- ═══════════════ RLS POLICIES ═══════════════

ALTER TABLE campaign_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_reviews ENABLE ROW LEVEL SECURITY;

-- campaign_briefs: مفتوح للقراءة، يكتب المنظم فقط
CREATE POLICY "briefs_select_all" ON campaign_briefs FOR SELECT USING (true);
CREATE POLICY "briefs_insert_auth" ON campaign_briefs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "briefs_update_owner" ON campaign_briefs FOR UPDATE USING (created_by = auth.uid());

-- campaign_proposals: المؤثر يكتب، المنظم والمؤثر يقرأون
CREATE POLICY "proposals_select" ON campaign_proposals FOR SELECT USING (
  user_id = auth.uid() OR
  brief_id IN (SELECT id FROM campaign_briefs WHERE created_by = auth.uid())
);
CREATE POLICY "proposals_insert" ON campaign_proposals FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "proposals_update" ON campaign_proposals FOR UPDATE USING (
  user_id = auth.uid() OR
  brief_id IN (SELECT id FROM campaign_briefs WHERE created_by = auth.uid())
);

-- campaign_contracts: الطرفان يقرأان
CREATE POLICY "contracts_select" ON campaign_contracts FOR SELECT USING (
  org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()) OR
  influencer_id IN (SELECT id FROM worker_profiles WHERE user_id = auth.uid())
);
CREATE POLICY "contracts_insert" ON campaign_contracts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "contracts_update" ON campaign_contracts FOR UPDATE USING (auth.uid() IS NOT NULL);

-- deliverables: الطرفان يقرأان، المؤثر يكتب
CREATE POLICY "deliverables_select" ON content_deliverables FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "deliverables_insert" ON content_deliverables FOR INSERT WITH CHECK (
  influencer_id IN (SELECT id FROM worker_profiles WHERE user_id = auth.uid())
);
CREATE POLICY "deliverables_update" ON content_deliverables FOR UPDATE USING (auth.uid() IS NOT NULL);

-- reviews: الجميع يقرأ
CREATE POLICY "reviews_select" ON campaign_reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON campaign_reviews FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- escrow: الطرفان يقرأان
CREATE POLICY "escrow_select" ON escrow_transactions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "escrow_insert" ON escrow_transactions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "escrow_update" ON escrow_transactions FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ═══════════════ TRIGGERS ═══════════════
-- proposals_count على brief
CREATE OR REPLACE FUNCTION update_brief_proposals_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE campaign_briefs 
  SET proposals_count = (SELECT COUNT(*) FROM campaign_proposals WHERE brief_id = NEW.brief_id)
  WHERE id = NEW.brief_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_proposals_count ON campaign_proposals;
CREATE TRIGGER trg_update_proposals_count
AFTER INSERT OR DELETE ON campaign_proposals
FOR EACH ROW EXECUTE FUNCTION update_brief_proposals_count();

-- influencer_rating تحديث تلقائي
CREATE OR REPLACE FUNCTION update_influencer_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  avg_rating NUMERIC;
  total_camps INTEGER;
BEGIN
  SELECT AVG(rating), COUNT(*) INTO avg_rating, total_camps
  FROM campaign_reviews
  WHERE reviewee_id = NEW.reviewee_id AND reviewer_type = 'organizer';

  UPDATE worker_profiles
  SET influencer_rating = COALESCE(avg_rating, 0),
      total_campaigns = total_camps
  WHERE user_id = NEW.reviewee_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_influencer_rating ON campaign_reviews;
CREATE TRIGGER trg_update_influencer_rating
AFTER INSERT ON campaign_reviews
FOR EACH ROW EXECUTE FUNCTION update_influencer_rating();

SELECT 'Schema created successfully' AS status;
