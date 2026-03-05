import { useState, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { saveMyRecipe } from '../utils/storage';
import { formatAmount } from '../utils/nutritionUtils';
import { INGREDIENT_STANDARD } from '../data/IngredientStandardDictionary';

// types
export interface Ingredient {
    name: string;
    amount: string;
    unit?: string;
    group?: string;
    is_seasoning?: boolean;
}

export function useRecipeEdit(navigation: any, route: any, ORIGINAL_RECIPE: any) {
    const isOriginal = route.params?.isOriginal || false;
    const isEditingExisting = !!route.params?.recipeId;

    const initialRecipe = isEditingExisting ? (route.params?.originalRecipe || ORIGINAL_RECIPE) : (isOriginal ? {
        title: '',
        ingredients: [{ name: '', amount: '' }],
        steps: [''],
        note: ''
    } : (route.params?.originalRecipe || ORIGINAL_RECIPE));

    // state definitions (excluding ingredients/steps for now to limit hook complexity if they are heavily UI-bound, but we can move image/save logic)
    const [myImage, setMyImage] = useState<string | null>(initialRecipe.imageUrl || null);
    const isSavingRef = useRef(false);

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert("エラー", "写真へのアクセスが許可されていません。");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setMyImage(result.assets[0].uri);
        }
    };

    const sortIngredientsByGroup = (ings: Ingredient[]) => {
        const groupOrder: { [key: string]: number } = { '': 0, 'A': 1, 'B': 2, 'C': 3 };
        const typeOrder: { [key: string]: number } = { '粉末': 1, '液体': 2, '油': 3, 'その他': 4 };

        return [...ings].sort((a, b) => {
            const orderA = groupOrder[a.group || ''] ?? 99;
            const orderB = groupOrder[b.group || ''] ?? 99;

            if (orderA !== orderB) return orderA - orderB;

            const isSeasoningA = a.is_seasoning ? 1 : 0;
            const isSeasoningB = b.is_seasoning ? 1 : 0;

            if (isSeasoningA !== isSeasoningB) return isSeasoningA - isSeasoningB;

            if (a.is_seasoning && b.is_seasoning) {
                const typeA = INGREDIENT_STANDARD[a.name]?.seasoningType || 'その他';
                const typeB = INGREDIENT_STANDARD[b.name]?.seasoningType || 'その他';
                return (typeOrder[typeA] || 4) - (typeOrder[typeB] || 4);
            }
            return 0;
        });
    };

    const handleSave = async ({
        myTitle,
        myIngredients,
        mySeasonings,
        mySteps,
        myStepTips,
        myNote,
        myCategories
    }: any) => {
        const isTitleEmpty = !myTitle || myTitle.trim() === '';
        const combinedIngredients = [...myIngredients, ...mySeasonings];
        const validIngredients = combinedIngredients.filter(i => i.name.trim() !== '');
        const isIngredientsEmpty = validIngredients.length === 0;
        const validSteps = mySteps.filter((s: string) => s.trim() !== '');
        const isStepsEmpty = validSteps.length === 0;

        const executeSave = async () => {
            try {
                const sortedIngredients = sortIngredientsByGroup(validIngredients);
                const formattedIngredients = sortedIngredients.map(ing => ({
                    name: ing.name,
                    amount: formatAmount(ing.amount, ing.unit || ''),
                    group: ing.group,
                    is_seasoning: ing.is_seasoning
                }));

                await saveMyRecipe({
                    id: route.params?.recipeId,
                    isOriginal,
                    originalRecipeId: isOriginal ? undefined : (route.params?.originalRecipeId || route.params?.recipeId || '1'),
                    imageUrl: myImage || undefined,
                    title: isTitleEmpty ? '無題のレシピ' : myTitle,
                    ingredients: formattedIngredients,
                    steps: validSteps,
                    stepTips: myStepTips.filter((_: any, i: number) => mySteps[i]?.trim() !== ''),
                    note: myNote || '',  // undefined・null対策
                    categories: myCategories || [],
                });
                console.log('保存成功');
                isSavingRef.current = true;
                if (Platform.OS === 'web') {
                    // Web では Alert が動作しないので直接戻る
                    navigation.goBack();
                } else {
                    // アラートを表示し、1.5秒後に自動で前の画面に戻る
                    Alert.alert('保存しました', 'レシピを保存しました！');
                    setTimeout(() => navigation.goBack(), 1500);
                }
            } catch (error: any) {
                console.error('保存エラー詳細:', error);
                const msg = `レシピの保存に失敗しました: ${error?.message || '不明なエラー'}`;
                if (Platform.OS === 'web') {
                    window.alert(msg);
                } else {
                    Alert.alert('エラー', msg);
                }
            }
        };

        if (isTitleEmpty || isIngredientsEmpty || isStepsEmpty) {
            const emptyFields: string[] = [];
            if (isTitleEmpty) emptyFields.push('レシピ名');
            if (isIngredientsEmpty) emptyFields.push('材料');
            if (isStepsEmpty) emptyFields.push('作り方');
            const msg = `${emptyFields.join('、')} が未記入です。\nこのまま保存しますか？`;

            if (Platform.OS === 'web') {
                if (window.confirm(msg)) {
                    await executeSave();
                }
                return;
            }

            return new Promise<void>((resolve) => {
                Alert.alert('確認', msg, [
                    { text: 'キャンセル', style: 'cancel', onPress: () => resolve() },
                    { text: '保存する', onPress: async () => { await executeSave(); resolve(); } }
                ]);
            });
        }

        await executeSave();
    };


    return {
        myImage,
        setMyImage,
        pickImage,
        handleSave,
        sortIngredientsByGroup,
        isSavingRef,
        isOriginal,
        isEditingExisting,
        initialRecipe
    };
}
