import React, { useState, useCallback } from 'react';
import { useKeepAwake } from 'expo-keep-awake';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Modal, ActivityIndicator, Alert, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '../components/AppButton';
import { SubstitutePopup } from '../components/SubstitutePopup';
import { SUBSTITUTE_DICTIONARY, SubstituteData } from '../data/SubstituteDictionary';
import { DifficultyBadge } from '../components/DifficultyBadge';
import { CUTTING_DICTIONARY, CuttingTechniqueData } from '../data/CuttingDictionary';
import { DIFFICULTY_LEVELS } from '../data/DifficultyLevels';
import { INGREDIENT_STANDARD } from '../data/IngredientStandardDictionary';
import { RECIPE_CATEGORIES } from '../data/RecipeCategories';
import { calculateNutrition, NutritionResult, parseAmount, formatAmount } from '../utils/nutritionUtils';
import { useTheme, getGroupColor } from '../context/ThemeContext';
import { useUIConfig } from '../context/UIConfigContext';
import { useRecipeDetail } from '../hooks/useRecipeDetail';
import BackgroundPattern from '../components/BackgroundPattern';

export default function RecipeDetailScreen({ route, navigation }: any) {
    const { recipeId } = route.params;
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    // 🔆 レシピ詳細を開いている間は画面が暗くならないようにする
    useKeepAwake();

    const { recipe, loading, isFavorited, servings, setServings, toggleFavorite } = useRecipeDetail(recipeId);

    const [popupVisible, setPopupVisible] = useState(false);
    const [selectedIngredient, setSelectedIngredient] = useState<any>(null);
    const [pinchPopupVisible, setPinchPopupVisible] = useState(false);
    const [cuttingPopupVisible, setCuttingPopupVisible] = useState(false);
    const [selectedCutting, setSelectedCutting] = useState<CuttingTechniqueData | null>(null);
    const [showDetailedNutrition, setShowDetailedNutrition] = useState(false);
    const [substitutedIngredients, setSubstitutedIngredients] = useState<Record<string, SubstituteData>>({});
    const { activeTheme, bgTheme } = useTheme();
    const { fontSizeScale } = useUIConfig();

    // 材料の計算と直感的な表示への変換ロジック
    const calculateAmount = (ingredient: any) => {
        if (!recipe) return { mainText: '', subText: '' };
        const ratio = servings / recipe.baseServings;
        const calcVal = ingredient.amount * ratio;

        if (ingredient.unit === '少々') {
            return { mainText: '少々', subText: '' };
        }

        let displayAmount = `${calcVal}`;
        if (calcVal === 1.5) displayAmount = '1と1/2';
        else if (calcVal === 0.5) displayAmount = '1/2';
        else if (calcVal % 1 !== 0) displayAmount = calcVal.toFixed(1).replace(/\.0$/, '');

        let gramText = '';
        const standardData = INGREDIENT_STANDARD[ingredient.name];
        const mainText = formatAmount(displayAmount, ingredient.unit);

        // 大さじ・小さじの(ml)併記
        if (ingredient.unit === '大さじ') {
            const ml = Math.round(calcVal * 15);
            gramText = ` (${ml}ml)`;
        } else if (ingredient.unit === '小さじ') {
            const ml = Math.round(calcVal * 5);
            gramText = ` (${ml}ml)`;
        } else if (ingredient.gramPerUnit) {
            const totalGrams = Math.round(calcVal * ingredient.gramPerUnit);
            const liquidIngredients = ['牛乳', '水', '酒', '料理酒', 'みりん', '醤油', 'しょうゆ', '酢'];

            // 重複チェック: mainTextがtotalGrams+ユニットと一致する場合、または単位がg/mlなのに同じ数値が表示される場合は表示しない
            const totalGramsText = `${totalGrams}g`;
            const totalMlText = `${totalGrams}ml`;
            const isRedundant = mainText === totalGramsText || mainText === totalMlText ||
                (ingredient.unit === 'g' && mainText.includes(`${totalGrams}`)) ||
                (ingredient.unit === 'ml' && mainText.includes(`${totalGrams}`));

            if (!isRedundant) {
                if (liquidIngredients.includes(ingredient.name)) {
                    gramText = ` (${totalGrams}ml)`;
                } else {
                    gramText = ` (約${totalGrams}g)`;
                }
            }
        } else if (standardData) {
            if (ingredient.unit === 'g') {
                // 単位がgで、辞書データの単位もgの場合は補足（(約...g)）を生成しない
                if (standardData.unitName === 'g') {
                    gramText = '';
                } else {
                    const approxCount = calcVal / standardData.stdGram;
                    let fractionText = '';
                    if (approxCount < 0.2) fractionText = '';
                    else if (approxCount >= 0.2 && approxCount < 0.4) fractionText = '1/4';
                    else if (approxCount >= 0.4 && approxCount < 0.6) fractionText = '1/2';
                    else if (approxCount >= 0.6 && approxCount < 0.9) fractionText = '3/4';
                    else fractionText = `${Math.round(approxCount)}`;

                    if (fractionText) {
                        gramText = ` (約${fractionText}${standardData.unitName})`;
                    }
                }
            } else if (ingredient.unit === standardData.unitName) {
                const estimatedGrams = Math.round(calcVal * standardData.stdGram);
                // 重複チェック
                if (mainText !== `${estimatedGrams}g` && !mainText.includes(`${estimatedGrams}`)) {
                    gramText = ` (約${estimatedGrams}g)`;
                }
            }
        }

        if (ingredient.name.includes('ご飯') && ingredient.unit === 'g') {
            const bowlCount = (calcVal / 150).toFixed(1).replace(/\.0$/, '');
            gramText += ` (約 お茶碗${bowlCount}杯分)`;
        }

        return { mainText, subText: gramText };
    };

    // 栄養価合計の計算（常に1人前として計算）
    const calculateTotalNutrition = (): NutritionResult => {
        if (!recipe) return {
            calories: 0, protein: '0', fat: '0', carbs: '0', sugar: '0', fiber: '0', salt: '0',
            calcium: 0, iron: '0', magnesium: 0, potassium: 0, zinc: '0', phosphorus: 0,
            vitaminA: 0, vitaminD: '0', vitaminE: '0', vitaminK: 0,
            vitaminB1: '0', vitaminB2: '0', vitaminB6: '0', vitaminB12: '0',
            folate: 0, niacin: '0', vitaminC: 0
        };

        return calculateNutrition(recipe.ingredients, recipe.baseServings, substitutedIngredients);
    };

    const nutrition = calculateTotalNutrition();

    const handleLongPress = (ingredientName: string) => {
        const subData = SUBSTITUTE_DICTIONARY[ingredientName];
        if (subData) {
            setSelectedIngredient({
                name: ingredientName,
                substitute: subData
            });
            setPopupVisible(true);
        }
    };

    const renderStepText = (text: string) => {
        const cuttingTerms = Object.keys(CUTTING_DICTIONARY);
        const regex = new RegExp(`(${cuttingTerms.join('|')})`, 'g');
        const parts = text.split(regex);

        return (
            <Text style={[styles.stepText, { color: bgTheme.text, fontSize: 16 * fontSizeScale, lineHeight: 24 * fontSizeScale }]}>
                {parts.map((part, index) => {
                    const matchedData = CUTTING_DICTIONARY[part];
                    if (matchedData) {
                        return (
                            <Text
                                key={`highlight-${index}`}
                                style={styles.cuttingHighlight}
                                onPress={() => {
                                    setSelectedCutting(matchedData);
                                    setCuttingPopupVisible(true);
                                }}
                            >
                                {part}
                                <Text style={styles.cuttingHelpBadge}> ? </Text>
                            </Text>
                        );
                    }
                    return <Text key={`text-${index}`}>{part}</Text>;
                })}
            </Text>
        );
    };

    if (loading || !recipe) {
        return (
            <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.safeArea, { backgroundColor: bgTheme.bg, justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={activeTheme.color} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.safeArea, { backgroundColor: bgTheme.bg }]}>
            <BackgroundPattern />
            <ScrollView>
                {/* ヘッダー部分：画像 */}
                <View style={[styles.imageContainer, !recipe.imageUrl ? styles.placeholderContainer : null]}>
                    {!!recipe.imageUrl ? (
                        <Image source={{ uri: recipe.imageUrl }} style={styles.image} />
                    ) : (
                        <View style={styles.placeholderIconContainer}>
                            <Ionicons name="restaurant-outline" size={100} color="#CCC" />
                        </View>
                    )}
                    <View style={styles.headerButtons}>
                        <TouchableOpacity
                            style={[styles.favoriteBtn, isFavorited ? styles.favoriteBtnActive : null]}
                            onPress={toggleFavorite}
                        >
                            <Ionicons
                                name={isFavorited ? "heart" : "heart-outline"}
                                size={24}
                                color={isFavorited ? "#FF3B30" : "#fff"}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={[styles.content, { backgroundColor: bgTheme.bg }]}>
                    <Text style={[styles.title, { color: bgTheme.text, fontSize: 24 * fontSizeScale, lineHeight: 32 * fontSizeScale }]}>{recipe.title}</Text>
                    <View style={styles.metaInfo}>
                        <View style={styles.metaLeft}>
                            <Ionicons name="time-outline" size={16} color={bgTheme.subText} />
                            <Text style={[styles.timeText, { color: bgTheme.subText }]}>調理時間: {recipe.time}</Text>
                        </View>
                        <DifficultyBadge level={recipe.difficultyLevel} showDetail />
                    </View>

                    {/* 【追加】カテゴリ（ジャンル）バッジ */}
                    {recipe.categories && recipe.categories.length > 0 && (
                        <View style={styles.detailCategoryContainer}>
                            {recipe.categories.map((catId: string) => {
                                const catInfo = RECIPE_CATEGORIES.find(c => c.id === catId);
                                if (!catInfo) return null;
                                return (
                                    <View key={catId} style={[styles.detailCategoryBadge, { backgroundColor: activeTheme.color + '15' }]}>
                                        <Text style={styles.detailCategoryEmoji}>{catInfo.emoji}</Text>
                                        <Text style={[styles.detailCategoryLabel, { color: activeTheme.color }]}>{catInfo.label}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    )}

                    {/* 栄養価カード */}
                    <View style={[styles.nutritionCard, { backgroundColor: activeTheme.color + '08', borderColor: activeTheme.color + '20' }]}>
                        <View style={styles.nutritionHeader}>
                            <Ionicons name="fitness-outline" size={20} color={activeTheme.color} />
                            <Text style={[styles.nutritionTitle, { color: activeTheme.color }]}>栄養成分表示 (1人前あたり)</Text>
                        </View>
                        <View style={styles.nutritionGrid}>
                            <View style={styles.nutritionItem}>
                                <Text style={[styles.nutritionValue, { color: bgTheme.text }]}>{nutrition.calories}<Text style={styles.nutritionUnit}>kcal</Text></Text>
                                <Text style={[styles.nutritionLabel, { color: bgTheme.subText }]}>エネルギー</Text>
                            </View>
                            <View style={styles.nutritionDivider} />
                            <View style={styles.nutritionItem}>
                                <Text style={[styles.nutritionValue, { color: bgTheme.text }]}>{nutrition.protein}<Text style={styles.nutritionUnit}>g</Text></Text>
                                <Text style={[styles.nutritionLabel, { color: bgTheme.subText }]}>タンパク質</Text>
                            </View>
                            <View style={styles.nutritionDivider} />
                            <View style={styles.nutritionItem}>
                                <Text style={[styles.nutritionValue, { color: bgTheme.text }]}>{nutrition.fat}<Text style={styles.nutritionUnit}>g</Text></Text>
                                <Text style={[styles.nutritionLabel, { color: bgTheme.subText }]}>脂質</Text>
                            </View>
                            <View style={styles.nutritionDivider} />
                            <View style={styles.nutritionItem}>
                                <Text style={[styles.nutritionValue, { color: bgTheme.text }]}>{nutrition.carbs}<Text style={styles.nutritionUnit}>g</Text></Text>
                                <Text style={[styles.nutritionLabel, { color: bgTheme.subText }]}>炭水化物</Text>
                            </View>
                        </View>

                        {/* 詳細トグルボタン (スマホ版・閉じている時のみ表示) */}
                        {isMobile && !showDetailedNutrition && (
                            <TouchableOpacity
                                style={[styles.nutritionToggle, { backgroundColor: activeTheme.color + '18', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 14 }]}
                                onPress={() => setShowDetailedNutrition(true)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="analytics-outline" size={14} color={activeTheme.color} />
                                <Text style={[styles.nutritionToggleText, { color: activeTheme.color }]}>
                                    詳細を表示
                                </Text>
                                <Ionicons name="chevron-down" size={14} color={activeTheme.color} />
                            </TouchableOpacity>
                        )}
                        {/* 詳細栄養素 (2カラムグリッド - 条件付き表示) */}
                        {/* 詳細栄養素 (グループ化表示) - PCは常に表示、スマホはトグル */}
                        {(showDetailedNutrition || !isMobile) && (
                            <View style={styles.nutritionDetailGrid}>
                                {/* ミネラルセクション */}
                                <Text style={[styles.nutritionGroupTitle, { backgroundColor: activeTheme.color + '15', color: activeTheme.color }]}>ミネラル</Text>
                                <View style={styles.nutritionGroupRow}>
                                    <View style={styles.nutritionDetailItem}>
                                        <Text style={[styles.nutritionDetailLabel, { color: bgTheme.subText }]}>カルシウム</Text>
                                        <Text style={[styles.nutritionDetailValue, { color: bgTheme.text }]}>{nutrition.calcium}mg</Text>
                                    </View>
                                    <View style={styles.nutritionDetailItem}>
                                        <Text style={[styles.nutritionDetailLabel, { color: bgTheme.subText }]}>鉄分</Text>
                                        <Text style={[styles.nutritionDetailValue, { color: bgTheme.text }]}>{nutrition.iron}mg</Text>
                                    </View>
                                    <View style={styles.nutritionDetailItem}>
                                        <Text style={[styles.nutritionDetailLabel, { color: bgTheme.subText }]}>マグネシウム</Text>
                                        <Text style={[styles.nutritionDetailValue, { color: bgTheme.text }]}>{nutrition.magnesium}mg</Text>
                                    </View>
                                    <View style={styles.nutritionDetailItem}>
                                        <Text style={[styles.nutritionDetailLabel, { color: bgTheme.subText }]}>カリウム</Text>
                                        <Text style={[styles.nutritionDetailValue, { color: bgTheme.text }]}>{nutrition.potassium}mg</Text>
                                    </View>
                                    <View style={styles.nutritionDetailItem}>
                                        <Text style={[styles.nutritionDetailLabel, { color: bgTheme.subText }]}>亜鉛</Text>
                                        <Text style={[styles.nutritionDetailValue, { color: bgTheme.text }]}>{nutrition.zinc}mg</Text>
                                    </View>
                                    <View style={styles.nutritionDetailItem}>
                                        <Text style={[styles.nutritionDetailLabel, { color: bgTheme.subText }]}>リン</Text>
                                        <Text style={[styles.nutritionDetailValue, { color: bgTheme.text }]}>{nutrition.phosphorus}mg</Text>
                                    </View>
                                </View>

                                {/* ビタミンセクション */}
                                <Text style={[styles.nutritionGroupTitle, { backgroundColor: activeTheme.color + '15', color: activeTheme.color }]}>ビタミン</Text>
                                <View style={styles.nutritionGroupRow}>
                                    <View style={styles.nutritionDetailItem}>
                                        <Text style={[styles.nutritionDetailLabel, { color: bgTheme.subText }]}>ビタミンA</Text>
                                        <Text style={[styles.nutritionDetailValue, { color: bgTheme.text }]}>{nutrition.vitaminA}μg</Text>
                                    </View>
                                    <View style={styles.nutritionDetailItem}>
                                        <Text style={[styles.nutritionDetailLabel, { color: bgTheme.subText }]}>ビタミンD</Text>
                                        <Text style={[styles.nutritionDetailValue, { color: bgTheme.text }]}>{nutrition.vitaminD}μg</Text>
                                    </View>
                                    <View style={styles.nutritionDetailItem}>
                                        <Text style={[styles.nutritionDetailLabel, { color: bgTheme.subText }]}>ビタミンE</Text>
                                        <Text style={[styles.nutritionDetailValue, { color: bgTheme.text }]}>{nutrition.vitaminE}mg</Text>
                                    </View>
                                    <View style={styles.nutritionDetailItem}>
                                        <Text style={[styles.nutritionDetailLabel, { color: bgTheme.subText }]}>ビタミンK</Text>
                                        <Text style={[styles.nutritionDetailValue, { color: bgTheme.text }]}>{nutrition.vitaminK}μg</Text>
                                    </View>
                                    <View style={styles.nutritionDetailItem}>
                                        <Text style={[styles.nutritionDetailLabel, { color: bgTheme.subText }]}>ビタミンB1</Text>
                                        <Text style={[styles.nutritionDetailValue, { color: bgTheme.text }]}>{nutrition.vitaminB1}mg</Text>
                                    </View>
                                    <View style={styles.nutritionDetailItem}>
                                        <Text style={[styles.nutritionDetailLabel, { color: bgTheme.subText }]}>ビタミンB2</Text>
                                        <Text style={[styles.nutritionDetailValue, { color: bgTheme.text }]}>{nutrition.vitaminB2}mg</Text>
                                    </View>
                                    <View style={styles.nutritionDetailItem}>
                                        <Text style={[styles.nutritionDetailLabel, { color: bgTheme.subText }]}>ビタミンB6</Text>
                                        <Text style={[styles.nutritionDetailValue, { color: bgTheme.text }]}>{nutrition.vitaminB6}mg</Text>
                                    </View>
                                    <View style={styles.nutritionDetailItem}>
                                        <Text style={[styles.nutritionDetailLabel, { color: bgTheme.subText }]}>ビタミンB12</Text>
                                        <Text style={[styles.nutritionDetailValue, { color: bgTheme.text }]}>{nutrition.vitaminB12}μg</Text>
                                    </View>
                                    <View style={styles.nutritionDetailItem}>
                                        <Text style={[styles.nutritionDetailLabel, { color: bgTheme.subText }]}>葉酸</Text>
                                        <Text style={[styles.nutritionDetailValue, { color: bgTheme.text }]}>{nutrition.folate}μg</Text>
                                    </View>
                                    <View style={styles.nutritionDetailItem}>
                                        <Text style={[styles.nutritionDetailLabel, { color: bgTheme.subText }]}>ビタミンC</Text>
                                        <Text style={[styles.nutritionDetailValue, { color: bgTheme.text }]}>{nutrition.vitaminC}mg</Text>
                                    </View>
                                </View>

                                {/* その他 */}
                                <Text style={[styles.nutritionGroupTitle, { backgroundColor: activeTheme.color + '15', color: activeTheme.color }]}>その他</Text>
                                <View style={styles.nutritionGroupRow}>
                                    <View style={styles.nutritionDetailItem}>
                                        <Text style={[styles.nutritionDetailLabel, { color: bgTheme.subText }]}>糖質</Text>
                                        <Text style={[styles.nutritionDetailValue, { color: bgTheme.text }]}>{nutrition.sugar}g</Text>
                                    </View>
                                    <View style={styles.nutritionDetailItem}>
                                        <Text style={[styles.nutritionDetailLabel, { color: bgTheme.subText }]}>食物繊維</Text>
                                        <Text style={[styles.nutritionDetailValue, { color: bgTheme.text }]}>{nutrition.fiber}g</Text>
                                    </View>
                                    <View style={styles.nutritionDetailItem}>
                                        <Text style={[styles.nutritionDetailLabel, { color: bgTheme.subText }]}>食塩相当量</Text>
                                        <Text style={[styles.nutritionDetailValue, { color: bgTheme.text }]}>{nutrition.salt}g</Text>
                                    </View>
                                </View>
                            </View>
                        )}
                        {/* 免責事項 */}
                        <View style={styles.nutritionDisclaimer}>
                            <Text style={[styles.nutritionDisclaimerText, { color: bgTheme.subText }]}>
                                ※数値はあくまで目安であり、実際の栄養価とは異なる場合があります。
                            </Text>
                        </View>

                        {isMobile && showDetailedNutrition && (
                            <TouchableOpacity
                                style={[styles.nutritionToggleBottom, { backgroundColor: activeTheme.color + '15' }]}
                                onPress={() => setShowDetailedNutrition(false)}
                            >
                                <Text style={[styles.nutritionToggleText, { color: activeTheme.color }]}>詳細を閉じる</Text>
                                <Ionicons name="chevron-up" size={16} color={activeTheme.color} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* 人数変更プルダウン風UI */}
                    <View style={styles.servingSelector}>
                        <Text style={[styles.servingText, { color: bgTheme.text }]}>分量：</Text>
                        <View style={styles.servingButtons}>
                            {[1, 2, 3, 4, 5].map((num) => (
                                <TouchableOpacity
                                    key={num}
                                    style={[
                                        styles.serveBtn,
                                        servings === num ? { backgroundColor: activeTheme.color + 'E6', borderColor: activeTheme.color } : null
                                    ]}
                                    onPress={() => setServings(num)}
                                >
                                    <Text style={[styles.serveBtnText, { color: servings === num ? '#fff' : bgTheme.text }]}>
                                        {num}人前
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* 材料リスト */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: activeTheme.color, fontSize: 20 * fontSizeScale }]}>材料 ({servings}人前)</Text>
                            <Text style={[styles.hintText, { color: activeTheme.color, fontSize: 13 * fontSizeScale }]}>💡タップで代用品を表示</Text>
                        </View>

                        {(() => {
                            const sortedIngredients = [...recipe.ingredients]; // ソートを廃止して配列順を優先

                            return sortedIngredients.map((item, index) => {
                                const hasSubstitute = !!SUBSTITUTE_DICTIONARY[item.name];
                                const isGroupChanged = index > 0 && item.group !== sortedIngredients[index - 1].group;
                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={[styles.ingredientRow, isGroupChanged && { marginTop: 12 }]}
                                        onPress={() => {
                                            if (item.unit === '少々') {
                                                setPinchPopupVisible(true);
                                            } else {
                                                handleLongPress(item.name);
                                            }
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.ingredientNameBox}>
                                            <Text style={[styles.ingredientName, { color: bgTheme.text, fontSize: 16 * fontSizeScale }]}>
                                                {item.group ? <Text style={{ fontWeight: 'bold', color: getGroupColor(item.group) }}>{item.group} </Text> : null}
                                                {item.name}
                                                {substitutedIngredients[item.name] && (
                                                    <Text style={{ color: activeTheme.color, fontWeight: 'bold' }}> (代用: {substitutedIngredients[item.name].name})</Text>
                                                )}
                                            </Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                {!!hasSubstitute && !substitutedIngredients[item.name] && (
                                                    <Ionicons name="bulb" size={16} color="#FFD166" style={{ marginLeft: 4 }} />
                                                )}
                                            </View>
                                        </View>
                                        {item.unit === '少々' ? (
                                            <View style={styles.amountContainer}>
                                                <TouchableOpacity
                                                    style={styles.pinchAmountBox}
                                                    onPress={() => setPinchPopupVisible(true)}
                                                >
                                                    <Text style={[styles.pinchAmountText, { color: bgTheme.text }]}>少々</Text>
                                                    <Ionicons name="help-circle-outline" size={18} color={bgTheme.subText} style={{ marginLeft: 3 }} />
                                                </TouchableOpacity>
                                            </View>
                                        ) : (
                                            <View style={styles.amountContainer}>
                                                <Text style={[styles.ingredientAmount, { color: bgTheme.text, fontSize: 16 * fontSizeScale }]}>{calculateAmount(item).mainText}</Text>
                                                {calculateAmount(item).subText !== '' ? (
                                                    <Text style={[styles.ingredientSubAmount, { color: bgTheme.subText }]}>{calculateAmount(item).subText}</Text>
                                                ) : null}
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            });
                        })()}
                    </View>

                    {/* 食材購入リンク（収益化モック） */}
                    <View style={styles.affiliateContainer}>
                        <Text style={[styles.affiliateTitle, { color: bgTheme.text }]}>🛍 食材をまとめて購入</Text>
                        <View style={styles.affiliateButtons}>
                            <TouchableOpacity
                                style={[styles.affiliateBtn, { backgroundColor: '#FF9900' }]}
                                onPress={() => Alert.alert('Amazon', 'Amazonの検索結果（食材）へ遷移します。')}
                            >
                                <Ionicons name="cart" size={18} color="#fff" />
                                <Text style={styles.affiliateBtnText}>Amazonで探す</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.affiliateBtn, { backgroundColor: '#BF0000' }]}
                                onPress={() => Alert.alert('楽天', '楽天市場の検索結果（食材）へ遷移します。')}
                            >
                                <Ionicons name="cart" size={18} color="#fff" />
                                <Text style={styles.affiliateBtnText}>楽天で探す</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* 作り方見出し */}
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: activeTheme.color, fontSize: 20 * fontSizeScale }]}>作り方</Text>
                    </View>
                    <View style={styles.stepsList}>
                        {recipe.steps.map((step, index) => (
                            <View key={index} style={styles.stepRow}>
                                <View style={[styles.stepNumberBox, { backgroundColor: activeTheme.color }]}>
                                    <Text style={styles.stepNumber}>{index + 1}</Text>
                                </View>
                                {renderStepText(step)}
                            </View>
                        ))}
                    </View>

                    {/* --- 下部アクションボタン --- */}
                    <View style={styles.actionButtons}>
                        <AppButton
                            title={isFavorited ? "♥ お気に入り解除" : "★ お気に入りに保存"}
                            type={isFavorited ? "outline" : "secondary"}
                            onPress={toggleFavorite}
                        />
                        <AppButton
                            title="✏️ 自分流にアレンジ編集"
                            type="primary"
                            onPress={() => {
                                if (!recipe) return;
                                // MasterRecipe の材料形式を SavedIngredient 形式（文字列）に変換
                                const formattedIngredients = recipe.ingredients.map(ing => ({
                                    name: ing.name,
                                    amount: `${ing.amount}${ing.unit}`
                                }));

                                navigation.navigate('RecipeEdit', {
                                    recipeId: recipe.id,
                                    originalRecipe: {
                                        title: recipe.title,
                                        imageUrl: recipe.imageUrl,
                                        ingredients: recipe.ingredients.map(ing => ({
                                            name: ing.name,
                                            amount: calculateAmount(ing).mainText, // 補足(約...g)を含まないクリーンな分量
                                            group: ing.group
                                        })),
                                        steps: recipe.steps,
                                        note: '',
                                        categories: recipe.categories
                                    }
                                });
                            }}
                        />
                    </View>

                </View>
            </ScrollView>

            {/* 代替食材ポップアップ */}
            {selectedIngredient && (
                <SubstitutePopup
                    visible={popupVisible}
                    onClose={() => setPopupVisible(false)}
                    originalIngredient={selectedIngredient.name}
                    substituteName={selectedIngredient.substitute?.name}
                    substituteAmount={selectedIngredient.substitute?.amount}
                    affiliateLink={selectedIngredient.substitute?.affiliateLink}
                    onApply={() => {
                        setSubstitutedIngredients(prev => ({
                            ...prev,
                            [selectedIngredient.name]: selectedIngredient.substitute
                        }));
                        setPopupVisible(false);
                    }}
                />
            )}

            {/* 「少々」専用の底のり解説ポップアップ */}
            <Modal visible={pinchPopupVisible} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.pinchOverlay}
                    activeOpacity={1}
                    onPress={() => setPinchPopupVisible(false)}
                >
                    <View style={styles.pinchPopup}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Ionicons name="help-circle" size={28} color={activeTheme.color} />
                            <Text style={styles.pinchPopupTitle}>「少々」ってどのくらい？</Text>
                        </View>
                        <View style={styles.pinchRow}>
                            <Text style={styles.pinchEmoji}>🤏</Text>
                            <Text style={styles.pinchDesc}>
                                「少々」は、親指と人差し指で自然につまんだ量です。
                            </Text>
                        </View>
                        <View style={styles.pinchTable}>
                            <View style={styles.pinchTableRow}>
                                <Text style={styles.pinchTableLabel}>目安の量</Text>
                                <Text style={styles.pinchTableValue}>約 0.5g～1g（小さじ1/8相当）</Text>
                            </View>
                            <View style={styles.pinchTableRow}>
                                <Text style={styles.pinchTableLabel}>コツ</Text>
                                <Text style={styles.pinchTableValue}>{`味に大きな影響はありません。\nお好みで調整してください。`}</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={[styles.pinchCloseBtn, { backgroundColor: activeTheme.color }]}
                            onPress={() => setPinchPopupVisible(false)}
                        >
                            <Text style={styles.pinchCloseBtnText}>閉じる</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* 切り方解説ポップアップ */}
            <Modal visible={cuttingPopupVisible} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.pinchOverlay}
                    activeOpacity={1}
                    onPress={() => setCuttingPopupVisible(false)}
                >
                    <View style={styles.pinchPopup}>
                        {selectedCutting && (
                            <>
                                <Text style={styles.pinchPopupTitle}>🔪 {selectedCutting.name}</Text>
                                <View style={styles.cuttingImageContainer}>
                                    <Image
                                        source={{ uri: selectedCutting.imageUrl }}
                                        style={styles.cuttingImage}
                                        onError={(e) => console.log('画像読み込みエラー:', e.nativeEvent.error)}
                                    />
                                </View>
                                <Text style={styles.pinchDesc}>{selectedCutting.description}</Text>
                                <View style={styles.pinchTable}>
                                    <View style={styles.pinchTableRow}>
                                        <Text style={styles.pinchTableLabel}>目安サイズ</Text>
                                        <Text style={styles.pinchTableValue}>{selectedCutting.size}</Text>
                                    </View>
                                    <View style={styles.pinchTableRow}>
                                        <Text style={styles.pinchTableLabel}>💡 コツ</Text>
                                        <Text style={styles.pinchTableValue}>{selectedCutting.tip}</Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={styles.pinchCloseBtn}
                                    onPress={() => setCuttingPopupVisible(false)}
                                >
                                    <Text style={styles.pinchCloseBtnText}>閉じる</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    imageContainer: { position: 'relative' },
    image: { width: '100%', height: 260, backgroundColor: '#eee', overflow: 'hidden' as const },
    placeholderContainer: {
        backgroundColor: '#F5F5F5',
        height: 260,
    },
    placeholderIconContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        height: 260,
    },
    headerButtons: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    favoriteBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    favoriteBtnActive: {
        backgroundColor: 'rgba(255,255,255,0.9)',
    },
    content: { padding: 16 },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        lineHeight: 32,
        textShadowColor: 'rgba(255, 255, 255, 0.9)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
    },
    metaInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    metaLeft: { flexDirection: 'row', alignItems: 'center' },
    timeText: { marginLeft: 4, color: '#666', fontSize: 14 },
    servingSelector: { backgroundColor: '#F8F9FA', padding: 12, borderRadius: 12, marginBottom: 24 },
    servingText: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#333' },
    servingButtons: { flexDirection: 'row', justifyContent: 'space-between' },
    serveBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd' },
    serveBtnActive: { backgroundColor: '#FF6F61', borderColor: '#FF6F61' },
    serveBtnText: { color: '#666', fontWeight: 'bold' },
    serveBtnTextActive: { color: '#fff' },
    section: { marginBottom: 32, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 12, padding: 12 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 8, marginBottom: 16 },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        textShadowColor: 'rgba(255, 255, 255, 0.9)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 6,
    },
    hintText: { fontSize: 13 }, // color はインラインで適用
    ingredientRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    ingredientLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
    ingredientNameBox: { flexDirection: 'row', alignItems: 'center' },
    ingredientName: { fontSize: 16, color: '#333' },

    // 分量の右側コンテナ
    amountContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 6 },
    ingredientAmount: { fontSize: 16, fontWeight: 'bold', color: '#444' },
    // 追加の目安分量（バッジ風デザイン）
    ingredientSubAmount: {
        fontSize: 13,
        color: '#666',
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 6,
        overflow: 'hidden'
    },

    // 手順リスト全体を少し下げる（作り方タイトルとの間隔調整）
    stepsList: {
        marginTop: 12,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 12,
        padding: 12,
    },
    // 「少々」専用スタイル
    pinchAmountBox: { flexDirection: 'row', alignItems: 'center', paddingVertical: 2 },
    pinchAmountText: { fontSize: 16, color: '#666' },
    pinchOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    pinchPopup: {
        backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '88%', alignItems: 'center', gap: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
    },
    pinchPopupTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    pinchRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, width: '100%' },
    pinchEmoji: { fontSize: 40 },
    pinchDesc: { flex: 1, fontSize: 15, color: '#555', lineHeight: 22 },
    pinchTable: { width: '100%', gap: 14, backgroundColor: '#F8F9FA', borderRadius: 8, padding: 12 },
    pinchTableRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    pinchTableLabel: { fontSize: 13, fontWeight: 'bold', color: '#666', width: 68 },
    pinchTableValue: { fontSize: 13, color: '#444', flex: 1, textAlign: 'left' },
    pinchCloseBtn: { backgroundColor: '#FF6F61', paddingVertical: 10, paddingHorizontal: 36, borderRadius: 20 },
    pinchCloseBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
    stepRow: { flexDirection: 'row', marginBottom: 16 },
    stepNumberBox: {
        width: 24, // 28から24へ縮小
        height: 24, // 28から24へ縮小
        borderRadius: 12, // 半径も14から12へ
        backgroundColor: '#FF6F61',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10, // 余白も少し調整
        marginTop: 2
    },
    stepNumber: { color: '#fff', fontWeight: 'bold', fontSize: 13 }, // フォントサイズも明示的に少し小さく
    stepText: { flex: 1, fontSize: 16, lineHeight: 24, color: '#333' },
    actionButtons: { marginTop: 16, marginBottom: 40 },
    // 切り方解説用のスタイル（他は少々の使い回し）
    cuttingHighlight: {
        color: '#333', // 色は本文と同じ
        textDecorationLine: 'underline',
        textDecorationStyle: 'dotted', // 点線下線で控えめにアピール
        textDecorationColor: '#999',
    },
    cuttingHelpBadge: {
        fontSize: 13, // 中間くらいのサイズにUP
        fontWeight: 'bold',
        color: '#777',
        backgroundColor: '#F0F0F0',
        borderRadius: 10,
        paddingHorizontal: 6,
        overflow: 'hidden',
        paddingTop: 1,
    },
    cuttingImageContainer: {
        width: '100%',
        height: 140, // 枠の高さを確保
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#E0E0E0',
    },
    cuttingImage: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        marginTop: 12,
        backgroundColor: '#eee',
    },
    affiliateContainer: {
        marginVertical: 16,
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    affiliateTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    affiliateButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    affiliateBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 6,
    },
    affiliateBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    detailCategoryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20,
    },
    detailCategoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        gap: 4,
    },
    detailCategoryEmoji: {
        fontSize: 14,
    },
    detailCategoryLabel: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    // 栄養価カード
    nutritionCard: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 24,
    },
    nutritionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginBottom: 12,
    },
    nutritionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    nutritionGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    nutritionItem: {
        flex: 1,
        alignItems: 'center',
    },
    nutritionValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    nutritionUnit: {
        fontSize: 10,
        fontWeight: 'normal',
        marginLeft: 1,
    },
    nutritionLabel: {
        fontSize: 10,
        marginTop: 2,
    },
    nutritionDivider: {
        width: 1,
        height: 24,
        backgroundColor: '#eee',
    },
    nutritionToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        paddingVertical: 8,
        paddingHorizontal: 16,
        gap: 6,
        alignSelf: 'center',
    },
    nutritionToggleBottom: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        gap: 6,
        alignSelf: 'center',
    },
    nutritionToggleText: {
        fontSize: 12,
        fontWeight: '600',
    },
    nutritionDetailGrid: {
        paddingBottom: 8,
    },
    nutritionGroupTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        textAlign: 'center',
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 4,
        marginVertical: 8,
        letterSpacing: 1,
        overflow: 'hidden',
    },
    nutritionGroupRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    nutritionDetailItem: {
        width: '50%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        paddingVertical: 3,
    },
    nutritionDetailLabel: {
        fontSize: 11,
    },
    nutritionDetailValue: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    nutritionDisclaimer: {
        marginTop: 12,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    nutritionDisclaimerText: {
        fontSize: 10,
        lineHeight: 14,
        fontStyle: 'italic',
    },
    // アレルギーバッジ
    allergyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF6F61',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        marginLeft: 6,
        gap: 2,
    },
    allergyText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
});
