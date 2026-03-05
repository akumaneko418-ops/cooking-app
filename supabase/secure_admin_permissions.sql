-- ==========================================
-- レシピ関連の「特定管理者のみ」編集を許可するRLSポリシー設定
-- ==========================================

-- [重要] 以下の 'your_email@example.com' の部分を、
-- ご自身がログインにお使いのメールアドレスに置き換えてから実行してください。

-- 1. レシピテーブル (recipes) の権限
DROP POLICY IF EXISTS "Allow admin to update recipes" ON public.recipes;
CREATE POLICY "Allow admin to update recipes"
ON public.recipes FOR UPDATE
TO authenticated
USING ( auth.jwt() ->> 'email' = 'your_email@example.com' )
WITH CHECK ( auth.jwt() ->> 'email' = 'your_email@example.com' );

DROP POLICY IF EXISTS "Allow admin to insert recipes" ON public.recipes;
CREATE POLICY "Allow admin to insert recipes"
ON public.recipes FOR INSERT
TO authenticated
WITH CHECK ( auth.jwt() ->> 'email' = 'your_email@example.com' );

DROP POLICY IF EXISTS "Allow admin to delete recipes" ON public.recipes;
CREATE POLICY "Allow admin to delete recipes"
ON public.recipes FOR DELETE
TO authenticated
USING ( auth.jwt() ->> 'email' = 'your_email@example.com' );

-- 2. レシピ手順テーブル (recipe_steps) の権限
DROP POLICY IF EXISTS "Allow admin all recipe_steps" ON public.recipe_steps;
CREATE POLICY "Allow admin all recipe_steps"
ON public.recipe_steps FOR ALL
TO authenticated
USING ( auth.jwt() ->> 'email' = 'your_email@example.com' )
WITH CHECK ( auth.jwt() ->> 'email' = 'your_email@example.com' );

-- 3. レシピ材料テーブル (recipe_ingredients) の権限
DROP POLICY IF EXISTS "Allow admin all recipe_ingredients" ON public.recipe_ingredients;
CREATE POLICY "Allow admin all recipe_ingredients"
ON public.recipe_ingredients FOR ALL
TO authenticated
USING ( auth.jwt() ->> 'email' = 'your_email@example.com' )
WITH CHECK ( auth.jwt() ->> 'email' = 'your_email@example.com' );

-- 4. 材料マスターテーブル (ingredients) の権限
DROP POLICY IF EXISTS "Allow admin all ingredients" ON public.ingredients;
CREATE POLICY "Allow admin all ingredients"
ON public.ingredients FOR ALL
TO authenticated
USING ( auth.jwt() ->> 'email' = 'your_email@example.com' )
WITH CHECK ( auth.jwt() ->> 'email' = 'your_email@example.com' );

-- 5. ストレージ (recipe-images バケット) の画像アップロード権限
DROP POLICY IF EXISTS "Allow admin all storage" ON storage.objects;
CREATE POLICY "Allow admin all storage"
ON storage.objects FOR ALL
TO authenticated
USING ( bucket_id = 'recipe-images' AND auth.jwt() ->> 'email' = 'your_email@example.com' )
WITH CHECK ( bucket_id = 'recipe-images' AND auth.jwt() ->> 'email' = 'your_email@example.com' );
