import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { deleteImageFromStorage } from './imageUtils';

// 保存するレシピデータの型定義
export interface SavedIngredient {
    name: string;
    amount: string;
    group?: string; // 【追加】A, B, C 等のグループラベル
    is_seasoning?: boolean; // 【追加】調味料かどうか
}

export interface SavedRecipe {
    id: string; // 一意のID (Date.now() 等を使用)
    isOriginal: boolean; // 完全オリジナルレシピかどうかのフラグ
    originalRecipeId?: string; // 元になったレシピのID（オリジナルの場合はundefined）
    imageUrl?: string; // 【追加】ユーザーが設定したオリジナル画像のURI
    title: string;
    ingredients: SavedIngredient[];
    steps: string[];
    stepTips?: string[]; // 【追加】手順ごとのメモ（ポイント）
    note: string;
    categories?: string[]; // 【追加】カテゴリ（ジャンル）情報
    createdAt: number; // 保存日時（タイムスタンプ）
}

// マスターレシピ（管理・詳細データを含む）の型定義
export interface MasterRecipe {
    id: string;
    title: string;
    time: string;
    imageUrl: string;
    difficultyLevel: number;
    categories: string[];  // 複数カテゴリを配列で保持する
    baseServings: number;
    ingredients: { name: string; amount: number | string; unit: string; gramPerUnit?: number; group?: string; is_seasoning?: boolean }[];
    steps: string[];
    isSponsored?: boolean;
}

const STORAGE_KEY = '@cooking_app_my_recipes';
const FAVORITES_KEY = '@cooking_app_favorites';
const MASTER_RECIPES_KEY = '@cooking_app_master_recipes'; // 管理用マスターデータ
const FEEDBACK_KEY = '@cooking_app_feedbacks'; // 【追加】ユーザーフィードバック
const LAST_READ_FEEDBACK_KEY = '@cooking_app_last_read_feedback'; // 【追加】最終閲覧時刻

