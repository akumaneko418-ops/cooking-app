import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RecipeCard } from './RecipeCard';
import { calculateNutrition } from '../utils/nutritionUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;
const SNAP_INTERVAL = SCREEN_WIDTH;

interface RecommendedCarouselProps {
    recipes: any[];
    favorites: any[];
    toggleFavorite: (recipe: any) => void;
    onPressRecipe: (recipeId: string) => void;
    activeThemeColor: string;
    bgTheme: { text: string; subText: string; id: string };
    fontSizeScale: number;
}

export function RecommendedCarousel({
    recipes,
    favorites,
    toggleFavorite,
    onPressRecipe,
    activeThemeColor,
    bgTheme,
    fontSizeScale
}: RecommendedCarouselProps) {
    const flatListRef = useRef<FlatList>(null);
    const currentIndex = useRef(0);
    const [isInteracting, setIsInteracting] = useState(false);
    const lastInteractionTimeRef = useRef(Date.now());

    const handleArrowPress = (direction: 'left' | 'right') => {
        if (!flatListRef.current) return;
        setIsInteracting(true);
        lastInteractionTimeRef.current = Date.now();

        let newIndex = currentIndex.current;
        if (direction === 'left') {
            newIndex = Math.max(0, currentIndex.current - 1);
        } else {
            newIndex = Math.min(recipes.length - 1, currentIndex.current + 1);
        }

        flatListRef.current.scrollToOffset({
            offset: newIndex * SNAP_INTERVAL,
            animated: true,
        });

        currentIndex.current = newIndex;

        setTimeout(() => {
            setIsInteracting(false);
            lastInteractionTimeRef.current = Date.now();
        }, 1000);
    };

    if (recipes.length === 0) {
        return (
            <View style={styles.emptyState}>
                <Text style={styles.emptyText}>😅 おすすめが見つかりません</Text>
            </View>
        );
    }

    return (
        <View style={styles.carouselWrapper}>
            <View style={styles.carouselContainer}>
                <FlatList
                    ref={flatListRef}
                    data={recipes}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    snapToInterval={SNAP_INTERVAL}
                    snapToAlignment="center"
                    decelerationRate="fast"
                    keyExtractor={(item) => `rec-${item.id}`}
                    onScrollBeginDrag={() => {
                        setIsInteracting(true);
                        lastInteractionTimeRef.current = Date.now();
                    }}
                    onScrollEndDrag={() => {
                        setIsInteracting(false);
                        lastInteractionTimeRef.current = Date.now();
                    }}
                    onMomentumScrollEnd={(ev) => {
                        const index = Math.round(ev.nativeEvent.contentOffset.x / SNAP_INTERVAL);
                        currentIndex.current = index;
                        lastInteractionTimeRef.current = Date.now();
                    }}
                    renderItem={({ item }) => (
                        <View style={{ width: SCREEN_WIDTH, alignItems: 'center' }}>
                            <View style={{ width: CARD_WIDTH }}>
                                <RecipeCard
                                    variant="horizontal"
                                    title={item.title}
                                    time={item.time}
                                    imageUrl={item.imageUrl}
                                    difficultyLevel={item.difficultyLevel}
                                    isFavorited={favorites.some(f => f.id === item.id)}
                                    onFavoriteToggle={() => toggleFavorite(item)}
                                    categories={item.categories}
                                    calories={calculateNutrition(item.ingredients, item.baseServings || 2).calories}
                                    onPress={() => onPressRecipe(item.id)}
                                />
                            </View>
                        </View>
                    )}
                    contentContainerStyle={{ paddingHorizontal: 0 }}
                />
            </View>

            {/* オーバーレイ矢印ボタン */}
            <TouchableOpacity
                onPress={() => handleArrowPress('left')}
                style={[styles.arrowOverlayBtn, { left: 8 }]}
                activeOpacity={0.7}
            >
                <Ionicons name="chevron-back" size={24} color={activeThemeColor} />
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => handleArrowPress('right')}
                style={[styles.arrowOverlayBtn, { right: 8 }]}
                activeOpacity={0.7}
            >
                <Ionicons name="chevron-forward" size={24} color={activeThemeColor} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    carouselWrapper: {
        position: 'relative',
        marginLeft: -16, // コンテナのpaddingを打ち消して画面端まで広げる
        marginRight: -16,
    },
    carouselContainer: {
        width: '100%', // 画面幅いっぱいに
    },
    arrowOverlayBtn: {
        position: 'absolute',
        top: '50%',
        marginTop: -28, // 高さ56の半分
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    emptyState: {
        padding: 24,
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        fontWeight: 'bold',
    },
});
