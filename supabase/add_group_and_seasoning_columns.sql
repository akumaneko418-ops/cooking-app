-- ==========================================
-- recipe_ingredients テーブルの拡張
-- 1. グループ化ラベル (group) の追加
-- 2. 調味料フラグ (is_seasoning) の追加
-- ==========================================

ALTER TABLE public.recipe_ingredients 
ADD COLUMN IF NOT EXISTS "group" text;

ALTER TABLE public.recipe_ingredients 
ADD COLUMN IF NOT EXISTS is_seasoning boolean DEFAULT false;

-- 既存のデータをキーワードベースで初期化（便宜上）
UPDATE public.recipe_ingredients ri
SET is_seasoning = true
FROM public.ingredients i
WHERE ri.ingredient_id = i.id
AND (
    ri.unit IN ('大さじ', '小さじ')
    OR i.name ~ '醤油|みりん|酒|料理酒|塩|胡椒|砂糖|酢|油|だし|コンソメ|ケチャップ|マヨネーズ|ソース'
);