// 初期データ（これを AsyncStorage に一回だけ入れる）
const INITIAL_MASTER_RECIPES: MasterRecipe[] = [
    {
        id: '1',
        title: 'フライパン1つで！簡単とろとろオムライス',
        time: '15分',
        imageUrl: '',
        difficultyLevel: 2,
        categories: ['western', 'quick'],
        baseServings: 2,
        ingredients: [
            { name: 'ご飯', amount: 300, unit: 'g' },
            { name: '鶏もも肉', amount: 100, unit: 'g' },
            { name: '玉ねぎ', amount: 0.5, unit: '個' },
            { name: 'ケチャップ', amount: 3, unit: '大さじ', gramPerUnit: 15 },
            { name: '卵', amount: 3, unit: '個' },
            { name: '牛乳', amount: 2, unit: '大さじ', gramPerUnit: 15 },
        ],
        steps: [
            '鶏肉と玉ねぎを細かく切る。',
            'フライパンに油をひき、鶏肉と玉ねぎを炒める。',
            'ご飯とケチャップを加えて炒め合わせ、一旦お皿に取り出す。',
            '卵と牛乳を混ぜ、同じフライパンで半熟状に焼く。',
            'チキンライスの上に卵をのせて完成！',
        ],
        isSponsored: true,
    },
    {
        id: '2',
        title: '豚の角煮',
        time: '60分',
        difficultyLevel: 3,
        categories: ['japanese'],
        imageUrl: '',
        baseServings: 4,
        ingredients: [
            { name: '豚バラブロック', amount: 500, unit: 'g' },
            { name: '大根', amount: 0.5, unit: '本' },
            { name: 'ゆで卵', amount: 4, unit: '個' },
            { name: '醤油', amount: 4, unit: '大さじ' },
            { name: '砂糖', amount: 3, unit: '大さじ' },
            { name: '酒', amount: 50, unit: 'ml' },
        ],
        steps: [
            '豚肉を大きめに切り、表面に焼き色をつける。',
            '大根は厚めの半月切りにする。',
            '鍋に豚肉、大根、調味料を入れ、落とし蓋をして弱火で40分煮る。',
            'ゆで卵を加え、さらに10分煮込んで味を染み込ませる。',
        ]
    },
    {
        id: '3',
        title: '絶品！トマトカレー',
        time: '30分',
        difficultyLevel: 2,
        categories: ['western'],
        imageUrl: '',
        baseServings: 4,
        ingredients: [
            { name: '鶏もも肉', amount: 300, unit: 'g' },
            { name: '玉ねぎ', amount: 1, unit: '個' },
            { name: 'トマト缶', amount: 1, unit: '缶' },
            { name: 'カレールー', amount: 4, unit: 'かけ' },
            { name: '水', amount: 200, unit: 'ml' },
        ],
        steps: [
            '鶏肉と玉ねぎを一口大に切る。',
            '鍋で鶏肉と玉ねぎを炒める。',
            'トマト缶と水を加え、15分煮込む。',
            '火を止め、カレールーを溶かし入れてさらに5分煮る。',
        ]
    },
    {
        id: '4',
        title: '5分で完成！無限ピーマン',
        time: '5分',
        difficultyLevel: 1,
        categories: ['japanese', 'quick', 'healthy'],
        imageUrl: '',
        baseServings: 2,
        ingredients: [
            { name: 'ピーマン', amount: 4, unit: '個' },
            { name: 'ツナ缶', amount: 1, unit: '缶' },
            { name: 'ごま油', amount: 1, unit: '大さじ' },
            { name: '鶏ガラスープの素', amount: 1, unit: '小さじ' },
        ],
        steps: [
            'ピーマンを細切りにする。',
            '耐熱ボウルにピーマン、ツナ（油ごと）、調味料を入れる。',
            'ふんわりラップをして電子レンジ（600W）で3分加熱する。',
            'よく混ぜ合わせ、粗熱が取れたら完成！',
        ]
    },
    {
        id: '5',
        title: '濃厚ビーフシチュー',
        time: '120分',
        difficultyLevel: 3,
        categories: ['western'],
        imageUrl: '',
        baseServings: 4,
        ingredients: [
            { name: '牛すね肉', amount: 400, unit: 'g' },
            { name: '玉ねぎ', amount: 2, unit: '個' },
            { name: 'にんじん', amount: 1, unit: '本' },
            { name: '赤ワイン', amount: 200, unit: 'ml' },
            { name: 'デミグラスソース缶', amount: 1, unit: '缶' },
        ],
        steps: [
            '牛肉は大きめに切り、塩こしょうをして表面を焼く。',
            '玉ねぎ、にんじんを乱切りにし、鍋で炒める。',
            '牛肉と赤ワインを加え、アルコールを飛ばす。',
            '水とデミグラスソースを加え、弱火で1時間半煮込む。',
        ]
    },
    {
        id: '6',
        title: '本格・麻婆豆腐',
        time: '20分',
        difficultyLevel: 2,
        categories: ['chinese'],
        imageUrl: '',
        baseServings: 2,
        ingredients: [
            { name: '豆腐', amount: 1, unit: '丁' },
            { name: '豚ひき肉', amount: 150, unit: 'g' },
            { name: '長ネギ', amount: 0.5, unit: '本' },
            { name: '豆板醤', amount: 1, unit: '大さじ' },
            { name: '鶏ガラスープ', amount: 150, unit: 'ml' },
        ],
        steps: [
            '豆腐は1.5cmの角切りにし、ネギをみじん切りにする。',
            'フライパンでひき肉と豆板醤を炒める。',
            'スープと豆腐を加え、5分煮る。',
            '水溶き片栗粉でとろみをつけ、ネギを散らす。',
        ]
    },
    {
        id: '7',
        title: '柔らかチキンシーザー',
        time: '20分',
        difficultyLevel: 2,
        categories: ['korean'],
        imageUrl: '',
        baseServings: 2,
        ingredients: [
            { name: '鶏もも肉', amount: 300, unit: 'g' },
            { name: 'キャベツ', amount: 0.25, unit: '個' },
            { name: 'コチュジャン', amount: 2, unit: '大さじ' },
            { name: 'ピザ用チーズ', amount: 100, unit: 'g' },
        ],
        steps: [
            '鶏肉と野菜を一口大に切る。',
            'フライパンで具材を炒め、調味料で味付けする。',
            '中央にスペースを空け、チーズを溶かして完成！',
        ]
    },
    {
        id: '8',
        title: '豆腐ティラミス',
        time: '30分',
        difficultyLevel: 2,
        categories: ['sweets', 'healthy'],
        imageUrl: '',
        baseServings: 4,
        ingredients: [
            { name: 'マスカルポーネ', amount: 200, unit: 'g' },
            { name: 'コーヒー', amount: 100, unit: 'ml' },
            { name: 'ビスケット', amount: 1, unit: '袋' },
            { name: 'フルーツ', amount: 1, unit: '適量' },
        ],
        steps: [
            'コーヒーをビスケットに染み込ませる。',
            'チーズクリームと交互に重ねる。',
            '冷蔵庫で冷やし、フルーツを飾る。',
        ]
    },
];

