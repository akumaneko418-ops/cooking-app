// 料理の材料や調味料を、別のものに代用する時の「辞書（データベース）」です。
// アプリ完成後は、この機能を「管理画面（CMS）」から誰でも追加・編集できるようになり、
// そのデータがインターネット経由でアプリに自動反映される仕組みになります。
// 現段階（開発中）では、このファイルに新しい行を書き足すだけで、アプリ全体にすぐ反映されます。

export interface SubstituteData {
    name: string;      // 代わりになる食材・調味料の名前
    amount: string;    // どのくらいの分量を入れるか
    affiliateLink?: string; // （オプション）珍しい調味料などをネットで買うためのURL
    // 栄養価 (100gあたりの数値)
    calories: number; // kcal 
    protein: number;  // g
    fat: number;      // g
    carbs: number;    // g
    sugar?: number;
    fiber?: number;
    salt?: number;
    calcium?: number;
    iron?: number;
    magnesium?: number;
    potassium?: number;
    zinc?: number;
    phosphorus?: number;
    vitaminA?: number;
    vitaminD?: number;
    vitaminE?: number;
    vitaminK?: number;
    vitaminB1?: number;
    vitaminB2?: number;
    vitaminB6?: number;
    vitaminB12?: number;
    folate?: number;
    niacin?: number;
    vitaminC?: number;
    isPerGram?: boolean; // true: 栄養値が1gあたり、false/未定義: 100gあたり
}

// 辞書データ本体
// 左側が「レシピに書かれている本来の材料（キー）」、右側が「その代用品のデータ」です。
export const SUBSTITUTE_DICTIONARY: Record<string, SubstituteData> = {

    // 例1: 牛乳がない場合
    '牛乳': {
        name: '豆乳',
        amount: '元のレシピと同じ分量（例：大さじ1なら大さじ1）',
        calories: 46, protein: 3.6, fat: 2.0, carbs: 3.1
    },

    // 例2: バターがない場合
    'バター': {
        name: 'オリーブオイル',
        amount: 'バターの分量の約80%（例：10gなら8g）',
        calories: 884, protein: 0.0, fat: 100.0, carbs: 0.0
    },

    // 例3: みりんがない場合
    'みりん': {
        name: '日本酒 ＋ 砂糖',
        amount: '日本酒大さじ1につき、砂糖小さじ1を混ぜる',
        calories: 140, protein: 0.1, fat: 0.0, carbs: 10.0 // 概算
    },

    // 例4: 特殊な調味料で、アフィリエイト（購入リンク）を付ける場合
    'ナンプラー': {
        name: '薄口醤油 ＋ レモン汁',
        amount: '醤油大さじ1につき、レモン汁小さじ1/2',
        affiliateLink: 'https://www.amazon.co.jp/s?k=ナンプラー',
        calories: 60, protein: 7.0, fat: 0.0, carbs: 8.0 // 概算
    },

    /*
     * 💡 【ここに新しいデータを追加できます】
     * 追加したい時は、上の例をコピーして書き換えるだけです。
     * 例：
     * '片栗粉': {
     *   name: '小麦粉',
     *   amount: '同じ分量（ただし、とろみは少し弱くなります）',
     * },
     */
};
