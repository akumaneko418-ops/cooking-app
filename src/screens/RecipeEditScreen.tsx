import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme, getGroupColor } from '../context/ThemeContext';
import { AppButton } from '../components/AppButton';
import { parseAmount } from '../utils/nutritionUtils';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ingredient, useRecipeEdit } from '../hooks/useRecipeEdit';

// ダミー：元のレシピデータ（本来はIDで検索して取得）
const ORIGINAL_RECIPE = {
    title: 'フライパン1つで！簡単とろとろオムライス',
    ingredients: [
        { name: 'ご飯', amount: '300g' },
        { name: '鶏もも肉', amount: '100g' },
        { name: '玉ねぎ', amount: '1/2個' },
        { name: 'ケチャップ', amount: '大さじ3（約45g）' },
        { name: '卵', amount: '3個' },
        { name: '牛乳', amount: '大さじ2（約30g）' },
    ],
    steps: [
        '鶏肉と玉ねぎを細かく切る。',
        'フライパンに油をひき、鶏肉と玉ねぎを炒める。',
        'ご飯とケチャップを加えて炒め合わせ、一旦お皿に取り出す。',
        '卵と牛乳を混ぜ、同じフライパンで半熟状に焼く。',
        'チキンライスの上に卵をのせて完成！',
    ],
    note: '',
};



interface Recipe {
    title: string;
    ingredients: Ingredient[];
    steps: string[];
    stepTips?: string[];
    note: string;
    imageUrl?: string;
    categories?: string[];
}

// ナビゲーションのパラメータリスト
type RootStackParamList = {
    RecipeEdit: {
        isOriginal?: boolean;
        originalRecipe?: Recipe;
    };
};

type Props = NativeStackScreenProps<any, 'RecipeEdit'>;

