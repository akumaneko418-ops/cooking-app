// 食材の一般的な「標準分量（1個/1枚あたり何gか）」を定義する辞書
// 料理初心者がイメージしやすいよう、分量の具体的な目安を算出するために使います。

export interface IngredientStandardData {
    unitName: string; // 数える際の単位（例: 個、枚、本）
    stdGram: number;  // その単位1つあたりの一般的な平均グラム数
    // 栄養価 (100gあたりの数値)
    calories: number; // kcal
    protein: number;  // g
    fat: number;      // g
    carbs: number;    // g (総炭水化物)
    sugar?: number;    // g (糖質)
    fiber?: number;    // g (食物繊維)
    salt?: number;     // g (食塩相当量)
    potassium?: number; // mg (カリウム)
    calcium?: number;  // mg (カルシウム)
    iron?: number;     // mg (鉄分)
    vitaminC?: number; // mg (ビタミンC)
    vitaminD?: number; // μg (ビタミンD)
    vitaminA?: number; // μg (ビタミンA/レチノール活性当量)
    vitaminE?: number; // mg (ビタミンE/α-トコフェロール)
    vitaminK?: number; // μg (ビタミンK)
    vitaminB1?: number; // mg (ビタミンB1)
    vitaminB2?: number; // mg (ビタミンB2)
    niacin?: number;    // mg (ナイアシン)
    vitaminB6?: number; // mg (ビタミンB6)
    vitaminB12?: number; // μg (ビタミンB12)
    folate?: number;    // μg (葉酸)
    magnesium?: number; // mg (マグネシウム)
    zinc?: number;      // mg (亜鉛)
    phosphorus?: number; // mg (リン)
    season?: string;   // 旬の時期 (例: "3-5月", "通年")
    isPerGram?: boolean; // 1gあたりの数値かどうか (スパイス用)
    seasoningType?: '粉末' | '液体' | '油' | 'その他'; // 調味料の計量順ソート用
}

// --- 共通栄養価・旬データ定義用ヘルパー ---
const ALL_YEAR = "通年";

