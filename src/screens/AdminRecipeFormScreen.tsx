import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput,
    TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, getGroupColor } from '../context/ThemeContext';
import { MasterRecipe, saveMasterRecipe } from '../utils/storage';
import { RECIPE_CATEGORIES, RECIPE_SUB_CATEGORIES } from '../data/RecipeCategories';
import { DIFFICULTY_LEVELS } from '../data/DifficultyLevels';
import { INGREDIENT_STANDARD } from '../data/IngredientStandardDictionary';
import { AppButton } from '../components/AppButton';
import { pickImageFromLibrary, uploadRecipeImage } from '../utils/imageUtils';
import { calculateNutrition, autoFormatAmount, parseAmount, formatAmount, isIngredientValid } from '../utils/nutritionUtils';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function AdminRecipeFormScreen({ route, navigation }: any) {
    const editingRecipe = route.params?.recipe as MasterRecipe | undefined;
    const { activeTheme, bgTheme } = useTheme();

    // フォーム状態
    const [title, setTitle] = useState(editingRecipe?.title || '');
    const [time, setTime] = useState(editingRecipe?.time || '');
    const [imageUrl, setImageUrl] = useState(editingRecipe?.imageUrl || '');
    const [localImageUri, setLocalImageUri] = useState<string | null>(null); // 未アップロードのローカルURI
    const [difficultyLevel, setDifficultyLevel] = useState(editingRecipe?.difficultyLevel || 1);
    const [categories, setCategories] = useState<string[]>(editingRecipe?.categories || ['japanese']);
    const [baseServings, setBaseServings] = useState(editingRecipe?.baseServings?.toString() || '2');

    // 【追加】インラインメニュー用状態
    const [activeMenu, setActiveMenu] = useState<{
        type: 'ingredient' | 'seasoning',
        index: number,
        field: 'group' | 'unit'
    } | null>(null);

    const toggleMenu = (type: 'ingredient' | 'seasoning', index: number, field: 'group' | 'unit') => {
        if (activeMenu?.type === type && activeMenu?.index === index && activeMenu?.field === field) {
            setActiveMenu(null);
        } else {
            setActiveMenu({ type, index, field });
        }
    };

    // 材料を食材と調味料に分解する
    const categorizeIngredients = (ings: any[]) => {
        const ingredientsOnly: any[] = [];
        const seasoningsOnly: any[] = [];
        const seasoningKeywords = ['大さじ', '小さじ', '小さじ1/2', '小さじ1/4', '大さじ1', '醤油', 'みりん', '酒', '料理酒', '塩', '胡椒', '砂糖', '酢', '油', 'だし', 'コンソメ', 'ケチャップ', 'マヨネーズ', 'ソース'];

        ings.forEach(ingObj => {
            // is_seasoning フラグがあればそれを優先、なければキーワードで判定
            const isSeasoning = ingObj.is_seasoning !== undefined ? ingObj.is_seasoning : (
                ['大さじ', '小さじ'].includes(ingObj.unit) ||
                seasoningKeywords.some(k => ingObj.name.includes(k))
            );

            const cleanIng = { ...ingObj, is_seasoning: isSeasoning };

            if (isSeasoning) {
                seasoningsOnly.push(cleanIng);
            } else {
                ingredientsOnly.push(cleanIng);
            }
        });

        if (ingredientsOnly.length === 0) ingredientsOnly.push({ name: '', amount: 0, unit: '', gramPerUnit: 0, group: '', is_seasoning: false });
        if (seasoningsOnly.length === 0) seasoningsOnly.push({ name: '', amount: 0, unit: '', gramPerUnit: 0, group: '', is_seasoning: true });

        return { ingredientsOnly, seasoningsOnly };
    };

    const initialIngsData = editingRecipe?.ingredients || [{ name: '', amount: 0, unit: '', gramPerUnit: 0 }];
    const { ingredientsOnly: initIngs, seasoningsOnly: initSeasonings } = categorizeIngredients(initialIngsData);

    // 材料（動的リスト）
    const [ingredients, setIngredients] = useState(initIngs);
    const [seasonings, setSeasonings] = useState(initSeasonings);

    // 手順（動的リスト）
    const [steps, setSteps] = useState(editingRecipe?.steps || ['']);

    const [imageUploading, setImageUploading] = useState(false);
    const isSavingRef = React.useRef(false);

    const initialDataRef = React.useRef({
        title,
        time,
        imageUrl,
        ingredients: JSON.stringify(initIngs),
        seasonings: JSON.stringify(initSeasonings),
        steps: JSON.stringify(steps),
        baseServings,
        difficultyLevel,
    });

    const hasChanges = () => {
        if (title !== initialDataRef.current.title) return true;
        if (time !== initialDataRef.current.time) return true;
        if (imageUrl !== initialDataRef.current.imageUrl) return true;
        if (baseServings !== initialDataRef.current.baseServings) return true;
        if (difficultyLevel !== initialDataRef.current.difficultyLevel) return true;
        if (difficultyLevel !== initialDataRef.current.difficultyLevel) return true;
        if (JSON.stringify(ingredients) !== initialDataRef.current.ingredients) return true;
        if (JSON.stringify(seasonings) !== initialDataRef.current.seasonings) return true;
        if (JSON.stringify(steps) !== initialDataRef.current.steps) return true;
        return false;
    };

    // 戻る際の確認ダイアログ
    React.useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
            if (!hasChanges() || isSavingRef.current) {
                return;
            }

            e.preventDefault();

            Alert.alert(
                '変更内容の破棄',
                '変更内容が保存されていません。前の画面に戻りますか？',
                [
                    { text: '編集を続ける', style: 'cancel', onPress: () => { } },
                    {
                        text: '破棄して戻る',
                        style: 'destructive',
                        onPress: () => navigation.dispatch(e.data.action),
                    },
                ]
            );
        });

        return unsubscribe;
    }, [navigation, title, time, imageUrl, ingredients, seasonings, steps, baseServings, difficultyLevel]);

    const addIngredient = () => {
        setIngredients([...ingredients, { name: '', amount: '', unit: '', gramPerUnit: 0, is_seasoning: false }]);
    };

    const addSeasoning = () => {
        setSeasonings([...seasonings, { name: '', amount: '', unit: '', gramPerUnit: 0, is_seasoning: true }]);
    };

    const updateIngredient = (index: number, field: string, value: any) => {
        let next = [...ingredients];
        let val = value;
        if (field === 'amount' || field === 'gramPerUnit') {
            let cleanedVal = value.replace(/／/g, '/').replace(/[^0-9./]/g, '');
            const parts = cleanedVal.split('.');
            if (parts.length > 2) {
                cleanedVal = parts[0] + '.' + parts.slice(1).join('');
            }
            if (/^0[0-9]+/.test(cleanedVal)) {
                cleanedVal = cleanedVal.replace(/^0+/, '');
            }
            val = cleanedVal;
        }
        (next[index] as any)[field] = val;

        if (field === 'group') {
            next = sortIngredientsByGroup(next);
        }

        setIngredients(next);
    };

    const updateSeasoning = (index: number, field: string, value: any) => {
        let next = [...seasonings];
        let val = value;
        if (field === 'amount' || field === 'gramPerUnit') {
            let cleanedVal = value.replace(/／/g, '/').replace(/[^0-9./]/g, '');
            const parts = cleanedVal.split('.');
            if (parts.length > 2) {
                cleanedVal = parts[0] + '.' + parts.slice(1).join('');
            }
            if (/^0[0-9]+/.test(cleanedVal)) {
                cleanedVal = cleanedVal.replace(/^0+/, '');
            }
            val = cleanedVal;
        }
        (next[index] as any)[field] = val;

        if (field === 'group') {
            next = sortIngredientsByGroup(next);
        }

        setSeasonings(next);
    };

    const removeIngredient = (index: number) => {
        if (ingredients.length > 1) {
            setIngredients(ingredients.filter((_, i) => i !== index));
        }
    };

    const removeSeasoning = (index: number) => {
        if (seasonings.length > 1) {
            setSeasonings(seasonings.filter((_, i) => i !== index));
        }
    };

    const moveIngredient = (index: number, direction: 'up' | 'down') => {
        const next = [...ingredients];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= next.length) return;
        const temp = next[index];
        next[index] = next[targetIndex];
        next[targetIndex] = temp;
        setIngredients(next);
    };

    const moveSeasoning = (index: number, direction: 'up' | 'down') => {
        const next = [...seasonings];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= next.length) return;
        const temp = next[index];
        next[index] = next[targetIndex];
        next[targetIndex] = temp;
        setSeasonings(next);
    };

    const addStep = () => {
        setSteps([...steps, '']);
    };

    const updateStep = (index: number, value: string) => {
        const next = [...steps];
        next[index] = value;
        setSteps(next);
    };

    const removeStep = (index: number) => {
        if (steps.length > 1) {
            setSteps(steps.filter((_, i) => i !== index));
        }
    };

    const handlePickImage = async () => {
        const uri = await pickImageFromLibrary();
        if (uri) {
            setLocalImageUri(uri);
        }
    };

    const sortIngredientsByGroup = (ings: any[]) => {
        const groupOrder: { [key: string]: number } = { '': 0, 'A': 1, 'B': 2, 'C': 3 };
        const typeOrder: { [key: string]: number } = { '粉末': 1, '液体': 2, '油': 3, 'その他': 4 };

        return [...ings].sort((a, b) => {
            // 1. グループ順
            const orderA = groupOrder[a.group || ''] ?? 99;
            const orderB = groupOrder[b.group || ''] ?? 99;

            if (orderA !== orderB) {
                return orderA - orderB;
            }

            // 2. 食材を先、調味料を後にする
            const isSeasoningA = a.is_seasoning ? 1 : 0;
            const isSeasoningB = b.is_seasoning ? 1 : 0;

            if (isSeasoningA !== isSeasoningB) {
                return isSeasoningA - isSeasoningB;
            }

            // 3. どちらも調味料の場合のみ、調味料タイプでソート（粉末→液体→油）
            if (a.is_seasoning && b.is_seasoning) {
                const typeA = INGREDIENT_STANDARD[a.name]?.seasoningType || 'その他';
                const typeB = INGREDIENT_STANDARD[b.name]?.seasoningType || 'その他';

                return (typeOrder[typeA] || 4) - (typeOrder[typeB] || 4);
            }

            // 食材同士の場合は順番を維持
            return 0;
        });
    };

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert("エラー", "タイトルを入力してください");
            return;
        }

        let finalImageUrl = imageUrl;

        // ローカル画像が選択されていたらアップロードする
        if (localImageUri) {
            setImageUploading(true);
            const recipeId = editingRecipe?.id || Date.now().toString();
            const uploaded = await uploadRecipeImage(localImageUri, recipeId);
            setImageUploading(false);
            if (uploaded) {
                finalImageUrl = uploaded;
            } else {
                Alert.alert('警告', '画像のアップロードに失敗しました。画像なしで保存します。');
            }
        }

        const combinedIngredients = [
            ...ingredients.filter(ing => ing.name.trim() !== ''),
            ...seasonings.filter(ing => ing.name.trim() !== '')
        ];

        const newRecipe: MasterRecipe = {
            id: editingRecipe?.id || Date.now().toString(),
            title,
            time,
            imageUrl: finalImageUrl || '',
            difficultyLevel,
            categories: categories && categories.length > 0 ? categories : [], // 確実な配列渡し
            baseServings: parseInt(baseServings) || 2,
            ingredients: sortIngredientsByGroup(combinedIngredients).map(ing => {
                const amountStr = String(ing.amount);
                const isNumeric = /^[0-9.]+$/.test(amountStr);
                return {
                    ...ing,
                    amount: isNumeric ? parseFloat(amountStr) || 0 : amountStr,
                    gramPerUnit: ing.gramPerUnit ? parseFloat(ing.gramPerUnit.toString()) : undefined
                };
            }),
            steps: steps.filter(s => s.trim() !== ''),
        };

        try {
            await saveMasterRecipe(newRecipe);
            isSavingRef.current = true;
            Alert.alert("成功", "レシピを保存しました", [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            Alert.alert("エラー", "保存に失敗しました");
        }
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: bgTheme.bg }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="close" size={26} color={bgTheme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: bgTheme.text }]}>
                    {editingRecipe ? 'レシピを編集' : '新規レシピ登録'}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            {/* @ts-ignore */}
            <KeyboardAwareScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.scrollContent}
                enableOnAndroid={true}
                extraScrollHeight={Platform.OS === 'ios' ? 20 : 250}
                keyboardShouldPersistTaps="handled"
                keyboardOpeningTime={0}
            >
                {/* 基本情報 */}
                <View style={[styles.section, { backgroundColor: bgTheme.surface }]}>
                    <Text style={[styles.sectionLabel, { color: activeTheme.color }]}>基本情報</Text>

                    <Text style={[styles.inputLabel, { color: bgTheme.text }]}>タイトル</Text>
                    <TextInput
                        style={[styles.input, { color: bgTheme.text, borderBottomColor: bgTheme.subText }]}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="例：とろとろオムライス"
                    />

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <Text style={[styles.inputLabel, { color: bgTheme.text }]}>調理時間</Text>
                            <TextInput
                                style={[styles.input, { color: bgTheme.text, borderBottomColor: bgTheme.subText }]}
                                value={time}
                                onChangeText={setTime}
                                placeholder="例：15分"
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.inputLabel, { color: bgTheme.text }]}>基本の何人前</Text>
                            <TextInput
                                style={[styles.input, { color: bgTheme.text, borderBottomColor: bgTheme.subText }]}
                                value={baseServings}
                                onChangeText={setBaseServings}
                                keyboardType="number-pad"
                                placeholder="例：2"
                            />
                        </View>
                    </View>

                    {/* 画像選択 & プレビュー */}
                    <Text style={[styles.inputLabel, { color: bgTheme.text }]}>カバー画像（URLまたは選択）</Text>
                    <TextInput
                        style={[styles.input, { color: bgTheme.text, borderBottomColor: bgTheme.subText, marginBottom: 12 }]}
                        value={imageUrl}
                        onChangeText={(v) => { setImageUrl(v); setLocalImageUri(null); }}
                        placeholder="画像URLを入力..."
                    />

                    <TouchableOpacity
                        style={[styles.imagePicker, { borderColor: bgTheme.subText, backgroundColor: bgTheme.surface }]}
                        onPress={handlePickImage}
                    >
                        {localImageUri || imageUrl ? (
                            <Image
                                source={{ uri: localImageUri || imageUrl }}
                                style={styles.imagePreview}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={styles.imagePlaceholder}>
                                <Ionicons name="camera-outline" size={32} color={bgTheme.subText} />
                                <Text style={[styles.imagePlaceholderText, { color: bgTheme.subText }]}>端末から画像を選択</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    {(localImageUri || imageUrl) && (
                        <TouchableOpacity onPress={() => { setLocalImageUri(null); setImageUrl(''); }} style={{ alignSelf: 'flex-end', marginTop: 8 }}>
                            <Text style={{ color: '#e74c3c', fontSize: 13, fontWeight: 'bold' }}>✕ 画像をクリア</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* メインジャンル & サブジャンル & 難易度 */}
                <View style={[styles.section, { backgroundColor: bgTheme.surface }]}>
                    <Text style={[styles.sectionLabel, { color: activeTheme.color }]}>分類設定</Text>

                    <Text style={[styles.inputLabel, { color: bgTheme.text }]}>メインジャンル（複数選択可）</Text>
                    <View style={styles.chipContainer}>
                        {RECIPE_SUB_CATEGORIES.map(cat => {
                            const isSelected = categories.includes(cat.id);
                            return (
                                <TouchableOpacity
                                    key={cat.id}
                                    onPress={() => {
                                        if (isSelected) {
                                            setCategories(categories.filter(c => c !== cat.id));
                                        } else {
                                            setCategories([...categories, cat.id]);
                                        }
                                    }}
                                    style={[
                                        styles.chip,
                                        { backgroundColor: bgTheme.bg, borderColor: activeTheme.color + '44' },
                                        isSelected && { backgroundColor: activeTheme.color + 'E6', borderColor: activeTheme.color }
                                    ]}
                                >
                                    <Text style={[
                                        styles.chipText,
                                        { color: isSelected ? '#fff' : bgTheme.text },
                                    ]}>{cat.emoji} {cat.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <Text style={[styles.inputLabel, { color: bgTheme.text, marginTop: 16 }]}>サブジャンル</Text>
                    <View style={styles.categoryGap}>
                        <View style={styles.chipContainer}>
                            {RECIPE_CATEGORIES.filter(c => c.id !== 'all').map(cat => {
                                const isSelected = categories.includes(cat.id);
                                return (
                                    <TouchableOpacity
                                        key={cat.id}
                                        onPress={() => {
                                            if (isSelected) {
                                                if (categories.length > 1 || true) { // 制限なしに変更
                                                    setCategories(categories.filter(c => c !== cat.id));
                                                }
                                            } else {
                                                setCategories([...categories, cat.id]);
                                            }
                                        }}
                                        style={[
                                            styles.chip,
                                            { backgroundColor: bgTheme.bg, borderColor: bgTheme.subText + '44' },
                                            isSelected && { backgroundColor: activeTheme.color + 'E6', borderColor: activeTheme.color }
                                        ]}
                                    >
                                        <Text style={[
                                            styles.chipText,
                                            { color: isSelected ? '#fff' : bgTheme.text },
                                        ]}>{cat.emoji} {cat.label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    <Text style={[styles.inputLabel, { color: bgTheme.text, marginTop: 16 }]}>難易度</Text>
                    <View style={styles.difficultyRow}>
                        {DIFFICULTY_LEVELS.map(level => (
                            <TouchableOpacity
                                key={level.level}
                                onPress={() => setDifficultyLevel(level.level)}
                                style={[
                                    styles.diffBtn,
                                    { backgroundColor: bgTheme.bg, borderColor: bgTheme.subText + '44' },
                                    difficultyLevel === level.level && { backgroundColor: level.color + 'E6', borderColor: level.color }
                                ]}
                            >
                                <Text style={[
                                    styles.diffBtnText,
                                    { color: difficultyLevel === level.level ? '#fff' : bgTheme.subText },
                                ]}>{level.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* 食材セクション */}
                <View style={[styles.section, { backgroundColor: bgTheme.surface }]}>
                    <View style={styles.sectionHeaderLine}>
                        <View>
                            <Text style={[styles.sectionLabel, { color: activeTheme.color, marginBottom: 0 }]}>食材</Text>
                            <Text style={{ fontSize: 10, color: bgTheme.subText }}>保存時に名前のない項目は除外されます</Text>
                        </View>
                    </View>
                    {ingredients.map((ing, idx) => (
                        <View key={idx} style={[styles.listCard, { backgroundColor: bgTheme.bg, borderColor: bgTheme.subText + '22' }]}>
                            <View style={styles.compactRow}>
                                <View style={{ flex: 1 }}>
                                    <View style={[styles.compactRow, { gap: 4 }]}>
                                        <View style={styles.reorderBtns}>
                                            <TouchableOpacity onPress={() => moveIngredient(idx, 'up')} disabled={idx === 0}>
                                                <Ionicons name="chevron-up" size={16} color={idx === 0 ? "#DDD" : activeTheme.color} />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => moveIngredient(idx, 'down')} disabled={idx === ingredients.length - 1}>
                                                <Ionicons name="chevron-down" size={16} color={idx === ingredients.length - 1 ? "#DDD" : activeTheme.color} />
                                            </TouchableOpacity>
                                        </View>

                                        <TouchableOpacity
                                            style={[
                                                styles.miniDropdown,
                                                { height: 36 },
                                                ing.group ? { backgroundColor: getGroupColor(ing.group) + '20', borderColor: getGroupColor(ing.group) + '80' } : { borderStyle: 'dashed', borderColor: bgTheme.subText + '88' }
                                            ]}
                                            onPress={() => toggleMenu('ingredient', idx, 'group')}
                                        >
                                            <Text style={[styles.miniDropdownText, { color: ing.group ? getGroupColor(ing.group) : bgTheme.subText + 'BB' }]}>
                                                {ing.group || '+G'}
                                            </Text>
                                            <Ionicons name={activeMenu?.type === 'ingredient' && activeMenu?.index === idx && activeMenu?.field === 'group' ? "chevron-up" : "chevron-down"} size={10} color={ing.group ? getGroupColor(ing.group) : bgTheme.subText + 'BB'} />
                                        </TouchableOpacity>

                                        <TextInput
                                            style={[styles.compactInput, { flex: 2.0, height: 36, color: bgTheme.text, borderColor: bgTheme.subText + '44', paddingVertical: 0 }]}
                                            value={ing.name}
                                            placeholder="材料名"
                                            onChangeText={(v) => updateIngredient(idx, 'name', v)}
                                        />
                                        <TextInput
                                            style={[styles.compactInput, { flex: 0.8, height: 36, color: bgTheme.text, borderColor: bgTheme.subText + '44', textAlign: 'center' }]}
                                            keyboardType="numeric"
                                            placeholderTextColor={bgTheme.subText}
                                            value={ing.amount?.toString() ?? ''}
                                            onChangeText={(val) => updateIngredient(idx, 'amount', val)}
                                        />
                                        <View style={[styles.unitInputContainer, { flex: 1.5, height: 36, borderColor: bgTheme.subText + '44' }]}>
                                            <TouchableOpacity
                                                activeOpacity={1}
                                                onPress={() => {
                                                    const isStandard = ['g', '個', 'ml', '本', '枚'].includes(ing.unit || '');
                                                    if (isStandard) toggleMenu('ingredient', idx, 'unit');
                                                }}
                                                style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                                            >
                                                <TextInput
                                                    style={[styles.unitTextInput, { color: activeTheme.color }]}
                                                    value={ing.unit || ''}
                                                    maxLength={4}
                                                    placeholder="単位"
                                                    onChangeText={(val) => updateIngredient(idx, 'unit', val)}
                                                    editable={!['g', '個', 'ml', '本', '枚'].includes(ing.unit || '')}
                                                />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.unitChevronBtn}
                                                onPress={() => toggleMenu('ingredient', idx, 'unit')}
                                            >
                                                <Ionicons name={activeMenu?.type === 'ingredient' && activeMenu?.index === idx && activeMenu?.field === 'unit' ? "chevron-up" : "chevron-down"} size={14} color={bgTheme.subText} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                                <View style={{ width: 40, alignItems: 'center', justifyContent: 'center' }}>
                                    <TouchableOpacity onPress={() => removeIngredient(idx)} style={styles.removeCircleBtn}>
                                        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* インラインメニュー (グループ選択) */}
                            {activeMenu?.type === 'ingredient' && activeMenu?.index === idx && activeMenu?.field === 'group' && (
                                <View style={[styles.inlineMenu, { backgroundColor: bgTheme.bg, borderColor: bgTheme.subText + '22' }]}>
                                    {['なし', 'A', 'B', 'C'].map((opt) => (
                                        <TouchableOpacity
                                            key={opt}
                                            style={styles.inlineMenuItem}
                                            onPress={() => {
                                                updateIngredient(idx, 'group', opt === 'なし' ? '' : opt);
                                                setActiveMenu(null);
                                            }}
                                        >
                                            <Text style={[styles.inlineMenuItemText, { color: opt === 'なし' ? bgTheme.text : getGroupColor(opt) }]}>{opt}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {/* インラインメニュー (単位選択) */}
                            {activeMenu?.type === 'ingredient' && activeMenu?.index === idx && activeMenu?.field === 'unit' && (
                                <View style={[styles.inlineMenu, { backgroundColor: bgTheme.bg, borderColor: bgTheme.subText + '22' }]}>
                                    {['その他', 'g', '個', 'ml', '本', '枚'].map((opt) => (
                                        <TouchableOpacity
                                            key={opt}
                                            style={styles.inlineMenuItem}
                                            onPress={() => {
                                                if (opt === 'その他') {
                                                    updateIngredient(idx, 'unit', '');
                                                } else {
                                                    updateIngredient(idx, 'unit', opt);
                                                }
                                                setActiveMenu(null);
                                            }}
                                        >
                                            <Text style={[styles.inlineMenuItemText, { color: bgTheme.text }]}>{opt}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {ing.name.trim() !== '' && !isIngredientValid(ing.name.trim()) && (
                                <Text style={{ fontSize: 10, color: '#FF3B30', marginTop: 4, fontWeight: 'bold' }}>
                                    ※食材データなし
                                </Text>
                            )}
                        </View>
                    ))}

                    <TouchableOpacity
                        style={[styles.inlineAddListBtn, { borderColor: bgTheme.subText + '88' }]}
                        onPress={addIngredient}
                    >
                        <Ionicons name="add" size={16} color="#666" />
                        <Text style={styles.inlineAddListBtnText}>食材を追加</Text>
                    </TouchableOpacity>
                </View>

                {/* 調味料セクション */}
                <View style={[styles.section, { backgroundColor: bgTheme.surface }]}>
                    <View style={styles.sectionHeaderLine}>
                        <View>
                            <Text style={[styles.sectionLabel, { color: activeTheme.color, marginBottom: 0 }]}>調味料</Text>
                            <Text style={{ fontSize: 10, color: bgTheme.subText }}>保存時に名前のない項目は除外されます</Text>
                        </View>
                    </View>
                    {seasonings.map((ing, idx) => (
                        <View key={idx} style={[styles.listCard, { backgroundColor: bgTheme.bg, borderColor: bgTheme.subText + '22' }]}>
                            <View style={styles.compactRow}>
                                <View style={{ flex: 1 }}>
                                    <View style={[styles.compactRow, { gap: 4 }]}>
                                        <View style={styles.reorderBtns}>
                                            <TouchableOpacity onPress={() => moveSeasoning(idx, 'up')} disabled={idx === 0}>
                                                <Ionicons name="chevron-up" size={16} color={idx === 0 ? "#DDD" : activeTheme.color} />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => moveSeasoning(idx, 'down')} disabled={idx === seasonings.length - 1}>
                                                <Ionicons name="chevron-down" size={16} color={idx === seasonings.length - 1 ? "#DDD" : activeTheme.color} />
                                            </TouchableOpacity>
                                        </View>

                                        <TouchableOpacity
                                            style={[
                                                styles.miniDropdown,
                                                { height: 36 },
                                                ing.group ? { backgroundColor: getGroupColor(ing.group) + '20', borderColor: getGroupColor(ing.group) + '80' } : { borderStyle: 'dashed', borderColor: bgTheme.subText + '88' }
                                            ]}
                                            onPress={() => toggleMenu('seasoning', idx, 'group')}
                                        >
                                            <Text style={[styles.miniDropdownText, { color: ing.group ? getGroupColor(ing.group) : bgTheme.subText + 'BB' }]}>
                                                {ing.group || '+G'}
                                            </Text>
                                            <Ionicons name={activeMenu?.type === 'seasoning' && activeMenu?.index === idx && activeMenu?.field === 'group' ? "chevron-up" : "chevron-down"} size={10} color={ing.group ? getGroupColor(ing.group) : bgTheme.subText + 'BB'} />
                                        </TouchableOpacity>

                                        <TextInput
                                            style={[styles.compactInput, { flex: 2.0, height: 36, color: bgTheme.text, borderColor: bgTheme.subText + '44', paddingVertical: 0 }]}
                                            value={ing.name}
                                            placeholder="調味料名"
                                            onChangeText={(v) => updateSeasoning(idx, 'name', v)}
                                        />
                                        <TextInput
                                            style={[styles.compactInput, { flex: 0.8, height: 36, color: bgTheme.text, borderColor: bgTheme.subText + '44', textAlign: 'center', paddingVertical: 0 }]}
                                            value={ing.amount?.toString() ?? ''}
                                            placeholder="0"
                                            keyboardType="numeric"
                                            onChangeText={(v) => updateSeasoning(idx, 'amount', v)}
                                        />

                                        <View style={[styles.unitInputContainer, { flex: 2.0, height: 36, borderColor: bgTheme.subText + '44' }]}>
                                            <TouchableOpacity
                                                activeOpacity={1}
                                                onPress={() => {
                                                    const isStandard = ['g', 'ml', '大さじ', '小さじ', '少々'].includes(ing.unit || '');
                                                    if (isStandard) toggleMenu('seasoning', idx, 'unit');
                                                }}
                                                style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                                            >
                                                <TextInput
                                                    style={[styles.unitTextInput, { color: activeTheme.color, paddingVertical: 0, height: '100%', pointerEvents: !['g', 'ml', '大さじ', '小さじ', '少々'].includes(ing.unit || '') ? 'auto' : 'none' }]}
                                                    value={ing.unit || ''}
                                                    maxLength={4}
                                                    placeholder="単位"
                                                    onChangeText={(val) => updateSeasoning(idx, 'unit', val)}
                                                    editable={!['g', 'ml', '大さじ', '小さじ', '少々'].includes(ing.unit || '')}
                                                />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.unitChevronBtn}
                                                onPress={() => toggleMenu('seasoning', idx, 'unit')}
                                            >
                                                <Ionicons name={activeMenu?.type === 'seasoning' && activeMenu?.index === idx && activeMenu?.field === 'unit' ? "chevron-up" : "chevron-down"} size={14} color={bgTheme.subText} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                                <View style={{ width: 40, alignItems: 'center', justifyContent: 'center' }}>
                                    <TouchableOpacity onPress={() => removeSeasoning(idx)} style={styles.removeCircleBtn}>
                                        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* インラインメニュー (グループ選択) */}
                            {activeMenu?.type === 'seasoning' && activeMenu?.index === idx && activeMenu?.field === 'group' && (
                                <View style={[styles.inlineMenu, { backgroundColor: bgTheme.bg, borderColor: bgTheme.subText + '22' }]}>
                                    {['なし', 'A', 'B', 'C'].map((opt) => (
                                        <TouchableOpacity
                                            key={opt}
                                            style={styles.inlineMenuItem}
                                            onPress={() => {
                                                updateSeasoning(idx, 'group', opt === 'なし' ? '' : opt);
                                                setActiveMenu(null);
                                            }}
                                        >
                                            <Text style={[styles.inlineMenuItemText, { color: opt === 'なし' ? bgTheme.text : getGroupColor(opt) }]}>{opt}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {/* インラインメニュー (単位選択) */}
                            {activeMenu?.type === 'seasoning' && activeMenu?.index === idx && activeMenu?.field === 'unit' && (
                                <View style={[styles.inlineMenu, { backgroundColor: bgTheme.bg, borderColor: bgTheme.subText + '22' }]}>
                                    {['その他', 'g', 'ml', '大さじ', '小さじ', '少々'].map((opt) => (
                                        <TouchableOpacity
                                            key={opt}
                                            style={styles.inlineMenuItem}
                                            onPress={() => {
                                                if (opt === 'その他') {
                                                    updateSeasoning(idx, 'unit', '');
                                                } else {
                                                    updateSeasoning(idx, 'unit', opt);
                                                }
                                                setActiveMenu(null);
                                            }}
                                        >
                                            <Text style={[styles.inlineMenuItemText, { color: bgTheme.text }]}>{opt}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {ing.name.trim() !== '' && !isIngredientValid(ing.name.trim()) && (
                                <Text style={{ fontSize: 10, color: '#FF3B30', marginTop: 4, fontWeight: 'bold' }}>
                                    ※調味料データなし
                                </Text>
                            )}
                        </View>
                    ))}

                    <TouchableOpacity
                        style={[styles.inlineAddListBtn, { borderColor: bgTheme.subText + '88' }]}
                        onPress={addSeasoning}
                    >
                        <Ionicons name="add" size={16} color="#666" />
                        <Text style={styles.inlineAddListBtnText}>調味料を追加</Text>
                    </TouchableOpacity>
                </View>

                {/* 手順リスト */}
                <View style={[styles.section, { backgroundColor: bgTheme.surface }]}>
                    <View style={styles.sectionHeaderLine}>
                        <View>
                            <Text style={[styles.sectionLabel, { color: activeTheme.color, marginBottom: 0 }]}>手順</Text>
                            <Text style={{ fontSize: 10, color: bgTheme.subText }}>保存時に空の項目は除外されます</Text>
                        </View>
                        <TouchableOpacity onPress={addStep} style={styles.addBtnCircle}>
                            <Ionicons name="add" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    {
                        steps.map((step, idx) => (
                            <View key={idx} style={[styles.listCard, { backgroundColor: bgTheme.bg, borderColor: bgTheme.subText + '22' }]}>
                                <Text style={[styles.stepNumberBadge, { backgroundColor: activeTheme.color + '22', color: activeTheme.color }]}>{idx + 1}</Text>
                                <TextInput
                                    style={[styles.listInputMain, { flex: 1, color: bgTheme.text, borderBottomColor: bgTheme.subText + '44', minHeight: 40 }]}
                                    value={step}
                                    multiline
                                    placeholder="手順の詳細を記入..."
                                    onChangeText={(v) => updateStep(idx, v)}
                                />
                                <TouchableOpacity onPress={() => removeStep(idx)} style={styles.removeCircleBtn}>
                                    <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                                </TouchableOpacity>
                            </View>
                        ))
                    }
                </View>

                <AppButton
                    title={imageUploading ? "画像をアップロード中..." : "保存する"}
                    type="primary"
                    onPress={handleSave}
                    disabled={imageUploading}
                    style={styles.saveBtn}
                />
                <View style={{ height: 40 }} />
            </KeyboardAwareScrollView>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        justifyContent: 'space-between',
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    scrollContent: { padding: 16 },
    section: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 12,
        letterSpacing: 1,
    },
    sectionHeaderLine: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 4,
        marginTop: 10,
    },
    input: {
        fontSize: 16,
        paddingVertical: 8,
        borderBottomWidth: 1,
    },
    row: {
        flexDirection: 'row',
        marginTop: 4,
    },
    categoryGap: {
        marginTop: 8,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    chipText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    difficultyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    diffBtn: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
        marginHorizontal: 4,
    },
    diffBtnText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    imagePicker: {
        width: '100%',
        height: 180,
        borderRadius: 12,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        overflow: 'hidden',
        marginTop: 8,
    },
    imagePreview: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    imagePlaceholderText: {
        fontSize: 13,
    },
    addBtnCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#2ecc71',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    listCard: {
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    listInputMain: {
        fontSize: 15,
        fontWeight: '600',
        paddingVertical: 4,
        borderBottomWidth: 1,
    },
    listInputSub: {
        fontSize: 13,
        paddingVertical: 4,
        borderBottomWidth: 1,
        marginTop: 4,
    },
    removeCircleBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    stepNumberBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        textAlign: 'center',
        lineHeight: 24,
        fontSize: 12,
        fontWeight: 'bold',
        marginRight: 10,
        overflow: 'hidden',
    },
    saveBtn: {
        marginTop: 20,
        height: 56,
    },
    compactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    compactInput: {
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 6,
        fontSize: 14,
        backgroundColor: '#fff',
    },
    miniDropdown: {
        borderWidth: 1,
        borderRadius: 6,
        width: 44,
        height: 32,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    miniDropdownText: {
        fontSize: 11,
        fontWeight: '800',
    },
    unitDropdown: {
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 4,
        height: 32,
        minWidth: 54,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    unitDropdownText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    buttonArea: {
        marginTop: 8,
        gap: 12
    },
    inlineMenu: {
        flexDirection: 'row',
        marginTop: 6,
        padding: 6,
        borderRadius: 8,
        borderWidth: 1,
        gap: 6,
        alignSelf: 'stretch',
        justifyContent: 'space-between',
    },
    inlineMenuItem: {
        paddingHorizontal: 4,
        paddingVertical: 8,
        borderRadius: 4,
        backgroundColor: '#f0f0f0',
        flex: 1,
        maxWidth: '23%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    inlineMenuItemText: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    inlineAddListBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 36,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderRadius: 8,
        marginTop: 4,
        marginBottom: 12,
        backgroundColor: 'rgba(0,0,0,0.02)',
    },
    inlineAddListBtnText: {
        fontSize: 13,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    unitInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 6,
        backgroundColor: '#fff',
        overflow: 'hidden',
    },
    unitTextInput: {
        flex: 1,
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        paddingHorizontal: 2,
        includeFontPadding: false,
        textAlignVertical: 'center',
    },
    unitChevronBtn: {
        width: 24,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.02)',
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(0,0,0,0.05)',
    },
    reorderBtns: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        gap: 2,
    },
});
