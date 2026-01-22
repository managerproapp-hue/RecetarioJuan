-- ===================================================================
-- VERIFICATION SCRIPT FOR RLS POLICIES AND DATA
-- Execute this in Supabase SQL Editor to verify everything is correct
-- ===================================================================

-- 1. VERIFY RLS POLICIES ON 'store' TABLE
SELECT 
  '=== RLS POLICIES ON store TABLE ===' as info;

SELECT 
  policyname,
  cmd as operation,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'store'
ORDER BY cmd, policyname;

-- Expected: 4 policies (SELECT, INSERT, UPDATE, DELETE)

-- 2. VERIFY RLS POLICIES ON 'profiles' TABLE
SELECT 
  '=== RLS POLICIES ON profiles TABLE ===' as info;

SELECT 
  policyname,
  cmd as operation,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- Expected: 4 policies (SELECT, INSERT, UPDATE, DELETE)

-- 3. CHECK RECIPE DATA IN STORE TABLE
SELECT 
  '=== RECIPE DATA IN STORE ===' as info;

SELECT 
  key,
  CASE 
    WHEN key LIKE 'recipes:%' THEN split_part(key, ':', 2)
    ELSE 'legacy'
  END as user_id,
  jsonb_array_length(value) as recipe_count,
  created_at,
  updated_at
FROM public.store 
WHERE key LIKE 'recipes%'
ORDER BY key;

-- Expected: At least one entry per user who has created recipes

-- 4. CHECK USER PROFILES
SELECT 
  '=== USER PROFILES ===' as info;

SELECT 
  id,
  email,
  role,
  is_approved,
  created_at
FROM public.profiles
ORDER BY created_at;

-- Expected: All users should have profiles, admin should be approved

-- 5. CHECK FOR PUBLIC RECIPES
SELECT 
  '=== PUBLIC RECIPES ANALYSIS ===' as info;

WITH recipe_data AS (
  SELECT 
    key,
    CASE 
      WHEN key LIKE 'recipes:%' THEN split_part(key, ':', 2)
      ELSE 'legacy'
    END as owner_id,
    jsonb_array_elements(value) as recipe
  FROM public.store 
  WHERE key LIKE 'recipes%'
)
SELECT 
  owner_id,
  COUNT(*) as total_recipes,
  COUNT(*) FILTER (WHERE (recipe->>'isPublic')::boolean = true) as public_recipes,
  COUNT(*) FILTER (WHERE (recipe->>'isPublic')::boolean = false OR recipe->>'isPublic' IS NULL) as private_recipes
FROM recipe_data
GROUP BY owner_id
ORDER BY owner_id;

-- Expected: Shows breakdown of public vs private recipes per user

-- 6. LIST ALL PUBLIC RECIPES
SELECT 
  '=== ALL PUBLIC RECIPES ===' as info;

WITH recipe_data AS (
  SELECT 
    key,
    CASE 
      WHEN key LIKE 'recipes:%' THEN split_part(key, ':', 2)
      ELSE 'legacy'
    END as owner_id,
    jsonb_array_elements(value) as recipe
  FROM public.store 
  WHERE key LIKE 'recipes%'
)
SELECT 
  recipe->>'id' as recipe_id,
  recipe->>'name' as recipe_name,
  owner_id,
  recipe->>'ownerId' as owner_id_in_recipe,
  (recipe->>'isPublic')::boolean as is_public,
  recipe->>'creator' as creator
FROM recipe_data
WHERE (recipe->>'isPublic')::boolean = true
ORDER BY recipe->>'name';

-- Expected: All recipes marked as public should appear here

-- 7. CHECK RLS IS ENABLED
SELECT 
  '=== RLS STATUS ===' as info;

SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('store', 'profiles', 'products')
ORDER BY tablename;

-- Expected: rls_enabled should be TRUE for all tables

-- ===================================================================
-- INTERPRETATION GUIDE
-- ===================================================================
-- 
-- If you see:
-- - 4 policies on 'store' table ✓
-- - 4 policies on 'profiles' table ✓
-- - At least one recipe entry ✓
-- - Your user profile with is_approved = true ✓
-- - RLS enabled on all tables ✓
-- 
-- Then the database is correctly configured!
--
-- If recipes are still not showing:
-- - Check browser console for errors
-- - Verify the user is authenticated
-- - Check that recipes have ownerId field set
-- ===================================================================
