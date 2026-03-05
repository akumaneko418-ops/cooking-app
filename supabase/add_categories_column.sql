-- ==========================================
-- レシピテーブルの複数カテゴリ対応（マイグレーション）
-- ==========================================

-- 1. categories カラム（text配列）が存在しない場合のみ追加する
ALTER TABLE public.recipes 
ADD COLUMN IF NOT EXISTS categories text[] DEFAULT '{}'::text[];

-- 2. 既存の単一カテゴリ(category_id)データを、新しいcategories配列にコピーして移行する
UPDATE public.recipes 
SET categories = ARRAY[category_id] 
WHERE category_id IS NOT NULL 
  AND category_id != '' 
  AND (categories IS NULL OR categories = '{}'::text[]);