// お気に入り用の簡易レシピ定義
export interface FavoriteRecipe {
    id: string;
    title: string;
    imageUrl: string;
    difficultyLevel: number;
    time: string;
    categories?: string[]; // 【追加】カテゴリ情報
}

export interface Feedback {
    id: string;
    content: string;
    userId: string;
    userName: string;
    attachmentUrl?: string; // 【追加】添付画像のURL
    createdAt: number;
}

/**
 * 自分のアレンジレシピを保存・更新する
 */
export const saveMyRecipe = async (recipe: Omit<SavedRecipe, 'id' | 'createdAt'> & { id?: string }): Promise<void> => {
    try {
        const existingRecipes = await getMyRecipes();
        let updatedRecipes: SavedRecipe[];
        let savedId: string;

        if (recipe.id && existingRecipes.some(r => r.id === recipe.id)) {
            // 既存レシピの更新
            savedId = recipe.id;
            updatedRecipes = existingRecipes.map(r =>
                r.id === recipe.id
                    ? { ...r, ...recipe, id: recipe.id } as SavedRecipe
                    : r
            );
        } else {
            // 新規レシピの追加
            savedId = recipe.id || Date.now().toString();
            const newRecipe: SavedRecipe = {
                ...recipe,
                id: savedId,
                createdAt: Date.now(),
            } as SavedRecipe;
            updatedRecipes = [newRecipe, ...existingRecipes];
        }

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecipes));

        // 【同期】もしお気に入りにも登録されているなら、お気に入り側も更新する
        const favorites = await getFavorites();
        const favIndex = favorites.findIndex(f => f.id === savedId);
        if (favIndex >= 0) {
            const updatedFavs = favorites.map(f => {
                if (f.id === savedId) {
                    return {
                        ...f,
                        title: recipe.title || f.title,
                        imageUrl: recipe.imageUrl || f.imageUrl,
                        categories: recipe.categories || f.categories,
                        // アレンジされている場合は time を固定するなどのルールがあればここで適用
                        time: recipe.isOriginal ? (f.time || "") : "アレンジ済み",
                    };
                }
                return f;
            });
            await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavs));
        }
    } catch (error) {
        console.error('レシピの保存に失敗しました:', error);
        throw error;
    }
};

/**
 * 保存したすべてのレシピを取得する
 */
export const getMyRecipes = async (): Promise<SavedRecipe[]> => {
    try {
        const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (error) {
        console.error('レシピの読み込みに失敗しました:', error);
        return [];
    }
};

/**
 * 指定したIDのレシピを削除する
 */
export const deleteMyRecipe = async (id: string): Promise<void> => {
    try {
        const existingRecipes = await getMyRecipes();
        const updatedRecipes = existingRecipes.filter(recipe => recipe.id !== id);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecipes));
    } catch (error) {
        console.error('レシピの削除に失敗しました:', error);
        throw error;
    }
};

/**
 * レシピをお気に入りに保存する
 */
export const saveFavorite = async (recipe: FavoriteRecipe): Promise<void> => {
    try {
        const favorites = await getFavorites();
        const existingIndex = favorites.findIndex(f => f.id === recipe.id);

        let updated: FavoriteRecipe[];
        if (existingIndex >= 0) {
            // 既存レコードを上書き更新
            updated = favorites.map(f => f.id === recipe.id ? recipe : f);
        } else {
            // 新規追加
            updated = [recipe, ...favorites];
        }

        await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));

        // 【同期】もしマイレシピ側にも同じIDのレシピがあるなら、そちらの分類なども更新する
        const myRecipes = await getMyRecipes();
        const myRecipeIndex = myRecipes.findIndex(r => r.id === recipe.id);
        if (myRecipeIndex >= 0) {
            const updatedMyRecipes = myRecipes.map(r => {
                if (r.id === recipe.id) {
                    return {
                        ...r,
                        title: recipe.title || r.title,
                        imageUrl: recipe.imageUrl || r.imageUrl,
                        categories: recipe.categories || r.categories,
                    };
                }
                return r;
            });
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMyRecipes));
        }
    } catch (error) {
        console.error('お気に入りの保存に失敗しました:', error);
    }
};


