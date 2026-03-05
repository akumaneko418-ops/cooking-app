-- ==========================================
-- レシピ関連の公開編集を許可するためのRLSポリシー設定
-- ==========================================

-- 1. レシピテーブル (recipes) の権限
-- ※すでに SELECT, INSERT 用のポリシーが存在する前提で UPDATE を追加します
DROP POLICY IF EXISTS "Allow public update recipes" ON public.recipes;
CREATE POLICY "Allow public update recipes"
ON public.recipes FOR UPDATE
TO anon, authenticated
USING (true);

-- 2. レシピ手順テーブル (recipe_steps) の権限
DROP POLICY IF EXISTS "Allow public all recipe_steps" ON public.recipe_steps;
CREATE POLICY "Allow public all recipe_steps"
ON public.recipe_steps FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 3. レシピ材料テーブル (recipe_ingredients) の権限
DROP POLICY IF EXISTS "Allow public all recipe_ingredients" ON public.recipe_ingredients;
CREATE POLICY "Allow public all recipe_ingredients"
ON public.recipe_ingredients FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 4. 材料マスターテーブル (ingredients) の権限
-- （新しい材料を追加した場合に必要）
DROP POLICY IF EXISTS "Allow public all ingredients" ON public.ingredients;
CREATE POLICY "Allow public all ingredients"
ON public.ingredients FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);
