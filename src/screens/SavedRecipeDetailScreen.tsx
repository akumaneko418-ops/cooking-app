import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getMyRecipes, deleteMyRecipe, SavedRecipe, getMasterRecipes, MasterRecipe } from '../utils/storage';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme, getGroupColor } from '../context/ThemeContext';
import { useUIConfig } from '../context/UIConfigContext';
import { parseAmount } from '../utils/nutritionUtils';

export default function SavedRecipeDetailScreen({ route, navigation }: any) {
    const { recipeId } = route.params;
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const [recipe, setRecipe] = useState<SavedRecipe | null>(null);
    const [originalRecipe, setOriginalRecipe] = useState<MasterRecipe | null>(null);
    const { activeTheme, bgTheme } = useTheme();
    const { fontSizeScale } = useUIConfig();

    useFocusEffect(
        useCallback(() => {
            const loadRecipe = async () => {
                const allRecipes = await getMyRecipes();
                const found = allRecipes.find(r => r.id === recipeId);
                if (found) {
                    setRecipe(found);

                    // 元レシピ（マスター）があれば取得
                    if (found.originalRecipeId) {
                        const masters = await getMasterRecipes();
                        const master = masters.find(m => m.id === found.originalRecipeId);
                        if (master) {
                            setOriginalRecipe(master);
                        }
                    }
                } else {
                    Alert.alert('エラー', 'レシピが見つかりませんでした');
                    navigation.goBack();
                }
            };
            loadRecipe();
        }, [recipeId])
    );

    const handleEdit = () => {
        if (!recipe) return;
        navigation.navigate('RecipeEdit', {
            recipeId: recipe.id,
            originalRecipe: {
                title: recipe.title,
                ingredients: recipe.ingredients,
                steps: recipe.steps,
                stepTips: recipe.stepTips,
                note: recipe.note,
                imageUrl: recipe.imageUrl,
                categories: recipe.categories
            },
            isOriginal: recipe.isOriginal
        });
    };

    const handleDelete = () => {
        Alert.alert(
            'レシピの削除',
            'このアレンジレシピを削除してもよろしいですか？',
            [
                { text: 'キャンセル', style: 'cancel' },
                {
                    text: '削除する', style: 'destructive', onPress: async () => {
                        await deleteMyRecipe(recipeId);
                        navigation.goBack();
                    }
                }
            ]
        );
    };

    if (!recipe) {
        return (
            <SafeAreaView style={[styles.safeArea, { backgroundColor: bgTheme.bg }]}>
                <Text style={styles.loadingText}>読み込み中...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: bgTheme.bg }]}>
            <ScrollView contentContainerStyle={styles.container}>

                {/* ユーザーが設定したオリジナル画像、なければダミーを表示 */}
                <View style={[styles.imageContainer, !recipe.imageUrl ? styles.placeholderContainer : null]}>
                    {!!recipe.imageUrl ? (
                        <Image source={{ uri: recipe.imageUrl }} style={styles.heroImage} />
                    ) : (
                        <View style={styles.placeholderIconContainer}>
                            <Ionicons name="restaurant-outline" size={100} color="#CCC" />
                        </View>
                    )}
                </View>

                <Text style={[styles.title, { color: bgTheme.text }]}>{recipe.title}</Text>

                {/* 操作ボタンエリア */}
                <View style={styles.actionButtonsRow}>
                    <TouchableOpacity style={[styles.editBtn, { backgroundColor: activeTheme.color }]} onPress={handleEdit}>
                        <Ionicons name="create-outline" size={16} color="#fff" />
                        <Text style={styles.editBtnText}>このレシピを編集</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                        <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                        <Text style={styles.deleteBtnText}>削除</Text>
                    </TouchableOpacity>
                </View>

                {!!recipe.note && (
                    <View style={styles.noteBox}>
                        <Text style={styles.noteTitle}>📝 メモ</Text>
                        <Text style={styles.noteText}>{recipe.note}</Text>
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: activeTheme.color }]}>材料</Text>
                    {originalRecipe && (
                        <View style={styles.arrangeHintContainer}>
                            <Ionicons name="sparkles" size={14} color={activeTheme.color} />
                            <Text style={styles.arrangeHint}>マークがついている項目はアレンジした内容です</Text>
                        </View>
                    )}
                    <View style={[styles.ingList, { backgroundColor: bgTheme.surface }]}>
                        {(() => {
                            const sortedIngredients = [...recipe.ingredients];

                            return sortedIngredients.map((item, index) => {
                                // 元の材料リストと比較（同一インデックスまたは名称で比較）
                                const isModified = originalRecipe && !originalRecipe.ingredients.some(orig =>
                                    orig.name === item.name && `${orig.amount}${orig.unit}` === item.amount
                                );

                                const parsed = parseAmount(item.amount);
                                let displayAmount = item.amount;
                                let subText = '';

                                // 大さじ・小さじの(ml)併記
                                if (parsed.unit === '大さじ' && parsed.value > 0) {
                                    const ml = Math.round(parsed.value * 15);
                                    if (!displayAmount.includes(`${ml}ml`)) {
                                        subText = ` (${ml}ml)`;
                                    }
                                } else if (parsed.unit === '小さじ' && parsed.value > 0) {
                                    const ml = Math.round(parsed.value * 5);
                                    if (!displayAmount.includes(`${ml}ml`)) {
                                        subText = ` (${ml}ml)`;
                                    }
                                }

                                const isGroupChanged = index > 0 && item.group !== sortedIngredients[index - 1].group;

                                return (
                                    <View key={index} style={[styles.ingRow, isGroupChanged && { marginTop: 12 }]}>
                                        <View style={styles.ingNameContainer}>
                                            <Text style={[styles.ingName, { color: bgTheme.text }]}>
                                                {item.group ? <Text style={{ fontWeight: 'bold', color: getGroupColor(item.group) }}>{item.group} </Text> : null}
                                                {item.name}
                                            </Text>
                                            {isModified && (
                                                <Ionicons name="sparkles" size={14} color={activeTheme.color} style={styles.modifiedIcon} />
                                            )}
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Text style={[styles.ingAmount, { color: bgTheme.text }]}>{displayAmount}</Text>
                                            {subText !== '' && (
                                                <Text style={[styles.ingAmount, { color: bgTheme.subText, fontSize: 12, marginLeft: 4 }]}>{subText}</Text>
                                            )}
                                        </View>
                                    </View>
                                );
                            });
                        })()}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: activeTheme.color }]}>作り方</Text>
                    <View style={styles.stepList}>
                        {recipe.steps.map((step, index) => {
                            // 手順の比較
                            const isModified = originalRecipe && (
                                index >= originalRecipe.steps.length || originalRecipe.steps[index] !== step
                            );

                            return (
                                <View key={index} style={styles.stepRow}>
                                    <View style={[styles.stepNumberBox, { backgroundColor: activeTheme.color }]}>
                                        <Text style={styles.stepNumber}>{index + 1}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.stepText, { color: bgTheme.text }]}>{step}</Text>
                                        {recipe.stepTips?.[index]?.trim() ? (
                                            <View style={styles.stepTipBubble}>
                                                <Text style={styles.stepTipBubbleText}>{recipe.stepTips[index].trim()}</Text>
                                            </View>
                                        ) : null}
                                    </View>
                                    {isModified && (
                                        <Ionicons name="sparkles" size={16} color={activeTheme.color} style={styles.stepModifiedIcon} />
                                    )}
                                </View>
                            );
                        })}
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    container: { paddingBottom: 40 }, // 画像を全幅にするため左右のpaddingを外す
    heroImage: {
        width: '100%',
        height: 200,
        backgroundColor: '#f0f0f0',
        resizeMode: 'cover',
    },
    imageContainer: {
        width: '100%',
        height: 250,
        position: 'relative',
    },
    placeholderContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
    },
    placeholderIconContainer: {
        width: '100%',
        height: 250,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
    },
    loadingText: { textAlign: 'center', marginTop: 40, color: '#666' },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
        lineHeight: 32,
        paddingHorizontal: 16,
        textShadowColor: 'rgba(255, 255, 255, 0.9)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 20,
        gap: 12
    },
    editBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        backgroundColor: '#FF6F61',
        borderRadius: 8,
    },
    editBtnText: {
        color: '#fff',
        marginLeft: 6,
        fontWeight: 'bold',
        fontSize: 14
    },
    deleteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#FEECEB',
        borderRadius: 8,
    },
    deleteBtnText: { color: '#FF3B30', marginLeft: 4, fontWeight: 'bold', fontSize: 14 },
    noteBox: { backgroundColor: '#FFF9C4', padding: 12, borderRadius: 8, marginBottom: 24, marginHorizontal: 16 },
    noteTitle: { fontWeight: 'bold', color: '#F57F17', marginBottom: 4 },
    noteText: { color: '#333', lineHeight: 20 },
    section: { marginBottom: 32, paddingHorizontal: 16 },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1565C0',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 8,
        marginBottom: 12,
        textShadowColor: 'rgba(255, 255, 255, 0.9)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 6,
    },
    arrangeHintContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        marginLeft: 2,
        gap: 4,
    },
    arrangeHint: {
        fontSize: 12,
        color: '#888',
    },
    ingList: { backgroundColor: '#F8F9FA', borderRadius: 8, padding: 12 },
    ingRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
    ingNameContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 4 },
    ingName: { fontSize: 16, color: '#333' },
    modifiedIcon: { marginLeft: 2 },
    ingAmount: { fontSize: 16, fontWeight: 'bold', color: '#555' },
    stepList: { marginTop: 8 },
    stepRow: { flexDirection: 'row', marginBottom: 16, position: 'relative' },
    stepNumberBox: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FF6F61', justifyContent: 'center', alignItems: 'center', marginRight: 10, marginTop: 2 },
    stepNumber: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
    stepText: { flex: 1, fontSize: 16, lineHeight: 24, color: '#333' },
    stepModifiedIcon: { position: 'absolute', right: -6, top: -4 },
    paddingContainer: { paddingHorizontal: 16, marginBottom: 24 },
    nutritionCard: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    nutritionHeader: {
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'stretch',
        marginBottom: 16,
    },
    nutritionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    nutritionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    nutritionToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        gap: 6,
        alignSelf: 'center',
        marginTop: 10,
    },
    nutritionToggleText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    mainNutritionRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        marginBottom: 8,
    },
    mainNutritionItem: {
        alignItems: 'center',
    },
    mainNutritionValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    mainNutritionLabel: {
        fontSize: 11,
        marginTop: 2,
    },
    nutritionDivider: {
        width: 1,
        height: 24,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginBottom: 4,
    },
    nutritionDetails: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    nutritionGroupTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 12,
        textAlign: 'center',
        overflow: 'hidden',
    },
    nutritionGroupRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
    },
    nutritionDetailItem: {
        width: '33.3%',
        paddingVertical: 8,
        alignItems: 'center',
    },
    nutritionDetailLabel: {
        fontSize: 11,
        marginBottom: 2,
    },
    nutritionDetailValue: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    nutritionDisclaimer: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    nutritionDisclaimerText: {
        fontSize: 10,
        textAlign: 'center',
        lineHeight: 14,
    },
    nutritionToggleBottom: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        marginTop: 16,
        borderRadius: 20,
        gap: 6,
        alignSelf: 'center',
    },
    stepTipBubble: {
        backgroundColor: '#FFFDE7',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginTop: 6,
    },
    stepTipBubbleText: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
    },
});