/**
 * お気に入り一覧を取得する
 */
export const getFavorites = async (): Promise<FavoriteRecipe[]> => {
    try {
        const jsonValue = await AsyncStorage.getItem(FAVORITES_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (error) {
        console.error('お気に入りの取得に失敗しました:', error);
        return [];
    }
};

/**
 * お気に入りから削除する
 */
export const removeFavorite = async (id: string): Promise<void> => {
    try {
        const favorites = await getFavorites();
        const updated = favorites.filter(f => f.id !== id);
        await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    } catch (error) {
        console.error('お気に入りの削除に失敗しました:', error);
    }
};

/**
 * お気に入り登録済みか確認する
 */
export const isFavorite = async (id: string): Promise<boolean> => {
    try {
        const favorites = await getFavorites();
        return favorites.some(f => f.id === id);
    } catch (error) {
        return false;
    }
};

/**
 * マスターレシピを保存・更新する
 */
export const saveMasterRecipe = async (recipe: MasterRecipe): Promise<void> => {
    try {
        // 1. Supabase DB を更新 (Upsertを使用)
        const isSupabaseId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(recipe.id);
        const recipeData = {
            title: recipe.title,
            time_required: recipe.time,
            image_url: recipe.imageUrl,
            difficulty_level: recipe.difficultyLevel,
            categories: recipe.categories,
            base_servings: recipe.baseServings,
        };
        // UUID形式の場合はIDも指定して更新、そうでない場合は新規作成（IDは自動生成させる想定）
        if (isSupabaseId) {
            (recipeData as any).id = recipe.id;
        }

        const { data: savedRecipeArray, error: recipeError } = await supabase
            .from('recipes')
            .upsert(recipeData, { onConflict: 'id' })
            .select('id');

        if (recipeError || !savedRecipeArray || savedRecipeArray.length === 0) {
            console.error('Supabaseレシピ更新エラー:', recipeError?.message);
            throw new Error('クラウドのレシピ保存に失敗しました');
        }

        const realRecipeId = savedRecipeArray[0].id;
        const newRecipeWithId = { ...recipe, id: realRecipeId };

        // 手順の更新 (一度削除して再作成)
        await supabase.from('recipe_steps').delete().eq('recipe_id', realRecipeId);
        if (recipe.steps.length > 0) {
            await supabase.from('recipe_steps').insert(
                recipe.steps.map((instruction, index) => ({
                    recipe_id: realRecipeId,
                    step_number: index + 1,
                    instruction
                }))
            );
        }

        // 材料の更新 (一度削除して再作成)
        await supabase.from('recipe_ingredients').delete().eq('recipe_id', realRecipeId);
        for (const ing of recipe.ingredients) {
            if (!ing.name) continue;
            let ingredientId = null;
            // 既存の材料を探す
            const { data: existingIng } = await supabase.from('ingredients').select('id').eq('name', ing.name).single();
            if (existingIng) {
                ingredientId = existingIng.id;
            } else {
                // 新規の材料を作成
                const { data: newIng, error: ingErr } = await supabase.from('ingredients').insert({ name: ing.name }).select('id').single();
                if (newIng && !ingErr) ingredientId = newIng.id;
            }

            if (ingredientId) {
                await supabase.from('recipe_ingredients').insert({
                    recipe_id: realRecipeId,
                    ingredient_id: ingredientId,
                    amount: ing.amount,
                    unit: ing.unit,
                    gram_per_unit: ing.gramPerUnit || null,
                    group: ing.group || null,
                    is_seasoning: ing.is_seasoning || false
                });
            }
        }

        // 2. ローカルキャッシュを直接読み書き
        const jsonValue = await AsyncStorage.getItem(MASTER_RECIPES_KEY);
        const recipes: MasterRecipe[] = jsonValue ? JSON.parse(jsonValue) : INITIAL_MASTER_RECIPES;

        const index = recipes.findIndex(r => r.id === recipe.id);
        let updated: MasterRecipe[];
        if (index >= 0) {
            updated = [...recipes];
            updated[index] = newRecipeWithId;
        } else {
            updated = [newRecipeWithId, ...recipes];
        }
        await AsyncStorage.setItem(MASTER_RECIPES_KEY, JSON.stringify(updated));
    } catch (error) {
        console.error('マスターレシピの保存に失敗しました:', error);
        throw error;
    }
};

/**
 * マスターレシピ一覧を取得する（管理用データ＋本番表示用）
 */
export const getMasterRecipes = async (): Promise<MasterRecipe[]> => {
    try {
        const { data, error } = await supabase
            .from('recipes')
            .select(`
                id, title, time_required, difficulty_level, image_url, category_id, categories, base_servings, is_sponsored,
                recipe_ingredients(amount, unit, gram_per_unit, group, is_seasoning, ingredients(name)),
                recipe_steps(step_number, instruction)
            `)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Supabaseからのレシピ取得に失敗:', error.message);
            // フォールバックとして従来のキャッシュまたは初期データを返す
            const jsonValue = await AsyncStorage.getItem(MASTER_RECIPES_KEY);
            return jsonValue != null ? JSON.parse(jsonValue) : INITIAL_MASTER_RECIPES;
        }

        if (data && data.length > 0) {
            // ローカルキャッシュを先に読み込む（imageUrlのマージ優先度判定に使用）
            const cachedJson = await AsyncStorage.getItem(MASTER_RECIPES_KEY);
            const cachedRecipes: MasterRecipe[] = cachedJson ? JSON.parse(cachedJson) : [];

            const mappedRecipes: MasterRecipe[] = data.map((d: any) => {
                // ローカルキャッシュに同IDのレシピがあれば imageUrl を優先して使う
                // （Supabase UPDATEが未反映でもローカルで保存した画像URLを維持するため）
                const cached = cachedRecipes.find(r => r.id === d.id);
                const imageUrl = d.image_url || cached?.imageUrl || '';

                return {
                    id: d.id,
                    title: d.title,
                    time: d.time_required || '',
                    imageUrl,
                    difficultyLevel: d.difficulty_level || 1,
                    categories: Array.isArray(d.categories) ? d.categories
                        : (d.category_id ? [d.category_id] : (cached?.categories || [])),
                    baseServings: d.base_servings || 2,
                    isSponsored: d.is_sponsored || false,
                    ingredients: d.recipe_ingredients ? d.recipe_ingredients.map((ri: any) => ({
                        name: ri.ingredients?.name || '',
                        amount: ri.amount,
                        unit: ri.unit,
                        gramPerUnit: ri.gram_per_unit || undefined,
                        group: ri.group || undefined,
                        is_seasoning: ri.is_seasoning || false
                    })) : [],
                    steps: d.recipe_steps
                        ? d.recipe_steps.sort((a: any, b: any) => a.step_number - b.step_number).map((s: any) => s.instruction)
                        : []
                };
            });

            // クラウドから取れた最新データをローカルにもキャッシュしておく（オフライン対応用）
            await AsyncStorage.setItem(MASTER_RECIPES_KEY, JSON.stringify(mappedRecipes));
            return mappedRecipes;
        }

        return INITIAL_MASTER_RECIPES;
    } catch (error) {
        console.error('マスターレシピの取得時に例外発生:', error);
        return INITIAL_MASTER_RECIPES;
    }
};

/**
 * マスターレシピを削除する
 */
export const deleteMasterRecipe = async (id: string): Promise<void> => {
    try {
        const isSupabaseId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        if (isSupabaseId) {
            // クラウドから関連データ（材料・手順）を削除
            await supabase.from('recipe_steps').delete().eq('recipe_id', id);
            await supabase.from('recipe_ingredients').delete().eq('recipe_id', id);

            // 本体のレシピを削除
            const { error } = await supabase.from('recipes').delete().eq('id', id);
            if (error) {
                console.error('Supabaseレシピ削除エラー:', error.message);
                throw new Error('クラウドのレシピ削除に失敗しました: ' + error.message);
            }
        }

        // ローカルキャッシュからも削除する
        const jsonValue = await AsyncStorage.getItem(MASTER_RECIPES_KEY);
        const recipes: MasterRecipe[] = jsonValue ? JSON.parse(jsonValue) : INITIAL_MASTER_RECIPES;
        const updated = recipes.filter(r => r.id !== id);
        await AsyncStorage.setItem(MASTER_RECIPES_KEY, JSON.stringify(updated));
    } catch (error) {
        console.error('マスターレシピの削除に失敗しました:', error);
        throw error;
    }
};

/**
 * マスターレシピを初期状態に戻す
 */
export const resetToInitialMasterRecipes = async (): Promise<void> => {
    try {
        await AsyncStorage.setItem(MASTER_RECIPES_KEY, JSON.stringify(INITIAL_MASTER_RECIPES));
    } catch (error) {
        console.error('マスターレシピのリセットに失敗しました:', error);
        throw error;
    }
};

/**
 * 【追加】マイレシピとお気に入りのデータをすべて消去する（不整合解消用）
 */
export const clearAllMyRecipesAndFavorites = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(STORAGE_KEY);
        await AsyncStorage.removeItem(FAVORITES_KEY);
    } catch (error) {
        console.error('マイレシピ・お気に入りの削除に失敗しました:', error);
        throw error;
    }
};

