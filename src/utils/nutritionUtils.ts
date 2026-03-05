import { INGREDIENT_STANDARD } from '../data/IngredientStandardDictionary';
import { SubstituteData } from '../data/SubstituteDictionary';

export interface NutritionResult {
    calories: number;
    protein: string;
    fat: string;
    carbs: string;
    sugar: string;
    fiber: string;
    salt: string;
    calcium: number;
    iron: string;
    magnesium: number;
    potassium: number;
    zinc: string;
    phosphorus: number;
    vitaminA: number;
    vitaminD: string;
    vitaminE: string;
    vitaminK: number;
    vitaminB1: string;
    vitaminB2: string;
    vitaminB6: string;
    vitaminB12: string;
    folate: number;
    niacin: string;
    vitaminC: number;
}

/**
 * 食材が標準データ（INGREDIENT_STANDARD）に存在するかチェックする
 */
export const isIngredientValid = (name: string): boolean => {
    return !!INGREDIENT_STANDARD[name];
};

/**
 * 文字列の分量をパースして数値と単位に分割する
 * 例: "100g" -> { value: 100, unit: "g" }
 * 例: "大さじ1" -> { value: 1, unit: "大さじ" }
 */
export const parseAmount = (amountStr: string): { value: number; unit: string; originalNumStr?: string } => {
    // かっこ内の情報（約...等）を削除してクリーンにする
    const cleanStr = amountStr.replace(/\s*\(.*?\)/g, '').trim();
    if (!cleanStr) return { value: 0, unit: '' };

    const parseNum = (numStr: string) => {
        if (numStr.includes('/')) {
            const parts = numStr.split('/');
            const num = parseFloat(parts[0]);
            const den = parseFloat(parts[1]);
            if (!isNaN(num) && !isNaN(den) && den !== 0) return num / den;
            return isNaN(num) ? 0 : num;
        }
        return parseFloat(numStr) || 0;
    };

    // 1. 数値 + 単位 のパターン (例: 100g)
    const matchNormal = cleanStr.match(/^([0-9.\/]+)\s*(.*)$/);
    if (matchNormal) {
        const numStr = matchNormal[1];
        const value = parseNum(numStr);
        const unit = matchNormal[2].trim();
        if (unit && !/^[0-9.\/]+$/.test(unit)) {
            return { value, unit, originalNumStr: numStr };
        } else if (!unit) {
            return { value, unit: '', originalNumStr: numStr };
        }
    }

    // 2. 単位 + 数値 のパターン (例: 大さじ1)
    const matchPrefix = cleanStr.match(/^(大さじ|小さじ|カップ|合|個|本|枚|束|片|株|缶|袋|パック|g|ml|kg|L)\s*([0-9.\/]+)$/);
    if (matchPrefix) {
        const unit = matchPrefix[1];
        const numStr = matchPrefix[2];
        const value = parseNum(numStr);
        return { value, unit, originalNumStr: numStr };
    }

    // 3. その他数値のみ等
    const numericMatch = cleanStr.match(/([0-9.\/]+)/);
    if (numericMatch) {
        const numStr = numericMatch[1];
        const value = parseNum(numStr);
        return { value, unit: cleanStr.replace(numericMatch[0], '').trim(), originalNumStr: numStr };
    }

    return { value: 0, unit: cleanStr };
};

/**
 * 数値と単位から適切な表示文字列を生成する
 * 例: (1, "大さじ") -> "大さじ1"
 * 例: (100, "g") -> "100g"
 */
export const formatAmount = (value: number | string, unit: string): string => {
    const valStr = value.toString();
    if (!unit) return valStr;

    const prefixUnits = ['大さじ', '小さじ'];
    if (prefixUnits.includes(unit)) {
        return `${unit}${valStr}`;
    }
    return `${valStr}${unit}`;
};

/**
 * 単位を自動的に補完・変換する
 * 例: "100" -> { amount: "100", unit: "g" }
 * 例: "1000" -> { amount: "1", unit: "kg" }
 */
export const autoFormatAmount = (value: string): { amount: string; unit: string } | null => {
    // 数値のみ（整数または小数）の場合のみ処理
    if (!/^[0-9.]+$/.test(value)) return null;

    const num = parseFloat(value);
    if (isNaN(num)) return null;

    if (num >= 1000) {
        return { amount: (num / 1000).toString(), unit: 'kg' };
    } else {
        return { amount: value, unit: 'g' };
    }
};

/**
 * 全体の栄養素を計算する
 */
