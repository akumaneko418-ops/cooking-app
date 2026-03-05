-- フィードバックテーブルの作成
CREATE TABLE IF NOT EXISTS public.feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    attachment_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_read BOOLEAN DEFAULT FALSE
);

-- RLS を有効化
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- 【ポリシー 1】誰でも（ログイン不要）フィードバックを送信（INSERT）できる
DROP POLICY IF EXISTS "Allow authenticated insert feedbacks" ON public.feedbacks;
CREATE POLICY "Allow public insert feedbacks"
ON public.feedbacks FOR INSERT
TO public
WITH CHECK (true);

-- 【ポリシー 2】管理者はすべての操作が可能
-- ※ 'your_email@example.com' を管理者のメールアドレスに書き換えてください。
DROP POLICY IF EXISTS "Allow admin all feedbacks" ON public.feedbacks;
CREATE POLICY "Allow admin all feedbacks"
ON public.feedbacks FOR ALL
TO authenticated
USING ( auth.jwt() ->> 'email' = 'your_email@example.com' )
WITH CHECK ( auth.jwt() ->> 'email' = 'your_email@example.com' );

-- 【ポリシー 3】管理者は読み取りもできる（SELECT）
DROP POLICY IF EXISTS "Allow admin to select feedbacks" ON public.feedbacks;
CREATE POLICY "Allow admin to select feedbacks"
ON public.feedbacks FOR SELECT
TO authenticated
USING ( auth.jwt() ->> 'email' = 'your_email@example.com' );
