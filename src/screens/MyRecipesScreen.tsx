import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, useWindowDimensions, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRef } from 'react';
import { AppButton } from '../components/AppButton';
import { RecipeCard } from '../components/RecipeCard';
import { SavedRecipe, FavoriteRecipe } from '../utils/storage';
import { calculateNutrition } from '../utils/nutritionUtils';
import { useTheme } from '../context/ThemeContext';
import { useLayout } from '../context/LayoutContext';
import { useUIConfig } from '../context/UIConfigContext';
import BackgroundPattern from '../components/BackgroundPattern';
import { useMyRecipes } from '../hooks/useMyRecipes';

const FILTER_OPTIONS = ['all', 'japanese', 'western', 'chinese', 'korean', 'sweets'];
import { RECIPE_CATEGORIES } from '../data/RecipeCategories';

// --- お気に入り画面 ---
export function FavoriteRecipesScreen({ navigation }: any) {
    const { favorites, toggleFavorite } = useMyRecipes();
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const { activeTheme, bgTheme } = useTheme();
    const { fontSizeScale } = useUIConfig();
    const { layoutType, setLayoutType, numColumns } = useLayout();
    const { width: SCREEN_WIDTH } = useWindowDimensions();

    const itemWidth = useMemo(() => {
        if (numColumns === 2) return (SCREEN_WIDTH - 32 - 8) / 2; // 左右16px余白, gap 8px
        if (numColumns === 3) return (SCREEN_WIDTH - 32 - 16) / 3; // 左右16px余白, gap 8px * 2
        return '100%';
    }, [SCREEN_WIDTH, numColumns]);

    const filteredData = useMemo(() => {
        if (selectedCategory === 'all') return favorites;
        return favorites.filter(item => item.categories?.includes(selectedCategory));
    }, [favorites, selectedCategory]);

    const renderItem = ({ item: recipe }: { item: FavoriteRecipe }) => {
        return (
            <View style={{ width: itemWidth, marginBottom: layoutType === 'list' ? 16 : 6 }}>
                <RecipeCard
                    variant={layoutType}
                    title={recipe.title}
                    time={recipe.time}
                    imageUrl={recipe.imageUrl ? recipe.imageUrl : ""}
                    difficultyLevel={recipe.difficultyLevel}
                    isFavorited={favorites.some(f => f.id === recipe.id)}
                    onFavoriteToggle={() => toggleFavorite(recipe)}
                    categories={recipe.categories}
                    onPress={() => navigation.navigate('RecipeDetail', { recipeId: recipe.id })}
                    style={{ flex: 1 }}
                />
            </View>
        );
    };

    const renderCategoryMenu = () => (
        <View style={styles.categoryMenuContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.categoryMenuRow}>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {FILTER_OPTIONS.map(option => {
                            const isSelected = selectedCategory === option;
                            const catInfo = RECIPE_CATEGORIES.find(c => c.id === option);
                            const label = catInfo ? catInfo.label : option;
                            return (
                                <TouchableOpacity
                                    key={option}
                                    style={[
                                        styles.categoryTab,
                                        isSelected ? { backgroundColor: activeTheme.color + 'E6' } : { backgroundColor: activeTheme.color + '1A' }
                                    ]}
                                    onPress={() => setSelectedCategory(option)}
                                >
                                    <Text
                                        style={[
                                            styles.categoryTabText,
                                            { fontSize: 13 * fontSizeScale },
                                            isSelected ? {
                                                color: '#fff',
                                            } : { color: bgTheme.subText }
                                        ]}
                                    >{label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

            </View>
        </View>
    );

    return (
        <SafeAreaView edges={['left', 'right']} style={[styles.safeArea, { backgroundColor: bgTheme.bg }]}>
            <BackgroundPattern />
            {renderCategoryMenu()}
            <View style={styles.container}>
                <FlatList
                    key={layoutType}
                    data={filteredData}
                    numColumns={numColumns}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    columnWrapperStyle={numColumns > 1 ? { gap: 8 } : undefined}
                    contentContainerStyle={[
                        styles.listContainer,
                        layoutType !== 'list' && layoutType !== 'compact' && { paddingHorizontal: 0 }
                    ]}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: bgTheme.subText, fontSize: 16 * fontSizeScale }]}>
                                {favorites.length === 0 ? "お気に入り登録したレシピがありません" : "該当するレシピがありません"}
                            </Text>
                        </View>
                    }
                />
            </View>
        </SafeAreaView>
    );
}

// --- アレンジ・自作画面 ---
export function EditedRecipesScreen({ navigation }: any) {
    const { myRecipes, favorites, toggleFavorite } = useMyRecipes();
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const { activeTheme, bgTheme } = useTheme();
    const { fontSizeScale } = useUIConfig();
    const { layoutType, setLayoutType, numColumns } = useLayout();
    const { width: SCREEN_WIDTH } = useWindowDimensions();

    const itemWidth = useMemo(() => {
        if (numColumns === 2) return (SCREEN_WIDTH - 32 - 8) / 2;
        if (numColumns === 3) return (SCREEN_WIDTH - 32 - 16) / 3;
        return '100%';
    }, [SCREEN_WIDTH, numColumns]);

    const filteredData = useMemo(() => {
        if (selectedCategory === 'all') return myRecipes;
        return myRecipes.filter(item => item.categories?.includes(selectedCategory));
    }, [myRecipes, selectedCategory]);

    const renderItem = ({ item: recipe }: { item: SavedRecipe }) => {
        return (
            <View style={{ width: itemWidth, marginBottom: layoutType === 'list' ? 16 : 6 }}>
                <RecipeCard
                    variant={layoutType}
                    title={recipe.title}
                    time={recipe.isOriginal ? "オリジナル" : "アレンジ済み"}
                    imageUrl={recipe.imageUrl ? recipe.imageUrl : ""}
                    difficultyLevel={undefined}
                    isFavorited={favorites.some(f => f.id === recipe.id)}
                    onFavoriteToggle={() => toggleFavorite(recipe)}
                    categories={recipe.categories}
                    onPress={() => navigation.navigate('SavedRecipeDetail', { recipeId: recipe.id })}
                    style={{ flex: 1 }}
                />
            </View>
        );
    };

    const renderCategoryMenu = () => (
        <View style={styles.categoryMenuContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.categoryMenuRow}>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {FILTER_OPTIONS.map(option => {
                            const isSelected = selectedCategory === option;
                            const catInfo = RECIPE_CATEGORIES.find(c => c.id === option);
                            const label = catInfo ? catInfo.label : option;
                            return (
                                <TouchableOpacity
                                    key={option}
                                    style={[
                                        styles.categoryTab,
                                        isSelected ? { backgroundColor: activeTheme.color + 'E6' } : { backgroundColor: activeTheme.color + '1A' }
                                    ]}
                                    onPress={() => setSelectedCategory(option)}
                                >
                                    <Text
                                        style={[
                                            styles.categoryTabText,
                                            { fontSize: 13 * fontSizeScale },
                                            isSelected ? { color: '#fff' } : { color: bgTheme.subText }
                                        ]}
                                    >{label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

            </View>
        </View>
    );

    return (
        <SafeAreaView edges={['left', 'right']} style={[styles.safeArea, { backgroundColor: bgTheme.bg }]}>
            <BackgroundPattern />
            {renderCategoryMenu()}
            <View style={styles.container}>
                <FlatList
                    key={layoutType}
                    data={filteredData}
                    numColumns={numColumns}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    columnWrapperStyle={numColumns > 1 ? { gap: 8 } : undefined}
                    contentContainerStyle={[
                        styles.listContainer,
                        layoutType !== 'list' && layoutType !== 'compact' && { paddingHorizontal: 0 }
                    ]}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: bgTheme.subText, fontSize: 16 * fontSizeScale }]}>
                                {myRecipes.length === 0 ? "保存したレシピがありません" : "該当するレシピがありません"}
                            </Text>
                        </View>
                    }
                />
                <TouchableOpacity
                    style={[
                        styles.fab,
                        { backgroundColor: activeTheme.color, width: 60 * fontSizeScale, height: 60 * fontSizeScale, borderRadius: 30 * fontSizeScale }
                    ]}
                    onPress={() => navigation.navigate('RecipeEdit', { isOriginal: true })}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.fabIcon, { fontSize: 28 * fontSizeScale, lineHeight: 32 * fontSizeScale }]}>＋</Text>
                    <Text style={[styles.fabText, { fontSize: 11 * fontSizeScale }]}>作成</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

// 互換性のためのデフォルトエクスポート（必要に応じて）
export default FavoriteRecipesScreen;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        flex: 1,
        paddingHorizontal: 16,
    },
    listContainer: {
        paddingTop: 8,
        paddingBottom: 110, // FAB(60px) + 余白(20px) + α を考慮した十分なスペース
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        fontSize: 16,
        textShadowColor: 'rgba(255, 255, 255, 0.9)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 4,
    },
    cardContainer: {
        marginBottom: 4,
    },
    fab: {
        position: 'absolute',
        bottom: 20, // タブバーのすぐ上の自然な位置に移動
        right: 20,
        width: 60, // 70 -> 60 へ少し小型化
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 6,
        zIndex: 100,
    },
    fabIcon: { color: '#fff', fontSize: 28, fontWeight: 'bold', lineHeight: 32 }, // アイコンも合わせて微調整
    fabText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
    scrollTopBtn: {
        position: 'absolute',
        bottom: 20,
        right: 16,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        zIndex: 100,
    },
    scrollTopText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    categoryMenuContainer: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
        backgroundColor: 'transparent',
    },
    categoryMenuRow: {
        flex: 1,
    },
    layoutSwitcher: {
        flexDirection: 'row',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 4,
        gap: 4,
    },
    layoutBtn: {
        padding: 8,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryTab: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryTabText: {
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    draggableItemContainer: {
        flex: 1,
        marginBottom: 8,
        paddingHorizontal: 4,
    },
});