export const calculateNutrition = (
    ingredients: any[],
    baseServings: number,
    substitutedIngredients: Record<string, SubstituteData> = {}
): NutritionResult => {
    const ratioForOne = 1 / (baseServings || 1);

    let totals = {
        calories: 0, protein: 0, fat: 0, carbs: 0,
        sugar: 0, fiber: 0, salt: 0, calcium: 0, iron: 0,
        magnesium: 0, potassium: 0, zinc: 0, phosphorus: 0,
        vitaminA: 0, vitaminD: 0, vitaminE: 0, vitaminK: 0,
        vitaminB1: 0, vitaminB2: 0, vitaminB6: 0, vitaminB12: 0,
        folate: 0, niacin: 0, vitaminC: 0
    };

    ingredients.forEach(ing => {
        // MasterRecipe形式とSavedRecipe形式の両方に対応
        let name = ing.name;
        let amount = typeof ing.amount === 'number' ? ing.amount : 0;
        let unit = ing.unit || '';
        let gramPerUnit = ing.gramPerUnit;

        if (typeof ing.amount === 'string') {
            const parsed = parseAmount(ing.amount);
            amount = parsed.value;
            unit = parsed.unit;
        }

        const sub = substitutedIngredients[name];
        const data = INGREDIENT_STANDARD[name];
        let gram = 0;

        // 1人前あたりのグラム数を特定
        if (gramPerUnit) {
            gram = (amount * gramPerUnit) * ratioForOne;
        } else if (unit === 'g' || unit === 'ml' || unit === 'グラム') {
            gram = amount * ratioForOne;
        } else if (unit === 'kg') {
            gram = (amount * 1000) * ratioForOne;
        } else if (data) {
            gram = (amount * data.stdGram) * ratioForOne;
        }

        const source = sub || data;
        if (source) {
            const factor = source.isPerGram ? gram : (gram / 100);
            totals.calories += (source.calories * factor);
            totals.protein += (source.protein * factor);
            totals.fat += (source.fat * factor);
            totals.carbs += (source.carbs * factor);
            totals.sugar += ((source.sugar || 0) * factor);
            totals.fiber += ((source.fiber || 0) * factor);
            totals.salt += ((source.salt || 0) * factor);
            totals.calcium += ((source.calcium || 0) * factor);
            totals.iron += ((source.iron || 0) * factor);
            totals.magnesium += ((source.magnesium || 0) * factor);
            totals.potassium += ((source.potassium || 0) * factor);
            totals.zinc += ((source.zinc || 0) * factor);
            totals.phosphorus += ((source.phosphorus || 0) * factor);
            totals.vitaminA += ((source.vitaminA || 0) * factor);
            totals.vitaminD += ((source.vitaminD || 0) * factor);
            totals.vitaminE += ((source.vitaminE || 0) * factor);
            totals.vitaminK += ((source.vitaminK || 0) * factor);
            totals.vitaminB1 += ((source.vitaminB1 || 0) * factor);
            totals.vitaminB2 += ((source.vitaminB2 || 0) * factor);
            totals.vitaminB6 += ((source.vitaminB6 || 0) * factor);
            totals.vitaminB12 += ((source.vitaminB12 || 0) * factor);
            totals.folate += ((source.folate || 0) * factor);

            totals.niacin += ((source.niacin || 0) * factor);
            totals.vitaminC += ((source.vitaminC || 0) * factor);
        }
    });

    return {
        calories: Math.round(totals.calories),
        protein: totals.protein.toFixed(1),
        fat: totals.fat.toFixed(1),
        carbs: totals.carbs.toFixed(1),
        sugar: totals.sugar.toFixed(1),
        fiber: totals.fiber.toFixed(1),
        salt: totals.salt.toFixed(1),
        calcium: Math.round(totals.calcium),
        iron: totals.iron.toFixed(1),
        magnesium: Math.round(totals.magnesium),
        potassium: Math.round(totals.potassium),
        zinc: totals.zinc.toFixed(1),
        phosphorus: Math.round(totals.phosphorus),
        vitaminA: Math.round(totals.vitaminA),
        vitaminD: totals.vitaminD.toFixed(1),
        vitaminE: totals.vitaminE.toFixed(1),
        vitaminK: Math.round(totals.vitaminK),
        vitaminB1: totals.vitaminB1.toFixed(2),
        vitaminB2: totals.vitaminB2.toFixed(2),
        vitaminB6: totals.vitaminB6.toFixed(2),
        vitaminB12: totals.vitaminB12.toFixed(1),
        folate: Math.round(totals.folate),
        niacin: totals.niacin.toFixed(1),
        vitaminC: Math.round(totals.vitaminC)
    };
};