/**
 * フィードバックを保存する
 */
export const saveFeedback = async (content: string, userId: string, userName: string, attachmentUrl?: string): Promise<void> => {
    try {
        const { error } = await supabase.from('feedbacks').insert({
            content,
            user_id: userId,
            user_name: userName,
            attachment_url: attachmentUrl,
        });

        if (error) {
            console.error('Supabaseフィードバック保存エラー:', error.message);
            throw new Error('クラウドへの保存に失敗しました');
        }
    } catch (error) {
        console.error('フィードバックの保存に失敗しました:', error);
        throw error;
    }
};

/**
 * フィードバック一覧を取得する
 */
export const getFeedbacks = async (): Promise<Feedback[]> => {
    try {
        const { data, error } = await supabase
            .from('feedbacks')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabaseフィードバック取得エラー:', error.message);
            return [];
        }

        // データベースのフィールド名をフロントエンドのインターフェースに合わせる
        return (data || []).map(item => ({
            id: item.id,
            content: item.content,
            userId: item.user_id,
            userName: item.user_name,
            attachmentUrl: item.attachment_url,
            createdAt: new Date(item.created_at).getTime(),
        }));
    } catch (error) {
        console.error('フィードバックの取得に失敗しました:', error);
        return [];
    }
};
/**
 * フィードバックを削除する
 */