export default function RecipeEditScreen({ route, navigation }: any) {
    const {
        myImage,
        setMyImage,
        pickImage,
        handleSave,
        sortIngredientsByGroup,
        isSavingRef,
        saveSuccess,
        isOriginal,
        isEditingExisting,
        initialRecipe
    } = useRecipeEdit(navigation, route, ORIGINAL_RECIPE);

    // 材料を食材と調味料に分解する
    const categorizeIngredients = (ings: Ingredient[]) => {
        const ingredientsOnly: Ingredient[] = [];
        const seasoningsOnly: Ingredient[] = [];
        const seasoningKeywords = ['大さじ', '小さじ', '小さじ1/2', '小さじ1/4', '大さじ1', '醤油', 'みりん', '酒', '料理酒', '塩', '胡椒', '砂糖', '酢', '油', 'だし', 'コンソメ', 'ケチャップ', 'マヨネーズ', 'ソース'];

        ings.forEach(ing => {
            // 文字列の場合はパースして分離する
            const parsed = typeof ing.amount === 'string' ? parseAmount(ing.amount) : { value: ing.amount, unit: ing.unit || '', originalNumStr: String(ing.amount) };

            // is_seasoning フラグがあればそれを優先、なければキーワードで判定
            const isSeasoning = ing.is_seasoning !== undefined ? ing.is_seasoning : (
                ['大さじ', '小さじ'].includes(parsed.unit) ||
                seasoningKeywords.some(k => ing.name.includes(k))
            );

            const cleanIngredient = {
                ...ing,
                // もしパースによって単位が分離された場合でも、数値部分（分数含む）の元文字列を保持する
                amount: parsed.originalNumStr ? parsed.originalNumStr : (parsed.value === 0 && (ing.amount === '' || ing.amount === '0') ? '' : parsed.value.toString()),
                unit: parsed.unit || ing.unit || '',
                is_seasoning: isSeasoning
            };

            if (isSeasoning) {
                seasoningsOnly.push(cleanIngredient);
            } else {
                ingredientsOnly.push(cleanIngredient);
            }
        });

        // 最低1つは入力欄を確保
        if (ingredientsOnly.length === 0) ingredientsOnly.push({ name: '', amount: '', unit: '', group: '', is_seasoning: false });
        if (seasoningsOnly.length === 0) seasoningsOnly.push({ name: '', amount: '', unit: '', group: '', is_seasoning: true });

        return { ingredientsOnly, seasoningsOnly };
    };

    const { ingredientsOnly: initIngs, seasoningsOnly: initSeasonings } = categorizeIngredients(initialRecipe.ingredients);
    const [myTitle, setMyTitle] = useState(isEditingExisting ? initialRecipe.title : (isOriginal ? '' : `${initialRecipe.title}（アレンジ）`));
    const [myIngredients, setMyIngredients] = useState<Ingredient[]>(initIngs);
    const [mySeasonings, setMySeasonings] = useState<Ingredient[]>(initSeasonings);
    const [mySteps, setMySteps] = useState<string[]>([...initialRecipe.steps]);
    const [myStepTips, setMyStepTips] = useState<string[]>(initialRecipe.stepTips ? [...initialRecipe.stepTips] : initialRecipe.steps.map(() => ''));
    const [myNote, setMyNote] = useState(initialRecipe.note || '');
    const myCategories = initialRecipe.categories || []; // 【追加】カテゴリを引き継ぐ
    const [expanded, setExpanded] = useState<'ingredients' | 'steps' | null>('ingredients');
    const [footerExpanded, setFooterExpanded] = useState(true);

    // 変更があったかどうかを判定するための初期状態保存
    const initialDataRef = React.useRef({
        title: myTitle,
        image: myImage,
        ingredients: JSON.stringify(initIngs),
        seasonings: JSON.stringify(initSeasonings),
        steps: JSON.stringify(initialRecipe.steps),
        stepTips: JSON.stringify(initialRecipe.stepTips || []),
        note: initialRecipe.note || '',
    });

    const hasChanges = () => {
        if (myTitle !== initialDataRef.current.title) return true;
        if (myImage !== initialDataRef.current.image) return true;
        if (myNote !== initialDataRef.current.note) return true;
        if (JSON.stringify(myIngredients) !== initialDataRef.current.ingredients) return true;
        if (JSON.stringify(mySeasonings) !== initialDataRef.current.seasonings) return true;
        if (JSON.stringify(mySteps) !== initialDataRef.current.steps) return true;
        return false;
    };

    // 戻る際の確認ダイアログ（Webとネイティブ両対応）
    React.useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
            if (!hasChanges() || isSavingRef.current) {
                return;
            }

            e.preventDefault();

            if (Platform.OS === 'web') {
                // Webの場合は window.confirm を使用（Alert.alertは動作不可）
                const confirmed = window.confirm('変更内容が保存されていません。前の画面に戻りますか？');
                if (confirmed) {
                    navigation.dispatch(e.data.action);
                }
            } else {
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
            }
        });

        return unsubscribe;
    }, [navigation, myTitle, myImage, myIngredients, mySeasonings, mySteps, myNote]);

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



    const updateIngredient = (index: number, field: 'name' | 'amount' | 'unit' | 'group', value: string) => {
        let next = [...myIngredients];
        let val = value;

        if (field === 'unit') {
            next[index] = { ...next[index], unit: value };
        } else if (field === 'amount') {
            // 全角スラッシュを半角に変換し、数値・ピリオド・半角スラッシュのみを許可
            let cleanedVal = value.replace(/／/g, '/').replace(/[^0-9./]/g, '');
            // ピリオドが2つ以上ある場合は最初の1つ目以降を削除
            const parts = cleanedVal.split('.');
            if (parts.length > 2) {
                cleanedVal = parts[0] + '.' + parts.slice(1).join('');
            }

            // 先頭での「0.」入力時に「0」が消えないように、明示的に対応する
            // 以前は parseInt('0.3', 10) などで 0 が飛んだり不要なゼロ除去が走ることがあったため、
            // 文字列そのままをセットし、先頭の不要なゼロ（001など）のみ消すようにする
            // ※「0.xxx」の場合はそのままにする
            if (/^0[0-9]+/.test(cleanedVal)) {
                // 0始まりだがピリオドが続かない複数桁の数字（例: 01）は、先頭の0を取る
                cleanedVal = cleanedVal.replace(/^0+/, '');
            }

            next[index] = { ...next[index], amount: cleanedVal };
        } else if (field === 'group') {
            next[index] = { ...next[index], group: val };
            // グループ変更時は即座にソート
            next = sortIngredientsByGroup(next);
        } else {
            next[index] = { ...next[index], [field]: val };
        }
        setMyIngredients(next);
    };

    const updateSeasoning = (index: number, field: 'name' | 'amount' | 'unit' | 'group', value: string) => {
        let next = [...mySeasonings];
        let val = value;

        if (field === 'unit') {
            next[index] = { ...next[index], unit: value };
        } else if (field === 'amount') {
            // 全角スラッシュを半角に変換し、数値・ピリオド・半角スラッシュのみを許可
            let cleanedVal = value.replace(/／/g, '/').replace(/[^0-9./]/g, '');
            const parts = cleanedVal.split('.');
            if (parts.length > 2) {
                cleanedVal = parts[0] + '.' + parts.slice(1).join('');
            }

            if (/^0[0-9]+/.test(cleanedVal)) {
                cleanedVal = cleanedVal.replace(/^0+/, '');
            }

            next[index] = { ...next[index], amount: cleanedVal };
        } else if (field === 'group') {
            next[index] = { ...next[index], group: val };
            // グループ変更時は即座にソート
            next = sortIngredientsByGroup(next);
        } else {
            next[index] = { ...next[index], [field]: val };
        }

        setMySeasonings(next);
    };

    const addIngredient = () => {
        setMyIngredients([...myIngredients, { name: '', amount: '', unit: '', is_seasoning: false }]);
    };

    const addSeasoning = () => {
        setMySeasonings([...mySeasonings, { name: '', amount: '', unit: '', is_seasoning: true }]);
    };

    const removeIngredient = (index: number) => {
        if (myIngredients.length > 1) {
            setMyIngredients(myIngredients.filter((_, i) => i !== index));
        }
    };

    const removeSeasoning = (index: number) => {
        if (mySeasonings.length > 1) {
            setMySeasonings(mySeasonings.filter((_, i) => i !== index));
        }
    };

    // 【追加】並べ替え機能
    const moveIngredient = (index: number, direction: 'up' | 'down') => {
        const next = [...myIngredients];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= next.length) return;
        const temp = next[index];
        next[index] = next[targetIndex];
        next[targetIndex] = temp;
        setMyIngredients(next);
    };

    const moveSeasoning = (index: number, direction: 'up' | 'down') => {
        const next = [...mySeasonings];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= next.length) return;
        const temp = next[index];
        next[index] = next[targetIndex];
        next[targetIndex] = temp;
        setMySeasonings(next);
    };

    const updateStep = (index: number, value: string) => {
        const updated = [...mySteps];
        updated[index] = value;
        setMySteps(updated);
    };

    const addStep = () => {
        setMySteps([...mySteps, '']);
        setMyStepTips([...myStepTips, '']);
    };

    const removeStep = (index: number) => {
        setMySteps(mySteps.filter((_: string, i: number) => i !== index));
        setMyStepTips(myStepTips.filter((_: string, i: number) => i !== index));
    };

    const onSavePress = () => handleSave({
        myTitle,
        myIngredients,
        mySeasonings,
        mySteps,
        myStepTips,
        myNote,
        myCategories
    });

    const SectionHeader = ({ title, section }: { title: string; section: 'ingredients' | 'steps' }) => (
        <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setExpanded(expanded === section ? null : section)}
        >
            <Text style={styles.sectionTitle}>{title}</Text>
            <Ionicons
                name={expanded === section ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#666"
            />
        </TouchableOpacity>
    );

    const { activeTheme, bgTheme } = useTheme();

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: bgTheme.bg }]}>
            {/* @ts-ignore */}
            <KeyboardAwareScrollView
                style={{ flex: 1 }}
                contentContainerStyle={[styles.container, { paddingBottom: 100 }]}
                keyboardShouldPersistTaps="handled"
                enableOnAndroid={true}
                extraScrollHeight={Platform.OS === 'ios' ? 20 : 250}
                keyboardOpeningTime={0}
                onScroll={(e: any) => {
                    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
                    const isNearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
                    if (isNearBottom) setFooterExpanded(true);
                }}
                scrollEventThrottle={100}
            >
                {/* オリジナルとの違いを示す説明 または 完全新規画面用の説明 */}
                <View style={[styles.infoBanner,
                isOriginal
                    ? { backgroundColor: activeTheme.color + '18', borderRadius: 10 }
                    : { backgroundColor: activeTheme.color + '12', borderRadius: 10 }
                ]}>
                    <Ionicons name={isOriginal ? "star" : "information-circle-outline"} size={18} color={isOriginal ? "#F57F17" : activeTheme.color} />
                    <Text style={[styles.infoText, { color: activeTheme.color }, isOriginal && { color: '#E65100' }]}>
                        {isOriginal
                            ? "あなただけの完全オリジナルレシピを作成して保存できます。"
                            : "元のレシピをコピーしてアレンジ版として保存します。元データは変わりません。"}
                    </Text>
                </View>

                {/* 【追加】画像設定エリア */}
                <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage} activeOpacity={0.8}>
                    {myImage ? (
                        <>
                            <Image source={{ uri: myImage }} style={styles.previewImage} />
                            <View style={styles.imageOverlay}>
                                <Ionicons name="camera-reverse-outline" size={24} color="#fff" />
                                <Text style={styles.imageOverlayText}>写真を変更</Text>
                            </View>
                        </>
                    ) : (
                        <View style={styles.emptyImageBox}>
                            <Ionicons name="camera-outline" size={32} color="#999" />
                            <Text style={styles.emptyImageText}>完成した料理の写真を追加する</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* タイトル編集 */}
                <View style={[styles.section, { backgroundColor: bgTheme.surface }]}>
                    <Text style={[styles.fieldLabel, { color: bgTheme.subText }]}>レシピ名</Text>
                    <TextInput
                        style={[styles.titleInput, { color: bgTheme.text, backgroundColor: bgTheme.bg, borderColor: bgTheme.subText + '33' }]}
                        value={myTitle}
                        onChangeText={setMyTitle}
                        placeholder="例：我が家の特製カレー"
                    />
                </View>

                {/* 材料編集セクション（「材料」タイトルを削除し、直接表示） */}
                <View style={[styles.section, { backgroundColor: bgTheme.surface }]}>
                    <>
                        {/* 食材セクション */}
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: activeTheme.color }]}>食材</Text>
                        </View>

                        <View style={[styles.groupInfoBanner, { backgroundColor: activeTheme.color + '10', borderColor: activeTheme.color + '30' }]}>
                            <Ionicons name="information-circle-outline" size={16} color={activeTheme.color} />
                            <Text style={[styles.groupInfoText, { color: activeTheme.color }]}>[+G]ボタンでA,B,Cなどを選ぶと同じラベル同士でグループ化されます (例：合わせ調味料など)</Text>
                        </View>

                        {myIngredients.map((ing, index) => (
                            <View key={`ing-${index}`} style={styles.compactIngredientContainer}>
                                <View style={[styles.compactRow, { gap: 4, marginVertical: 4 }]}>
                                    <View style={styles.reorderBtns}>
                                        <TouchableOpacity onPress={() => moveIngredient(index, 'up')} disabled={index === 0}>
                                            <Ionicons name="chevron-up" size={16} color={index === 0 ? "#DDD" : activeTheme.color} />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => moveIngredient(index, 'down')} disabled={index === myIngredients.length - 1}>
                                            <Ionicons name="chevron-down" size={16} color={index === myIngredients.length - 1 ? "#DDD" : activeTheme.color} />
                                        </TouchableOpacity>
                                    </View>

                                    <TouchableOpacity
                                        style={[
                                            styles.miniDropdown,
                                            { height: 36 },
                                            ing.group ? { backgroundColor: getGroupColor(ing.group) + '20', borderColor: getGroupColor(ing.group) + '80' } : { borderStyle: 'dashed', borderColor: bgTheme.subText + '88' }
                                        ]}
                                        onPress={() => toggleMenu('ingredient', index, 'group')}
                                    >
                                        <Text style={[styles.miniDropdownText, { color: ing.group ? getGroupColor(ing.group) : bgTheme.subText + 'BB' }]}>
                                            {ing.group || '+G'}
                                        </Text>
                                        <Ionicons name={activeMenu?.type === 'ingredient' && activeMenu?.index === index && activeMenu?.field === 'group' ? "chevron-up" : "chevron-down"} size={10} color={ing.group ? getGroupColor(ing.group) : bgTheme.subText + 'BB'} />
                                    </TouchableOpacity>

                                    <TextInput
                                        style={[styles.compactInput, { flex: 2.0, height: 36, color: bgTheme.text, borderColor: bgTheme.subText + '44', paddingVertical: 0 }]}
                                        placeholder="食材名"
                                        placeholderTextColor={bgTheme.subText}
                                        value={ing.name}
                                        onChangeText={(val) => updateIngredient(index, 'name', val)}
                                    />
                                    <TextInput
                                        style={[styles.compactInput, { flex: 0.8, height: 36, color: bgTheme.text, borderColor: bgTheme.subText + '44', textAlign: 'center', paddingVertical: 0 }]}
                                        keyboardType="numeric"
                                        placeholderTextColor={bgTheme.subText}
                                        value={ing.amount?.toString() ?? ''}
                                        onChangeText={(val) => updateIngredient(index, 'amount', val)}
                                    />
                                    <View style={[styles.unitInputContainer, { flex: 2.0, height: 36, borderColor: bgTheme.subText + '44' }]}>
                                        <TouchableOpacity
                                            activeOpacity={1}
                                            onPress={() => {
                                                const isStandard = ['g', '個', 'ml', '本', '枚'].includes(ing.unit || '');
                                                if (isStandard) toggleMenu('ingredient', index, 'unit');
                                            }}
                                            style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                                        >
                                            <TextInput
                                                style={[styles.unitTextInput, { color: activeTheme.color, paddingVertical: 0, height: '100%', pointerEvents: !['g', 'ml', '個', '本', '枚'].includes(ing.unit || '') ? 'auto' : 'none' }]}
                                                value={ing.unit || ''}
                                                maxLength={4}
                                                placeholder="単位"
                                                placeholderTextColor={bgTheme.subText}
                                                onChangeText={(val) => updateIngredient(index, 'unit', val)}
                                                editable={!['g', 'ml', '個', '本', '枚'].includes(ing.unit || '')}
                                            />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.unitChevronBtn}
                                            onPress={() => toggleMenu('ingredient', index, 'unit')}
                                        >
                                            <Ionicons name={activeMenu?.type === 'ingredient' && activeMenu?.index === index && activeMenu?.field === 'unit' ? "chevron-up" : "chevron-down"} size={14} color={bgTheme.subText} />
                                        </TouchableOpacity>
                                    </View>

                                    <TouchableOpacity onPress={() => removeIngredient(index)} style={styles.removeBtnCompact}>
                                        <Ionicons name="close-circle" size={20} color="#FF3B30" />
                                    </TouchableOpacity>
                                </View>
                                {activeMenu?.type === 'ingredient' && activeMenu?.index === index && activeMenu?.field === 'group' && (
                                    <View style={[styles.inlineMenu, { backgroundColor: bgTheme.bg, borderColor: bgTheme.subText + '22' }]}>
                                        {['なし', 'A', 'B', 'C'].map((opt) => (
                                            <TouchableOpacity
                                                key={opt}
                                                style={styles.inlineMenuItem}
                                                onPress={() => {
                                                    updateIngredient(index, 'group', opt === 'なし' ? '' : opt);
                                                    setActiveMenu(null);
                                                }}
                                            >
                                                <Text style={[styles.inlineMenuItemText, { color: opt === 'なし' ? bgTheme.text : getGroupColor(opt) }]}>{opt}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                                {activeMenu?.type === 'ingredient' && activeMenu?.index === index && activeMenu?.field === 'unit' && (
                                    <View style={[styles.inlineMenu, { backgroundColor: bgTheme.bg, borderColor: bgTheme.subText + '22' }]}>
                                        {['その他', 'g', '個', 'ml', '本', '枚'].map((opt) => (
                                            <TouchableOpacity
                                                key={opt}
                                                style={styles.inlineMenuItem}
                                                onPress={() => {
                                                    if (opt === 'その他') {
                                                        updateIngredient(index, 'unit', '');
                                                    } else {
                                                        updateIngredient(index, 'unit', opt);
                                                    }
                                                    setActiveMenu(null);
                                                }}
                                            >
                                                <Text style={[styles.inlineMenuItemText, { color: bgTheme.text }]}>{opt}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}


                            </View>
                        ))}

                        <TouchableOpacity
                            style={[styles.inlineAddListBtn, { borderColor: bgTheme.subText + '88' }]}
                            onPress={addIngredient}
                        >
                            <Ionicons name="add" size={16} color={bgTheme.subText + 'BB'} />
                            <Text style={[styles.inlineAddListBtnText, { color: bgTheme.subText + 'BB' }]}>食材を追加</Text>
                        </TouchableOpacity>

                        <View style={{ height: 24 }} />

                        {/* 調味料セクション */}
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: activeTheme.color }]}>調味料</Text>
                        </View>

                        {mySeasonings.map((ing, index) => {
                            return (
                                <View key={`seasoning-${index}`} style={styles.compactIngredientContainer}>
                                    <View style={[styles.compactRow, { gap: 4, marginVertical: 4 }]}>
                                        <View style={styles.reorderBtns}>
                                            <TouchableOpacity onPress={() => moveSeasoning(index, 'up')} disabled={index === 0}>
                                                <Ionicons name="chevron-up" size={16} color={index === 0 ? "#DDD" : activeTheme.color} />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => moveSeasoning(index, 'down')} disabled={index === mySeasonings.length - 1}>
                                                <Ionicons name="chevron-down" size={16} color={index === mySeasonings.length - 1 ? "#DDD" : activeTheme.color} />
                                            </TouchableOpacity>
                                        </View>

                                        <TouchableOpacity
                                            style={[
                                                styles.miniDropdown,
                                                { height: 36 },
                                                ing.group ? { backgroundColor: getGroupColor(ing.group) + '20', borderColor: getGroupColor(ing.group) + '80' } : { borderStyle: 'dashed', borderColor: bgTheme.subText + '88' }
                                            ]}
                                            onPress={() => toggleMenu('seasoning', index, 'group')}
                                        >
                                            <Text style={[styles.miniDropdownText, { color: ing.group ? getGroupColor(ing.group) : bgTheme.subText + 'BB' }]}>
                                                {ing.group || '+G'}
                                            </Text>
                                            <Ionicons name={activeMenu?.type === 'seasoning' && activeMenu?.index === index && activeMenu?.field === 'group' ? "chevron-up" : "chevron-down"} size={10} color={ing.group ? getGroupColor(ing.group) : bgTheme.subText + 'BB'} />
                                        </TouchableOpacity>

                                        <TextInput
                                            style={[styles.compactInput, { flex: 2.0, height: 36, color: bgTheme.text, borderColor: bgTheme.subText + '44', paddingVertical: 0 }]}
                                            placeholder="調味料"
                                            placeholderTextColor={bgTheme.subText}
                                            value={ing.name}
                                            onChangeText={(val) => updateSeasoning(index, 'name', val)}
                                        />
                                        <TextInput
                                            style={[styles.compactInput, { flex: 0.8, height: 36, color: bgTheme.text, borderColor: bgTheme.subText + '44', textAlign: 'center', paddingVertical: 0 }]}
                                            keyboardType="numeric"
                                            placeholderTextColor={bgTheme.subText}
                                            value={ing.amount?.toString() ?? ''}
                                            onChangeText={(val) => updateSeasoning(index, 'amount', val)}
                                        />

                                        <View style={[styles.unitInputContainer, { flex: 2.0, height: 36, borderColor: bgTheme.subText + '44' }]}>
                                            <TouchableOpacity
                                                activeOpacity={1}
                                                onPress={() => {
                                                    const isStandard = ['g', 'ml', '大さじ', '小さじ', '個', '少々'].includes(ing.unit || '');
                                                    if (isStandard) toggleMenu('seasoning', index, 'unit');
                                                }}
                                                style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                                            >
                                                <TextInput
                                                    style={[styles.unitTextInput, { color: activeTheme.color, paddingVertical: 0, height: '100%', pointerEvents: !['g', 'ml', '大さじ', '小さじ', '少々'].includes(ing.unit || '') ? 'auto' : 'none' }]}
                                                    value={ing.unit || ''}
                                                    maxLength={4}
                                                    placeholder="単位"
                                                    placeholderTextColor={bgTheme.subText}
                                                    onChangeText={(val) => updateSeasoning(index, 'unit', val)}
                                                    editable={!['g', 'ml', '大さじ', '小さじ', '少々'].includes(ing.unit || '')}
                                                />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.unitChevronBtn}
                                                onPress={() => toggleMenu('seasoning', index, 'unit')}
                                            >
                                                <Ionicons name={activeMenu?.type === 'seasoning' && activeMenu?.index === index && activeMenu?.field === 'unit' ? "chevron-up" : "chevron-down"} size={14} color={bgTheme.subText} />
                                            </TouchableOpacity>
                                        </View>

                                        {mySeasonings.length > 1 && (
                                            <TouchableOpacity onPress={() => removeSeasoning(index)} style={styles.removeBtnCompact}>
                                                <Ionicons name="close-circle" size={18} color="#FF3B30" />
                                            </TouchableOpacity>
                                        )}
                                    </View>



                                    {activeMenu?.type === 'seasoning' && activeMenu?.index === index && activeMenu?.field === 'group' && (
                                        <View style={[styles.inlineMenu, { backgroundColor: bgTheme.bg, borderColor: bgTheme.subText + '22' }]}>
                                            {['なし', 'A', 'B', 'C'].map((opt) => (
                                                <TouchableOpacity
                                                    key={opt}
                                                    style={styles.inlineMenuItem}
                                                    onPress={() => {
                                                        updateSeasoning(index, 'group', opt === 'なし' ? '' : opt);
                                                        setActiveMenu(null);
                                                    }}
                                                >
                                                    <Text style={[styles.inlineMenuItemText, { color: opt === 'なし' ? bgTheme.text : getGroupColor(opt) }]}>{opt}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                    {activeMenu?.type === 'seasoning' && activeMenu?.index === index && activeMenu?.field === 'unit' && (
                                        <View style={[styles.inlineMenu, { backgroundColor: bgTheme.bg, borderColor: bgTheme.subText + '22' }]}>
                                            {['その他', 'g', 'ml', '大さじ', '小さじ', '少々'].map((opt) => (
                                                <TouchableOpacity
                                                    key={opt}
                                                    style={styles.inlineMenuItem}
                                                    onPress={() => {
                                                        if (opt === 'その他') {
                                                            updateSeasoning(index, 'unit', '');
                                                        } else {
                                                            updateSeasoning(index, 'unit', opt);
                                                        }
                                                        setActiveMenu(null);
                                                    }}
                                                >
                                                    <Text style={[styles.inlineMenuItemText, { color: bgTheme.text }]}>{opt}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            );
                        })}

                        <TouchableOpacity
                            style={[styles.inlineAddListBtn, { borderColor: bgTheme.subText + '88' }]}
                            onPress={addSeasoning}
                        >
                            <Ionicons name="add" size={16} color={bgTheme.subText + 'BB'} />
                            <Text style={[styles.inlineAddListBtnText, { color: bgTheme.subText + 'BB' }]}>調味料を追加</Text>
                        </TouchableOpacity>

                        <View style={{ height: 24 }} />
                    </>
                </View>

                {/* 手順編集（アコーディオン） */}
                <View style={[styles.section, { backgroundColor: bgTheme.surface }]}>
                    <SectionHeader title="作り方" section="steps" />
                    {
                        expanded === 'steps' && (
                            <>
                                {mySteps.map((step: string, index: number) => (
                                    <View key={index}>
                                        <View style={styles.stepRow}>
                                            <View style={styles.stepNumber}>
                                                <Text style={styles.stepNumberText}>{index + 1}</Text>
                                            </View>
                                            <TextInput
                                                style={[styles.stepInput, { color: bgTheme.text, backgroundColor: bgTheme.bg, borderColor: bgTheme.subText + '33' }]}
                                                value={step}
                                                onChangeText={(v) => updateStep(index, v)}
                                                placeholder={`手順 ${index + 1} を入力`}
                                                multiline
                                            />
                                            <TouchableOpacity onPress={() => removeStep(index)}>
                                                <Ionicons name="trash-outline" size={20} color="#EF5350" />
                                            </TouchableOpacity>
                                        </View>
                                        {/* 📝 メモ (ポイント) */}
                                        {myStepTips[index] ? (
                                            <View style={styles.stepTipContainer}>
                                                <Ionicons name="create-outline" size={14} color="#B0A060" style={{ marginTop: 2 }} />
                                                <TextInput
                                                    style={styles.stepTipInput}
                                                    value={myStepTips[index]}
                                                    onChangeText={(v) => {
                                                        const updated = [...myStepTips];
                                                        updated[index] = v;
                                                        setMyStepTips(updated);
                                                    }}
                                                    placeholder="例：火加減は中火にすると焦げにくい"
                                                    multiline
                                                />
                                                <TouchableOpacity onPress={() => {
                                                    const updated = [...myStepTips];
                                                    updated[index] = '';
                                                    setMyStepTips(updated);
                                                }}>
                                                    <Ionicons name="close-circle" size={16} color="#CCC" />
                                                </TouchableOpacity>
                                            </View>
                                        ) : (
                                            <TouchableOpacity
                                                style={styles.addTipBtn}
                                                onPress={() => {
                                                    const updated = [...myStepTips];
                                                    updated[index] = ' ';
                                                    setMyStepTips(updated);
                                                }}
                                            >
                                                <Ionicons name="create-outline" size={12} color="#AAA" />
                                                <Text style={styles.addTipBtnText}> メモを追加</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ))}
                                <TouchableOpacity style={styles.addRowBtn} onPress={addStep}>
                                    <Ionicons name="add-circle-outline" size={20} color={activeTheme.color} />
                                    <Text style={[styles.addRowText, { color: activeTheme.color }]}>手順を追加</Text>
                                </TouchableOpacity>
                            </>
                        )
                    }
                </View >

                {/* 自分メモ */}
                <View style={[styles.section, { backgroundColor: bgTheme.surface }]}>
                    <Text style={[styles.fieldLabel, { color: bgTheme.subText }]}>🗒️ 自分用メモ（コツ・気づき）</Text>
                    <TextInput
                        style={[styles.noteInput, { color: bgTheme.text, backgroundColor: bgTheme.bg, borderColor: bgTheme.subText + '33' }]}
                        value={myNote}
                        onChangeText={setMyNote}
                        placeholder="例：少し味が濃かったので、次回は醤油を大さじ1減らしてみる。"
                        multiline
                        numberOfLines={4}
                    />
                </View >

            </KeyboardAwareScrollView>

            {/* 保存ボタン：折りたたみ可能な固定フッター */}
            <View style={[styles.fixedFooter, {
                backgroundColor: bgTheme.bg,
                borderTopColor: bgTheme.subText + '22',
            }]}>
                {/* 開閉ハンドル */}
                <TouchableOpacity
                    onPress={() => setFooterExpanded(v => !v)}
                    style={{
                        alignItems: 'center',
                        paddingVertical: 4,
                        marginBottom: footerExpanded ? 8 : 0,
                    }}
                    activeOpacity={0.7}
                >
                    <View style={{
                        width: 36, height: 4, borderRadius: 2,
                        backgroundColor: bgTheme.subText + '44',
                        marginBottom: 2,
                    }} />
                    <Ionicons
                        name={footerExpanded ? 'chevron-down' : 'chevron-up'}
                        size={14}
                        color={bgTheme.subText + '88'}
                    />
                </TouchableOpacity>

                {/* ボタン本体（収納時は非表示） */}
                {footerExpanded && (
                    <>
                        <AppButton
                            title={isEditingExisting ? "✓ 変更を保存" : (isOriginal ? "✓ オリジナルレシピを保存" : "✓ このアレンジを保存")}
                            type="primary"
                            onPress={onSavePress}
                        />
                        <AppButton title="キャンセル" type="outline" onPress={() => navigation.goBack()} />
                    </>
                )}
            </View>

            {/* 保存成功バナー */}
            {saveSuccess && (
                <View style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 999,
                }}>
                    {/* テーマカラーに合わせた背景（ライト→白、ダーク→暗色） */}
                    <View style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: bgTheme.bg,
                        opacity: 0.88,
                    }} />
                    {/* カード本体（背景の opacity の影響を受けない） */}
                    <View style={{
                        backgroundColor: bgTheme.surface,
                        borderRadius: 20,
                        paddingVertical: 28,
                        paddingHorizontal: 48,
                        alignItems: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.15,
                        shadowRadius: 12,
                        elevation: 12,
                        borderTopWidth: 4,
                        borderTopColor: activeTheme.color,
                    }}>
                        <Ionicons name="checkmark-circle" size={52} color={activeTheme.color} style={{ marginBottom: 12 }} />
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: bgTheme.text }}>保存しました！</Text>
                        <Text style={{ fontSize: 13, color: bgTheme.subText, marginTop: 4 }}>レシピを保存しました</Text>
                    </View>
                </View>
            )}
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    container: { padding: 16 },
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#E3F2FD',
        borderRadius: 8,
        padding: 12,
        gap: 8,
        marginBottom: 16,
    },
    infoText: { flex: 1, fontSize: 13, color: '#1565C0', lineHeight: 19 },
    section: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 2,
    },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    addBtnSmall: { flexDirection: 'row', alignItems: 'center' },
    addBtnText: { marginLeft: 4, fontWeight: 'bold' },
    fieldLabel: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
    titleInput: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
    },
    // 画像設定部分のスタイル追加
    imagePickerBtn: {
        width: '100%',
        height: 200,
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderStyle: 'dashed',
    },
    emptyImageBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
    emptyImageText: { color: '#888', fontSize: 14, fontWeight: 'bold' },
    previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6
    },
    imageOverlayText: { color: '#fff', fontWeight: 'bold' },
    ingredientRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 12,
    },
    ingredientInput: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 10,
        fontSize: 15,
        backgroundColor: '#FAFAFA',
    },
    ingredientName: { flex: 2 },
    ingredientAmount: { flex: 1 },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginTop: 12,
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#FF6F61',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    stepNumberText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
    stepInput: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 10,
        padding: 10,
        fontSize: 15,
        minHeight: 48,
    },
    addRowBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingTop: 14,
        paddingHorizontal: 4,
    },
    addRowText: { fontSize: 15, fontWeight: 'bold' },
    noteInput: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        fontSize: 15,
        minHeight: 110,
        textAlignVertical: 'top',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    sectionTitle: { fontSize: 17, fontWeight: 'bold' },
    fixedFooter: {
        paddingHorizontal: 16,
        paddingBottom: 20,
        paddingTop: 4,
        borderTopWidth: 1,
        gap: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 10,
        fontSize: 15,
        backgroundColor: '#FAFAFA',
    },
    removeBtn: { padding: 4, marginLeft: 4 },
    seasoningContainer: {
        marginBottom: 16,
        padding: 12,
        backgroundColor: '#FDFDFD',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    unitTabs: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 10
    },
    unitTab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderRadius: 6,
        backgroundColor: '#fff',
    },
    unitTabText: {
        fontSize: 12,
        fontWeight: 'bold'
    },
    groupInfoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: 8,
        marginBottom: 12,
        gap: 6,
        borderWidth: 1,
    },
    groupInfoText: {
        fontSize: 11,
        flex: 1,
        fontWeight: '500',
    },
    ingredientWithGroupContainer: {
        marginBottom: 16,
    },
    groupChips: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 6,
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
    compactIngredientContainer: {
        marginBottom: 8,
    },
    compactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    compactInput: {
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 4,
        fontSize: 13,
        backgroundColor: '#fff',
        height: 34,
    },
    ingNameInput: {
        flex: 3,
    },
    ingAmountInput: {
        flex: 1.2,
    },
    unitInput: {
        flex: 1.4,
        fontWeight: 'bold',
        textAlign: 'center',
        paddingRight: 10,
    },
    unitTrigger: {
        position: 'absolute',
        right: 28, // 削除ボタンの左
        height: 34,
        width: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeBtnCompact: {
        width: 24,
        height: 34,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonArea: {
        marginTop: 8,
        gap: 12
    },
    inlineMenu: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 6,
        padding: 6,
        borderRadius: 8,
        borderWidth: 1,
        gap: 6,
        alignSelf: 'stretch',
    },
    inlineMenuItem: {
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderRadius: 4,
        backgroundColor: '#f0f0f0',
        minWidth: 68,
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
        marginTop: 12,
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
    stepTipContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#FFFDE7',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 6,
        marginLeft: 36,
        marginRight: 28,
        marginTop: 2,
        marginBottom: 4,
        gap: 4,
    },
    stepTipLabel: {
        fontSize: 12,
        marginTop: 2,
    },
    stepTipInput: {
        flex: 1,
        fontSize: 13,
        color: '#555',
        padding: 0,
        minHeight: 20,
    },
    addTipBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 36,
        marginTop: 2,
        marginBottom: 6,
        paddingVertical: 3,
        paddingHorizontal: 8,
        alignSelf: 'flex-start',
        gap: 2,
    },
    addTipBtnText: {
        fontSize: 11,
        color: '#AAA',
    },
});
