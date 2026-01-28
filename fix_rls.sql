-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE store ENABLE ROW LEVEL SECURITY;

-- 1. Policies for PROFILES
-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- CRITICAL: Allow users to insert their *own* profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Policies for STORE (Recipes, Settings, etc.)
-- Allow users to do EVERYTHING on their own items
CREATE POLICY "Users can manage own store items" ON store
  FOR ALL USING (auth.uid() = (value->>'ownerId')::uuid);

-- Allow reading public items (shared recipes)
CREATE POLICY "Users can read public items" ON store
  FOR SELECT USING ((value->>'isPublic')::boolean = true);
