// レシピのカテゴリ（ジャンル）定義マスターデータ
// 新しいカテゴリを追加したいときは、このファイルに追記するだけです。

export interface RecipeCategory {
    id: string;
    label: string;  // 表示名
    emoji: string;  // 絵文字アイコン
}

export const RECIPE_CATEGORIES: RecipeCategory[] = [
    { id: 'all', label: 'すべて', emoji: '🍽️' },
    { id: 'japanese', label: '和食', emoji: '🍱' },
    { id: 'western', label: '洋食', emoji: '🍝' },
    { id: 'chinese', label: '中華', emoji: '🥟' },
    { id: 'korean', label: '韓国料理', emoji: '🌶️' },
    { id: 'quick', label: '時短', emoji: '⚡' },
    { id: 'healthy', label: 'ヘルシー', emoji: '🥗' },
    { id: 'sweets', label: 'スイーツ', emoji: '🍰' },
    { id: 'dessert', label: 'デザート', emoji: '🍨' },
    { id: 'other', label: 'その他', emoji: '🍴' },

    /*
     * 💡 新しいカテゴリはここに追加できます。
     * 例:
     * { id: 'bread', label: 'パン作り', emoji: '🍞' },
     */
];

// サブジャンル定義（管理画面でレシピに割り当て可能）
export const RECIPE_SUB_CATEGORIES: RecipeCategory[] = [
    { id: 'main_dish', label: '主菜', emoji: '🥩' },
    { id: 'side_dish', label: '副菜', emoji: '🥬' },
    { id: 'rice_bowl', label: '丼もの', emoji: '🍚' },
    { id: 'noodles', label: '麺類', emoji: '🍜' },
    { id: 'soup', label: 'スープ', emoji: '🥣' },
    { id: 'meat', label: '肉', emoji: '🍖' },
    { id: 'fish', label: '魚', emoji: '🐟' },
];
