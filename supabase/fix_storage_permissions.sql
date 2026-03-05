-- 1. バケットを公開設定（Public）にする
UPDATE storage.buckets
SET public = true
WHERE id = 'recipe-images';

-- 2. 既存のポリシーを削除（重複防止）
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- 3. 全ユーザー（匿名ユーザー含む）に閲覧（SELECT）を許可するポリシーを作成
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'recipe-images' );

-- 4. 認証済みユーザーにアップロード（INSERT/UPDATE）を許可するポリシーを作成
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'recipe-images' );

DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'recipe-images' );