export const deleteFeedback = async (id: string): Promise<void> => {
    try {
        // 1. 削除前に既存のデータを取得して画像URLを確認する
        const { data: feedback, error: fetchError } = await supabase
            .from('feedbacks')
            .select('attachment_url')
            .eq('id', id)
            .single();

        if (fetchError) {
            console.error('削除前のフィードバック取得エラー:', fetchError.message);
        } else if (feedback?.attachment_url) {
            // 2. 画像があればストレージから削除
            await deleteImageFromStorage(feedback.attachment_url, 'recipe-images');
        }

        // 3. データベースからレコードを削除
        const { error } = await supabase.from('feedbacks').delete().eq('id', id);
        if (error) {
            console.error('Supabaseフィードバック削除エラー:', error.message);
            throw new Error('フィードバックの削除に失敗しました');
        }
    } catch (error) {
        console.error('フィードバックの削除に失敗しました:', error);
        throw error;
    }
};

/**
 * 最後のフィードバック送信時刻を取得する
 */
export const getLastFeedbackTime = async (): Promise<number> => {
    try {
        const feedbacks = await getFeedbacks();
        if (feedbacks.length === 0) return 0;
        return feedbacks[0].createdAt;
    } catch (error) {
        return 0;
    }
};

/**
 * フィードバックの最終閲覧時刻を取得する
 */
export const getLastReadTimestamp = async (): Promise<number> => {
    try {
        const lastRead = await AsyncStorage.getItem(LAST_READ_FEEDBACK_KEY);
        return lastRead ? parseInt(lastRead) : 0;
    } catch (error) {
        return 0;
    }
};

/**
 * フィードバックの最終閲覧時刻を更新する
 */
export const markFeedbacksAsRead = async (): Promise<void> => {
    try {
        await AsyncStorage.setItem(LAST_READ_FEEDBACK_KEY, Date.now().toString());
    } catch (error) {
        console.error('最終閲覧時刻の更新に失敗しました:', error);
    }
};

/**
 * 未読のフィードバック件数を取得する
 */
export const getUnreadFeedbackCount = async (): Promise<number> => {
    try {
        const lastRead = await AsyncStorage.getItem(LAST_READ_FEEDBACK_KEY);
        const lastReadTime = lastRead ? parseInt(lastRead) : 0;
        const feedbacks = await getFeedbacks();
        return feedbacks.filter(f => f.createdAt > lastReadTime).length;
    } catch (error) {
        return 0;
    }
};
