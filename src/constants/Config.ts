/**
 * アプリ全体のシステム設定と管理者リスト
 */

export const CONFIG = {
    // 管理者として許可するメールアドレスのリスト
    // ログインユーザーの email がここに含まれる場合のみ管理者ツールが表示されます
    ADMIN_EMAILS: [
        'akuma@gmail.com', // ユーザー様のアカウント（例）
        'developer@example.com',
    ],

    // その他の定数（必要に応じて追加）
    APP_VERSION: '1.0.0',
    SUPPORT_EMAIL: 'support@example.com',
};