export const INGREDIENT_STANDARD: Record<string, IngredientStandardData> = {
    // 【野菜・きのこ・ハーブ】
    '玉ねぎ': { unitName: '個', stdGram: 200, calories: 37, protein: 1.0, fat: 0.1, carbs: 8.8, sugar: 7.2, fiber: 1.6, salt: 0, potassium: 150, vitaminC: 8, magnesium: 10, zinc: 0.1, phosphorus: 33, vitaminA: 0, vitaminE: 0, vitaminK: 0, vitaminB1: 0.03, vitaminB2: 0.01, niacin: 0.2, vitaminB6: 0.15, vitaminB12: 0, folate: 16, season: "4-6月, 9-10月" },
    'たまねぎ': { unitName: '個', stdGram: 200, calories: 37, protein: 1.0, fat: 0.1, carbs: 8.8, sugar: 7.2, fiber: 1.6, salt: 0, potassium: 150, vitaminC: 8, magnesium: 10, zinc: 0.1, phosphorus: 33, vitaminA: 0, vitaminE: 0, vitaminK: 0, vitaminB1: 0.03, vitaminB2: 0.01, niacin: 0.2, vitaminB6: 0.15, vitaminB12: 0, folate: 16, season: "4-6月, 9-10月" },
    'じゃがいも': { unitName: '個', stdGram: 150, calories: 76, protein: 1.6, fat: 0.1, carbs: 17.6, fiber: 1.3, salt: 0, potassium: 410, vitaminC: 35, magnesium: 20, zinc: 0.2, phosphorus: 40, vitaminA: 0, vitaminE: 0, vitaminK: 0, vitaminB1: 0.12, vitaminB2: 0.03, niacin: 1.3, vitaminB6: 0.18, vitaminB12: 0, folate: 21, season: "5-6月, 9-11月" },
    'にんじん': { unitName: '本', stdGram: 150, calories: 39, protein: 0.6, fat: 0.1, carbs: 9.3, fiber: 2.8, salt: 0.1, potassium: 280, vitaminC: 4, magnesium: 10, zinc: 0.2, phosphorus: 25, vitaminA: 720, vitaminE: 0.4, vitaminK: 17, vitaminB1: 0.05, vitaminB2: 0.04, niacin: 0.7, vitaminB6: 0.10, vitaminB12: 0, folate: 28, season: "11-2月" },
    'キャベツ': { unitName: '玉', stdGram: 1000, calories: 23, protein: 1.3, fat: 0.2, carbs: 5.2, fiber: 1.8, salt: 0, vitaminC: 41, magnesium: 14, zinc: 0.2, phosphorus: 27, vitaminA: 5, vitaminE: 0.1, vitaminK: 78, vitaminB1: 0.04, vitaminB2: 0.03, niacin: 0.2, vitaminB6: 0.12, vitaminB12: 0, folate: 78, season: "3-5月, 1-2月" },
    'トマト': { unitName: '個', stdGram: 150, calories: 19, protein: 0.7, fat: 0.1, carbs: 4.7, fiber: 1.0, salt: 0, vitaminC: 15, magnesium: 9, zinc: 0.1, phosphorus: 26, vitaminA: 45, vitaminE: 1.1, vitaminK: 4, vitaminB1: 0.05, vitaminB2: 0.02, niacin: 0.7, vitaminB6: 0.08, vitaminB12: 0, folate: 22, season: "6-9月" },
    'なす': { unitName: '本', stdGram: 80, calories: 22, protein: 1.1, fat: 0.1, carbs: 5.1, fiber: 2.2, salt: 0, vitaminC: 4, magnesium: 12, zinc: 0.2, phosphorus: 25, vitaminA: 1, vitaminE: 0.3, vitaminK: 3, vitaminB1: 0.05, vitaminB2: 0.03, niacin: 0.6, vitaminB6: 0.05, vitaminB12: 0, folate: 32, season: "6-9月" },
    'ピーマン': { unitName: '個', stdGram: 30, calories: 22, protein: 0.9, fat: 0.2, carbs: 5.1, fiber: 2.3, salt: 0, vitaminC: 76, magnesium: 11, zinc: 0.2, phosphorus: 22, vitaminA: 33, vitaminE: 0.8, vitaminK: 20, vitaminB1: 0.03, vitaminB2: 0.03, niacin: 0.6, vitaminB6: 0.19, vitaminB12: 0, folate: 26, season: "6-9月" },
    'パプリカ': { unitName: '個', stdGram: 150, calories: 30, protein: 1.0, fat: 0.2, carbs: 6.6, fiber: 1.3, salt: 0, vitaminC: 170, magnesium: 12, zinc: 0.2, phosphorus: 24, vitaminA: 55, vitaminE: 2.3, vitaminK: 7, vitaminB1: 0.06, vitaminB2: 0.06, niacin: 0.9, vitaminB6: 0.22, vitaminB12: 0, folate: 68, season: "6-9月" },
    'ブロッコリー': { unitName: '株', stdGram: 250, calories: 33, protein: 4.3, fat: 0.5, carbs: 5.2, fiber: 4.4, salt: 0, vitaminC: 120, magnesium: 22, zinc: 0.7, phosphorus: 71, vitaminA: 77, vitaminE: 2.1, vitaminK: 160, vitaminB1: 0.14, vitaminB2: 0.20, niacin: 0.9, vitaminB6: 0.26, vitaminB12: 0, folate: 210, season: "11-3月" },
    'ほうれん草': { unitName: '束', stdGram: 200, calories: 20, protein: 2.2, fat: 0.4, carbs: 3.1, fiber: 2.8, salt: 0.1, iron: 2.0, potassium: 690, vitaminC: 35, magnesium: 69, zinc: 0.7, phosphorus: 47, vitaminA: 350, vitaminE: 2.1, vitaminK: 270, vitaminB1: 0.11, vitaminB2: 0.20, niacin: 0.6, vitaminB6: 0.14, vitaminB12: 0, folate: 210, season: "11-2月" },
    '白菜': { unitName: '個', stdGram: 2000, calories: 14, protein: 0.8, fat: 0.1, carbs: 3.2, fiber: 1.3, salt: 0, vitaminC: 19, magnesium: 10, zinc: 0.1, phosphorus: 19, vitaminA: 0, vitaminE: 0, vitaminK: 59, vitaminB1: 0.03, vitaminB2: 0.03, niacin: 0.3, vitaminB6: 0.05, vitaminB12: 0, folate: 60, season: "11-2月" },
    '大根': { unitName: '本', stdGram: 1000, calories: 18, protein: 0.5, fat: 0.1, carbs: 4.1, fiber: 1.4, salt: 0, vitaminC: 12, magnesium: 10, zinc: 0.2, phosphorus: 18, vitaminA: 0, vitaminE: 0, vitaminK: 0, vitaminB1: 0.02, vitaminB2: 0.01, niacin: 0.3, vitaminB6: 0.05, vitaminB12: 0, folate: 34, season: "11-2月" },
    'きゅうり': { unitName: '本', stdGram: 100, calories: 14, protein: 1.0, fat: 0.1, carbs: 3.0, fiber: 1.1, salt: 0, vitaminC: 14, magnesium: 12, zinc: 0.2, phosphorus: 24, vitaminA: 28, vitaminE: 0.5, vitaminK: 34, vitaminB1: 0.03, vitaminB2: 0.03, niacin: 0.3, vitaminB6: 0.05, vitaminB12: 0, folate: 25, season: "6-9月" },
    'レタス': { unitName: '個', stdGram: 300, calories: 12, protein: 0.6, fat: 0.1, carbs: 2.8, fiber: 1.1, salt: 0, vitaminC: 5, magnesium: 9, zinc: 0.1, phosphorus: 22, vitaminA: 20, vitaminE: 0.3, vitaminK: 29, vitaminB1: 0.05, vitaminB2: 0.03, niacin: 0.2, vitaminB6: 0.05, vitaminB12: 0, folate: 73, season: "4-6月, 9-10月" },
    'かぼちゃ': { unitName: '個', stdGram: 1200, calories: 91, protein: 1.9, fat: 0.3, carbs: 20.6, fiber: 3.5, salt: 0, vitaminC: 43, magnesium: 25, zinc: 0.3, phosphorus: 43, vitaminA: 330, vitaminE: 4.9, vitaminK: 45, vitaminB1: 0.07, vitaminB2: 0.06, niacin: 1.0, vitaminB6: 0.23, vitaminB12: 0, folate: 42, season: "9-12月" },
    'さつまいも': { unitName: '本', stdGram: 250, calories: 132, protein: 1.2, fat: 0.2, carbs: 31.5, fiber: 2.3, salt: 0, potassium: 470, season: "9-11月" },
    '小松菜': { unitName: '束', stdGram: 200, calories: 14, protein: 1.5, fat: 0.2, carbs: 2.4, fiber: 1.9, salt: 0.1, calcium: 170, season: "12-2月" },
    'チンゲン菜': { unitName: '株', stdGram: 100, calories: 9, protein: 0.6, fat: 0.1, carbs: 2.0, season: "9-1月" },
    'アスパラガス': { unitName: '本', stdGram: 20, calories: 22, protein: 2.6, fat: 0.2, carbs: 3.9, season: "4-6月" },
    'ゴーヤ': { unitName: '本', stdGram: 200, calories: 17, protein: 1.0, fat: 0.1, carbs: 3.9, season: "7-9月" },
    'オクラ': { unitName: '本', stdGram: 10, calories: 30, protein: 2.1, fat: 0.2, carbs: 6.6, fiber: 5.0, season: "7-9月" },
    '長ねぎ': { unitName: '本', stdGram: 100, calories: 28, protein: 1.4, fat: 0.1, carbs: 5.8, fiber: 2.5, season: "11-2月" },
    'もやし': { unitName: '袋', stdGram: 200, calories: 14, protein: 1.7, fat: 0.1, carbs: 2.6, season: ALL_YEAR },
    'しいたけ': { unitName: '個', stdGram: 15, calories: 19, protein: 3.0, fat: 0.4, carbs: 4.9, season: "3-5月, 9-11月" },
    'しめじ': { unitName: 'パック', stdGram: 100, calories: 18, protein: 2.1, fat: 0.6, carbs: 5.0, season: "9-11月" },
    'えのき': { unitName: '袋', stdGram: 100, calories: 22, protein: 2.2, fat: 0.6, carbs: 7.6, season: "9-11月" },
    'エリンギ': { unitName: '本', stdGram: 40, calories: 24, protein: 2.6, fat: 0.3, carbs: 4.8, season: ALL_YEAR },
    'まいたけ': { unitName: 'パック', stdGram: 100, calories: 16, protein: 2.0, fat: 0.3, carbs: 4.4, season: "9-11月" },
    'パセリ': { unitName: '枝', stdGram: 2, calories: 44, protein: 3.7, fat: 0.7, carbs: 9.3, fiber: 6.8, salt: 0.1, vitaminC: 120, season: "3-6月, 9-11月" },
    'レモン': { unitName: '個', stdGram: 100, calories: 54, protein: 0.9, fat: 0.7, carbs: 12.5, vitaminC: 100, season: "12-3月" },
    // 【肉】
    '鶏もも肉': { unitName: '枚', stdGram: 250, calories: 190, protein: 16.6, fat: 14.0, carbs: 0.0, salt: 0.2, magnesium: 20, zinc: 1.5, phosphorus: 150, vitaminA: 40, vitaminE: 0.3, vitaminK: 24, vitaminB1: 0.08, vitaminB2: 0.16, niacin: 5.0, vitaminB6: 0.25, vitaminB12: 0.3, folate: 6, season: ALL_YEAR },
    '鶏むね肉': { unitName: '枚', stdGram: 300, calories: 108, protein: 22.3, fat: 1.5, carbs: 0.0, salt: 0.1, magnesium: 22, zinc: 0.7, phosphorus: 190, vitaminA: 10, vitaminE: 0.2, vitaminK: 0, vitaminB1: 0.07, vitaminB2: 0.09, niacin: 11.0, vitaminB6: 0.60, vitaminB12: 0.1, folate: 3, season: ALL_YEAR },
    'ささみ': { unitName: '本', stdGram: 50, calories: 105, protein: 23.0, fat: 0.8, carbs: 0.0, salt: 0.1, season: ALL_YEAR },
    '鶏手羽先': { unitName: '本', stdGram: 60, calories: 211, protein: 17.5, fat: 16.2, carbs: 0.0, salt: 0.2, magnesium: 15, zinc: 1.2, phosphorus: 130, vitaminA: 60, vitaminE: 0.3, vitaminK: 30, vitaminB1: 0.06, vitaminB2: 0.18, niacin: 4.5, vitaminB6: 0.20, vitaminB12: 0.3, folate: 5, season: ALL_YEAR },
    '鶏ひき肉': { unitName: 'g', stdGram: 1, calories: 166, protein: 20.9, fat: 9.3, carbs: 0.0, salt: 0.1, season: ALL_YEAR },
    '豚バラ肉': { unitName: 'g', stdGram: 1, calories: 386, protein: 14.2, fat: 34.6, carbs: 0.1, season: ALL_YEAR },
    '豚ロース': { unitName: '枚', stdGram: 80, calories: 263, protein: 19.3, fat: 19.2, carbs: 0.2, magnesium: 20, zinc: 2.0, phosphorus: 160, vitaminA: 5, vitaminE: 0.4, vitaminK: 1, vitaminB1: 0.90, vitaminB2: 0.15, niacin: 5.0, vitaminB6: 0.40, vitaminB12: 0.5, folate: 2, season: ALL_YEAR },
    '豚ヒレ肉': { unitName: 'g', stdGram: 1, calories: 115, protein: 22.8, fat: 1.9, carbs: 0.2, salt: 0.1, magnesium: 25, zinc: 2.5, phosphorus: 210, vitaminA: 5, vitaminE: 0.3, vitaminK: 1, vitaminB1: 1.20, vitaminB2: 0.20, niacin: 6.0, vitaminB6: 0.60, vitaminB12: 0.6, folate: 3, season: ALL_YEAR },
    '豚ひき肉': { unitName: 'g', stdGram: 1, calories: 221, protein: 17.1, fat: 17.2, carbs: 0.1, salt: 0.1, magnesium: 18, zinc: 1.8, phosphorus: 150, vitaminA: 5, vitaminE: 0.4, vitaminK: 1, vitaminB1: 0.70, vitaminB2: 0.12, niacin: 4.5, vitaminB6: 0.35, vitaminB12: 0.4, folate: 2, season: ALL_YEAR },
    '牛もも肉': { unitName: 'g', stdGram: 1, calories: 182, protein: 21.2, fat: 9.6, carbs: 0.4, magnesium: 20, zinc: 4.5, phosphorus: 180, vitaminA: 5, vitaminE: 0.5, vitaminK: 1, vitaminB1: 0.08, vitaminB2: 0.20, niacin: 5.0, vitaminB6: 0.40, vitaminB12: 2.5, folate: 5, season: ALL_YEAR },
    '牛スジ肉': { unitName: 'g', stdGram: 1, calories: 155, protein: 28.3, fat: 4.9, carbs: 0, season: ALL_YEAR },
    '牛肉(牛切り落とし)': { unitName: 'g', stdGram: 1, calories: 318, protein: 17.5, fat: 25.8, carbs: 0.1, season: ALL_YEAR },
    '合いびき肉': { unitName: 'g', stdGram: 1, calories: 221, protein: 17.5, fat: 17.2, carbs: 0.3, season: ALL_YEAR },

    // 【魚介】
    '鮭': { unitName: '切れ', stdGram: 80, calories: 138, protein: 22.5, fat: 4.5, carbs: 0.1, vitaminD: 32, magnesium: 28, zinc: 0.5, phosphorus: 240, vitaminA: 25, vitaminE: 1.5, vitaminK: 1, vitaminB1: 0.15, vitaminB2: 0.15, niacin: 7.0, vitaminB6: 0.50, vitaminB12: 6.0, folate: 20, season: "9-11月" },
    'サーモン(刺身用)': { unitName: '柵', stdGram: 150, calories: 139, protein: 22.5, fat: 4.5, carbs: 0.1, magnesium: 28, zinc: 0.5, phosphorus: 240, vitaminA: 25, vitaminE: 1.5, vitaminK: 1, vitaminB1: 0.15, vitaminB2: 0.15, niacin: 7.0, vitaminB6: 0.50, vitaminB12: 6.0, folate: 20, season: "9-11月" },
    '鯖': { unitName: '切れ', stdGram: 100, calories: 211, protein: 20.6, fat: 16.8, carbs: 0.3, magnesium: 30, zinc: 1.0, phosphorus: 230, vitaminA: 50, vitaminE: 1.2, vitaminK: 1, vitaminB1: 0.15, vitaminB2: 0.35, niacin: 8.0, vitaminB6: 0.55, vitaminB12: 12.0, folate: 15, season: "10-2月" },
    '鯵': { unitName: '尾', stdGram: 120, calories: 121, protein: 20.7, fat: 4.5, carbs: 0.1, magnesium: 35, zinc: 1.0, phosphorus: 210, vitaminA: 10, vitaminE: 0.5, vitaminK: 1, vitaminB1: 0.12, vitaminB2: 0.15, niacin: 6.0, vitaminB6: 0.45, vitaminB12: 6.0, folate: 10, season: "5-7月" },
    '鰤': { unitName: '切れ', stdGram: 80, calories: 257, protein: 21.4, fat: 17.6, carbs: 0.3, magnesium: 30, zinc: 0.8, phosphorus: 230, vitaminA: 20, vitaminE: 2.0, vitaminK: 1, vitaminB1: 0.20, vitaminB2: 0.35, niacin: 9.0, vitaminB6: 0.50, vitaminB12: 5.0, folate: 15, season: "12-2月" },
    '秋刀魚': { unitName: '尾', stdGram: 150, calories: 310, protein: 18.5, fat: 24.6, carbs: 0.1, magnesium: 28, zinc: 0.9, phosphorus: 180, vitaminA: 200, vitaminE: 1.5, vitaminK: 10, vitaminB1: 0.05, vitaminB2: 0.25, niacin: 6.0, vitaminB6: 0.40, vitaminB12: 15.0, folate: 10, season: "9-11月" },
    '鱈': { unitName: '切れ', stdGram: 100, calories: 77, protein: 17.6, fat: 0.2, carbs: 0.1, season: "12-2月" },
    '鮪': { unitName: '柵', stdGram: 200, calories: 125, protein: 26.4, fat: 1.4, carbs: 0.1, magnesium: 26, zinc: 0.5, phosphorus: 220, vitaminA: 5, vitaminE: 0.2, vitaminK: 0, vitaminB1: 0.10, vitaminB2: 0.05, niacin: 12.0, vitaminB6: 0.80, vitaminB12: 2.5, folate: 5, season: "冬" },
    '鰹': { unitName: '柵', stdGram: 200, calories: 165, protein: 25.8, fat: 6.2, carbs: 0.2, magnesium: 40, zinc: 0.8, phosphorus: 250, vitaminA: 10, vitaminE: 0.3, vitaminK: 0, vitaminB1: 0.12, vitaminB2: 0.15, niacin: 18.0, vitaminB6: 0.90, vitaminB12: 8.0, folate: 10, season: "4-6月, 9-10月" },
    '真鯛': { unitName: '切れ', stdGram: 100, calories: 142, protein: 20.6, fat: 5.8, carbs: 0.1, magnesium: 28, zinc: 0.5, phosphorus: 180, vitaminA: 15, vitaminE: 0.6, vitaminK: 0, vitaminB1: 0.15, vitaminB2: 0.08, niacin: 5.0, vitaminB6: 0.35, vitaminB12: 1.5, folate: 5, season: "3-6月" },
    'ブリ': { unitName: '切れ', stdGram: 80, calories: 257, protein: 21.4, fat: 17.6, carbs: 0.3, magnesium: 30, zinc: 0.8, phosphorus: 230, vitaminA: 20, vitaminE: 2.0, vitaminK: 1, vitaminB1: 0.20, vitaminB2: 0.35, niacin: 9.0, vitaminB6: 0.50, vitaminB12: 5.0, folate: 15, season: "12-2月" },
    'イワシ': { unitName: '尾', stdGram: 80, calories: 169, protein: 19.2, fat: 10.2, carbs: 0.1, season: "6-10月" },
    'カレイ': { unitName: '切れ', stdGram: 100, calories: 95, protein: 19.6, fat: 1.3, carbs: 0.1, season: "12-2月" },
    'ヒラメ': { unitName: '切れ', stdGram: 100, calories: 124, protein: 20.0, fat: 4.4, carbs: 0.0, season: "11-2月" },
    'ホタテ': { unitName: '個', stdGram: 30, calories: 72, protein: 13.5, fat: 0.9, carbs: 1.5, season: "12-3月" },
    'いくら': { unitName: 'g', stdGram: 1, calories: 272, protein: 32.6, fat: 15.6, carbs: 0.2, salt: 2.3, season: "9-11月" },
    'たらこ': { unitName: '腹', stdGram: 50, calories: 140, protein: 24.0, fat: 4.7, carbs: 0.4, salt: 4.6, season: "11-2月" },
    '明太子': { unitName: '腹', stdGram: 50, calories: 126, protein: 21.0, fat: 3.3, carbs: 3.0, salt: 5.6, season: "11-2月" },
    'しらす': { unitName: 'g', stdGram: 1, calories: 206, protein: 40.5, fat: 3.5, carbs: 0.5, salt: 4.1, season: "3-5月, 9-10月" },
    'もずく': { unitName: 'g', stdGram: 1, calories: 4, protein: 0.2, fat: 0.1, carbs: 1.4, season: "4-6月" },
    'わかめ': { unitName: 'g', stdGram: 1, calories: 11, protein: 1.9, fat: 0.2, carbs: 3.6, season: "3-5月" },
    'めかぶ': { unitName: 'g', stdGram: 1, calories: 11, protein: 1.0, fat: 0.2, carbs: 3.4, season: "3-5月" },
    '海老': { unitName: '尾', stdGram: 20, calories: 91, protein: 19.6, fat: 0.7, carbs: 0.3, season: ALL_YEAR },
    'いか': { unitName: '杯', stdGram: 200, calories: 88, protein: 18.1, fat: 1.2, carbs: 0.2, season: ALL_YEAR },
    'あさり': { unitName: '個', stdGram: 10, calories: 30, protein: 6.0, fat: 0.3, carbs: 0.4, season: "3-5月" },
    '牡蠣': { unitName: '個', stdGram: 20, calories: 60, protein: 6.6, fat: 1.4, carbs: 4.7, season: "11-2月" },
    'ツナ缶': { unitName: '缶', stdGram: 70, calories: 200, protein: 12, fat: 17, carbs: 0.1, salt: 0.7, season: ALL_YEAR },

    // 【調味料・油・ベース】
    '砂糖': { unitName: 'g', stdGram: 1, calories: 384, protein: 0, fat: 0, carbs: 99.2, season: ALL_YEAR, seasoningType: '粉末' },
    '塩': { unitName: 'g', stdGram: 1, calories: 0, protein: 0, fat: 0, carbs: 0, salt: 99, season: ALL_YEAR, seasoningType: '粉末' },
    '醤油': { unitName: 'g', stdGram: 1, calories: 71, protein: 7.7, fat: 0, carbs: 10.1, salt: 14.5, season: ALL_YEAR, seasoningType: '液体' },
    '味噌': { unitName: 'g', stdGram: 1, calories: 190, protein: 12, fat: 6, carbs: 25, salt: 12.4, season: ALL_YEAR, seasoningType: 'その他' },
    '酢': { unitName: 'g', stdGram: 1, calories: 25, protein: 0, fat: 0, carbs: 2.4, season: ALL_YEAR, seasoningType: '液体' },
    'みりん': { unitName: 'g', stdGram: 1, calories: 241, protein: 0.3, fat: 0, carbs: 43.2, season: ALL_YEAR, seasoningType: '液体' },
    '酒': { unitName: 'g', stdGram: 1, calories: 105, protein: 0.4, fat: 0, carbs: 4.5, season: ALL_YEAR, seasoningType: '液体' },
    '料理酒': { unitName: 'g', stdGram: 1, calories: 100, protein: 0.4, fat: 0, carbs: 3, salt: 2, season: ALL_YEAR, seasoningType: '液体' },
    '赤ワイン': { unitName: 'g', stdGram: 1, calories: 73, protein: 0.2, fat: 0, carbs: 1.5, season: ALL_YEAR, seasoningType: '液体' },
    '白ワイン': { unitName: 'g', stdGram: 1, calories: 73, protein: 0.1, fat: 0, carbs: 2.0, season: ALL_YEAR, seasoningType: '液体' },
    'レモン汁': { unitName: 'g', stdGram: 1, calories: 26, protein: 0.4, fat: 0.1, carbs: 8.6, vitaminC: 50, season: "12-3月", seasoningType: '液体' },
    'マヨネーズ': { unitName: 'g', stdGram: 1, calories: 703, protein: 1.5, fat: 75, carbs: 4.5, season: ALL_YEAR, seasoningType: 'その他' },
    'ケチャップ': { unitName: 'g', stdGram: 1, calories: 119, protein: 1.6, fat: 0, carbs: 28, season: ALL_YEAR, seasoningType: 'その他' },
    'オリーブオイル': { unitName: 'g', stdGram: 1, calories: 884, protein: 0, fat: 100, carbs: 0, season: ALL_YEAR, seasoningType: '油' },
    'ごま油': { unitName: 'g', stdGram: 1, calories: 884, protein: 0, fat: 100, carbs: 0, season: ALL_YEAR, seasoningType: '油' },
    'サラダ油': { unitName: 'g', stdGram: 1, calories: 884, protein: 0, fat: 100, carbs: 0, season: ALL_YEAR, seasoningType: '油' },
    'バター': { unitName: 'g', stdGram: 1, calories: 745, protein: 0.6, fat: 81, carbs: 0.2, salt: 1.9, season: ALL_YEAR, seasoningType: 'その他' },

    // 【スパイス・ハーブ (S&B Dictionary準拠 - 1g基本)】
    'ブラックペッパー': { unitName: 'g', stdGram: 1, calories: 3.7, protein: 0.1, fat: 0.06, carbs: 0.68, isPerGram: true, season: ALL_YEAR, seasoningType: '粉末' },
    'ホワイトペッパー': { unitName: 'g', stdGram: 1, calories: 3.8, protein: 0.1, fat: 0.02, carbs: 0.79, isPerGram: true, season: ALL_YEAR, seasoningType: '粉末' },
    '唐辛子': { unitName: 'g', stdGram: 1, calories: 3.5, protein: 0.1, fat: 0.1, carbs: 0.6, isPerGram: true, season: "7-10月", seasoningType: '粉末' },
    'ナツメグ': { unitName: 'g', stdGram: 1, calories: 5.3, protein: 0.06, fat: 0.36, carbs: 0.49, isPerGram: true, season: ALL_YEAR, seasoningType: '粉末' },
    'シナモン': { unitName: 'g', stdGram: 1, calories: 3.6, protein: 0.04, fat: 0.02, carbs: 0.8, isPerGram: true, season: ALL_YEAR, seasoningType: '粉末' },
    'クミン': { unitName: 'g', stdGram: 1, calories: 4.4, protein: 0.18, fat: 0.22, carbs: 0.44, isPerGram: true, season: ALL_YEAR, seasoningType: '粉末' },
    'コリアンダー': { unitName: 'g', stdGram: 1, calories: 3.0, protein: 0.12, fat: 0.18, carbs: 0.55, isPerGram: true, season: ALL_YEAR, seasoningType: '粉末' },
    'ターメリック': { unitName: 'g', stdGram: 1, calories: 3.5, protein: 0.08, fat: 0.1, carbs: 0.65, isPerGram: true, season: ALL_YEAR, seasoningType: '粉末' },
    'バジル': { unitName: 'g', stdGram: 1, calories: 0.2, protein: 0.03, fat: 0.01, carbs: 0.03, isPerGram: true, season: "6-9月", seasoningType: '粉末' },
    'オレガノ': { unitName: 'g', stdGram: 1, calories: 3.0, protein: 0.1, fat: 0.04, carbs: 0.69, isPerGram: true, season: ALL_YEAR, seasoningType: '粉末' },
    'ローズマリー': { unitName: 'g', stdGram: 1, calories: 1.3, protein: 0.03, fat: 0.06, carbs: 0.2, isPerGram: true, season: ALL_YEAR, seasoningType: '粉末' },
    'タイム': { unitName: 'g', stdGram: 1, calories: 1.0, protein: 0.06, fat: 0.02, carbs: 0.24, isPerGram: true, season: ALL_YEAR, seasoningType: '粉末' },
    'ローリエ': { unitName: 'g', stdGram: 1, calories: 3.5, protein: 0.08, fat: 0.08, carbs: 0.75, isPerGram: true, season: ALL_YEAR, seasoningType: '粉末' },
    '山椒': { unitName: 'g', stdGram: 1, calories: 3.7, protein: 0.1, fat: 0.06, carbs: 0.7, isPerGram: true, season: "5-7月", seasoningType: '粉末' },
    'わさび': { unitName: 'g', stdGram: 1, calories: 0.9, protein: 0.05, fat: 0.01, carbs: 0.15, isPerGram: true, season: "11-2月", seasoningType: 'その他' },
    'からし': { unitName: 'g', stdGram: 1, calories: 3.2, protein: 0.13, fat: 0.15, carbs: 0.32, isPerGram: true, season: ALL_YEAR, seasoningType: 'その他' },
    'カレー粉': { unitName: 'g', stdGram: 1, calories: 4.2, protein: 0.13, fat: 0.14, carbs: 0.58, isPerGram: true, season: ALL_YEAR, seasoningType: '粉末' },
    '柚子こしょう': { unitName: 'g', stdGram: 1, calories: 0.4, protein: 0.01, fat: 0.01, carbs: 0.09, isPerGram: true, season: "10-12月", seasoningType: 'その他' },

    // 【主食・穀物・麺】
    'ごはん': { unitName: 'g', stdGram: 1, calories: 156, protein: 2.5, fat: 0.3, carbs: 37.1, season: ALL_YEAR },
    'ご飯': { unitName: 'g', stdGram: 1, calories: 156, protein: 2.5, fat: 0.3, carbs: 37.1, season: ALL_YEAR },
    'パスタ': { unitName: 'g', stdGram: 1, calories: 347, protein: 13, fat: 2, carbs: 69, season: ALL_YEAR },
    'うどん': { unitName: '玉', stdGram: 200, calories: 105, protein: 2.6, fat: 0.4, carbs: 21.6, season: ALL_YEAR },
    'そば': { unitName: '玉', stdGram: 200, calories: 114, protein: 4.8, fat: 0.7, carbs: 22.1, season: "10-12月" },
    '中華麺': { unitName: '玉', stdGram: 150, calories: 281, protein: 8.6, fat: 1.2, carbs: 55.7, season: ALL_YEAR },
    'そうめん': { unitName: '束', stdGram: 50, calories: 356, protein: 9.5, fat: 1.1, carbs: 70.5, magnesium: 28, zinc: 0.7, phosphorus: 110, vitaminA: 0, vitaminE: 0.3, vitaminK: 0, vitaminB1: 0.08, vitaminB2: 0.03, niacin: 0.8, vitaminB6: 0.04, vitaminB12: 0, folate: 16, season: ALL_YEAR },
    '食パン': { unitName: '枚', stdGram: 60, calories: 264, protein: 9.3, fat: 4.4, carbs: 46.7, magnesium: 19, zinc: 0.8, phosphorus: 88, vitaminA: 0, vitaminE: 0.2, vitaminK: 1, vitaminB1: 0.07, vitaminB2: 0.03, niacin: 1.1, vitaminB6: 0.03, vitaminB12: 0, folate: 29, season: ALL_YEAR },
    '餅': { unitName: '個', stdGram: 50, calories: 235, protein: 4.2, fat: 0.8, carbs: 50.3, magnesium: 7, zinc: 0.6, phosphorus: 34, vitaminA: 0, vitaminE: 0, vitaminK: 0, vitaminB1: 0.02, vitaminB2: 0.01, niacin: 0.2, vitaminB6: 0.02, vitaminB12: 0, folate: 2, season: "12-1月" },

    // 【乳製品・卵・大豆製品】
    '卵': { unitName: '個', stdGram: 50, calories: 151, protein: 12.3, fat: 10.3, carbs: 0.3, magnesium: 11, zinc: 1.3, phosphorus: 210, vitaminA: 210, vitaminE: 1.0, vitaminK: 13, vitaminB1: 0.06, vitaminB2: 0.43, niacin: 0.1, vitaminB6: 0.08, vitaminB12: 1.1, folate: 43, season: ALL_YEAR },
    'ゆで卵': { unitName: '個', stdGram: 50, calories: 151, protein: 12.3, fat: 10.3, carbs: 0.3, magnesium: 11, zinc: 1.3, phosphorus: 210, vitaminA: 210, vitaminE: 1.0, vitaminK: 13, vitaminB1: 0.06, vitaminB2: 0.43, niacin: 0.1, vitaminB6: 0.08, vitaminB12: 1.1, folate: 43, season: ALL_YEAR },
    '牛乳': { unitName: 'ml', stdGram: 1, calories: 61, protein: 3.3, fat: 3.8, carbs: 4.8, magnesium: 10, zinc: 0.4, phosphorus: 93, vitaminA: 38, vitaminE: 0.1, vitaminK: 2, vitaminB1: 0.04, vitaminB2: 0.15, niacin: 0.1, vitaminB6: 0.03, vitaminB12: 0.3, folate: 5, season: ALL_YEAR },
    'ヨーグルト': { unitName: 'g', stdGram: 1, calories: 62, protein: 3.6, fat: 3.0, carbs: 4.9, season: ALL_YEAR },
    '豆腐': { unitName: '丁', stdGram: 300, calories: 56, protein: 4.9, fat: 3, carbs: 2, magnesium: 50, zinc: 0.6, phosphorus: 90, vitaminA: 0, vitaminE: 0, vitaminK: 10, vitaminB1: 0.10, vitaminB2: 0.04, niacin: 0.1, vitaminB6: 0.05, vitaminB12: 0, folate: 15, season: ALL_YEAR },
    '納豆': { unitName: 'パック', stdGram: 50, calories: 200, protein: 16.5, fat: 10, carbs: 12, magnesium: 100, zinc: 1.9, phosphorus: 190, vitaminA: 0, vitaminE: 0.5, vitaminK: 600, vitaminB1: 0.07, vitaminB2: 0.56, niacin: 1.1, vitaminB6: 0.24, vitaminB12: 0, folate: 120, season: ALL_YEAR },
    '厚揚げ': { unitName: '枚', stdGram: 150, calories: 150, protein: 10.7, fat: 11.3, carbs: 0.9, magnesium: 100, zinc: 1.5, phosphorus: 210, vitaminA: 0, vitaminE: 0.4, vitaminK: 20, vitaminB1: 0.07, vitaminB2: 0.03, niacin: 0.1, vitaminB6: 0.06, vitaminB12: 0, folate: 12, season: ALL_YEAR },
    '油揚げ': { unitName: '枚', stdGram: 20, calories: 386, protein: 18.6, fat: 34.4, carbs: 2.5, magnesium: 130, zinc: 2.1, phosphorus: 280, vitaminA: 0, vitaminE: 0.8, vitaminK: 40, vitaminB1: 0.08, vitaminB2: 0.04, niacin: 0.1, vitaminB6: 0.07, vitaminB12: 0, folate: 15, season: ALL_YEAR },
    '豆乳': { unitName: 'ml', stdGram: 1, calories: 46, protein: 3.6, fat: 2.0, carbs: 3.1, magnesium: 25, zinc: 0.4, phosphorus: 49, vitaminA: 0, vitaminE: 0.1, vitaminK: 2, vitaminB1: 0.03, vitaminB2: 0.02, niacin: 0.2, vitaminB6: 0.04, vitaminB12: 0, folate: 23, season: ALL_YEAR },

    // 【チーズ細分化】
    'プロセスチーズ': { unitName: 'g', stdGram: 1, calories: 339, protein: 22.7, fat: 26, carbs: 1.3, salt: 2.8, magnesium: 26, zinc: 3.2, phosphorus: 730, vitaminA: 260, vitaminE: 0.5, vitaminK: 8, vitaminB1: 0.03, vitaminB2: 0.38, niacin: 0.1, vitaminB6: 0.08, vitaminB12: 1.0, folate: 15, calcium: 630, season: ALL_YEAR },
    'クリームチーズ': { unitName: 'g', stdGram: 1, calories: 346, protein: 8.2, fat: 33, carbs: 2.3, salt: 0.7, magnesium: 5, zinc: 0.5, phosphorus: 88, vitaminA: 340, vitaminE: 0.4, vitaminK: 6, vitaminB1: 0.02, vitaminB2: 0.15, niacin: 0.1, vitaminB6: 0.03, vitaminB12: 0.3, folate: 10, calcium: 70, season: ALL_YEAR },
    'パルメザンチーズ': { unitName: 'g', stdGram: 1, calories: 475, protein: 44.0, fat: 30.8, carbs: 1.9, salt: 3.8, magnesium: 45, zinc: 4.0, phosphorus: 800, vitaminA: 380, vitaminE: 0.6, vitaminK: 12, vitaminB1: 0.04, vitaminB2: 0.45, niacin: 0.1, vitaminB6: 0.10, vitaminB12: 1.5, folate: 20, calcium: 1100, season: ALL_YEAR },
    'モッツァレラチーズ': { unitName: 'g', stdGram: 1, calories: 280, protein: 18.4, fat: 19.9, carbs: 2.3, salt: 0.2, magnesium: 10, zinc: 2.2, phosphorus: 350, vitaminA: 150, vitaminE: 0.3, vitaminK: 5, vitaminB1: 0.02, vitaminB2: 0.25, niacin: 0.1, vitaminB6: 0.05, vitaminB12: 0.5, folate: 10, calcium: 400, season: ALL_YEAR },
    'チェダーチーズ': { unitName: 'g', stdGram: 1, calories: 403, protein: 24.9, fat: 33.1, carbs: 1.3, salt: 1.8, magnesium: 28, zinc: 3.1, phosphorus: 512, vitaminA: 260, vitaminE: 0.6, vitaminK: 10, vitaminB1: 0.03, vitaminB2: 0.35, niacin: 0.1, vitaminB6: 0.06, vitaminB12: 0.8, folate: 18, calcium: 720, season: ALL_YEAR },
    'ブルーチーズ': { unitName: 'g', stdGram: 1, calories: 353, protein: 21.4, fat: 28.7, carbs: 2.0, salt: 3.8, magnesium: 21, zinc: 2.6, phosphorus: 387, vitaminA: 190, vitaminE: 0.5, vitaminK: 8, vitaminB1: 0.03, vitaminB2: 0.38, niacin: 1.0, vitaminB6: 0.16, vitaminB12: 1.2, folate: 36, calcium: 526, season: ALL_YEAR },
    'カマンベールチーズ': { unitName: 'g', stdGram: 1, calories: 310, protein: 19.1, fat: 24.7, carbs: 0.9, salt: 2.0, magnesium: 20, zinc: 2.8, phosphorus: 350, vitaminA: 210, vitaminE: 0.6, vitaminK: 10, vitaminB1: 0.04, vitaminB2: 0.48, niacin: 0.7, vitaminB6: 0.23, vitaminB12: 1.3, folate: 52, calcium: 460, season: ALL_YEAR },
    'リコッタチーズ': { unitName: 'g', stdGram: 1, calories: 174, protein: 11.3, fat: 13.0, carbs: 3.0, salt: 0.3, magnesium: 11, zinc: 1.1, phosphorus: 158, vitaminA: 110, vitaminE: 0.2, vitaminK: 3, vitaminB1: 0.02, vitaminB2: 0.20, niacin: 0.1, vitaminB6: 0.04, vitaminB12: 0.3, folate: 12, calcium: 200, season: ALL_YEAR },
    'チーズ': { unitName: 'g', stdGram: 1, calories: 339, protein: 22.7, fat: 26, carbs: 1.3, magnesium: 26, zinc: 3.2, phosphorus: 730, vitaminA: 260, vitaminE: 0.5, vitaminK: 8, vitaminB1: 0.03, vitaminB2: 0.38, niacin: 0.1, vitaminB6: 0.08, vitaminB12: 1.0, folate: 15, calcium: 630, season: ALL_YEAR },

    // 【果物】
    'りんご': { unitName: '個', stdGram: 300, calories: 54, protein: 0.2, fat: 0.1, carbs: 15, magnesium: 3, zinc: 0, phosphorus: 12, vitaminA: 0, vitaminE: 0.2, vitaminK: 0, vitaminB1: 0.02, vitaminB2: 0.01, niacin: 0.1, vitaminB6: 0.04, vitaminB12: 0, folate: 2, season: "10-2月" },
    'バナナ': { unitName: '本', stdGram: 150, calories: 86, protein: 1.1, fat: 0.2, carbs: 22.5, magnesium: 32, zinc: 0.2, phosphorus: 27, vitaminA: 5, vitaminE: 0.1, vitaminK: 0, vitaminB1: 0.05, vitaminB2: 0.04, niacin: 0.7, vitaminB6: 0.38, vitaminB12: 0, folate: 26, season: ALL_YEAR },
    'いちご': { unitName: '個', stdGram: 15, calories: 34, protein: 0.9, fat: 0.1, carbs: 8.5, vitaminC: 62, magnesium: 13, zinc: 0.1, phosphorus: 18, vitaminA: 1, vitaminE: 0.2, vitaminK: 0, vitaminB1: 0.03, vitaminB2: 0.02, niacin: 0.3, vitaminB6: 0.04, vitaminB12: 0, folate: 90, season: "12-5月" },
    'みかん': { unitName: '個', stdGram: 100, calories: 45, protein: 0.7, fat: 0.1, carbs: 11.5, vitaminC: 35, magnesium: 10, zinc: 0.1, phosphorus: 13, vitaminA: 80, vitaminE: 0.3, vitaminK: 1, vitaminB1: 0.08, vitaminB2: 0.03, niacin: 0.3, vitaminB6: 0.06, vitaminB12: 0, folate: 22, season: "10-2月" },
    'アボカド': { unitName: '個', stdGram: 150, calories: 187, protein: 2.5, fat: 18.7, carbs: 6.2, magnesium: 33, zinc: 0.7, phosphorus: 52, vitaminA: 7, vitaminE: 3.3, vitaminK: 26, vitaminB1: 0.10, vitaminB2: 0.05, niacin: 1.9, vitaminB6: 0.32, vitaminB12: 0, folate: 84, season: "3-9月" },
    'ぶどう': { unitName: '房', stdGram: 300, calories: 59, protein: 0.4, fat: 0.1, carbs: 15.7, season: "8-10月" },
    '梨': { unitName: '個', stdGram: 300, calories: 38, protein: 0.3, fat: 0.1, carbs: 11.3, season: "8-10月" },
    '柿': { unitName: '個', stdGram: 200, calories: 60, protein: 0.4, fat: 0.2, carbs: 15.9, season: "10-12月" },
    '桃': { unitName: '個', stdGram: 250, calories: 40, protein: 0.6, fat: 0.1, carbs: 10.2, season: "7-8月" },
    'キウイ': { unitName: '個', stdGram: 100, calories: 53, protein: 1.0, fat: 0.1, carbs: 13.5, vitaminC: 69, season: "11-4月" },

};
