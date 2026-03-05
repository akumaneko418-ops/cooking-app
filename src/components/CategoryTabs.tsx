import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { RECIPE_CATEGORIES } from '../data/RecipeCategories';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface CategoryTabsProps {
    selectedCategory: string;
    onSelect: (categoryId: string) => void;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({ selectedCategory, onSelect }) => {
    const { activeTheme, bgTheme } = useTheme();
    const [showRightGradient, setShowRightGradient] = useState(true);
    const [showLeftGradient, setShowLeftGradient] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);
    const scrollXRef = useRef(0);
    const scrollInterval = useRef<NodeJS.Timeout | null>(null);

    // コンポーネントのアンマウント時にインターバルをクリア
    useEffect(() => {
        return () => stopScrolling();
    }, []);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        scrollXRef.current = contentOffset.x;

        setShowLeftGradient(contentOffset.x > 5);
        const isEnd = contentOffset.x + layoutMeasurement.width >= contentSize.width - 5;
        setShowRightGradient(!isEnd);

        // 右端に到達したら自動スクロールを止める
        if (isEnd) {
            stopScrolling();
        }
    };

    const startScrolling = () => {
        if (scrollInterval.current) return;
        // 約60fpsで15pxずつ右へスクロール
        scrollInterval.current = setInterval(() => {
            if (scrollViewRef.current) {
                scrollViewRef.current.scrollTo({
                    x: scrollXRef.current + 15,
                    animated: false,
                });
            }
        }, 16);
    };

    const stopScrolling = () => {
        if (scrollInterval.current) {
            clearInterval(scrollInterval.current);
            scrollInterval.current = null;
        }
    };

    return (
        <View style={styles.wrapper}>
            <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.container}
                onScroll={handleScroll}
                scrollEventThrottle={16}
            >
                {RECIPE_CATEGORIES.map((cat, index) => {
                    const isSelected = selectedCategory === cat.id;
                    const isLast = index === RECIPE_CATEGORIES.length - 1;
                    return (
                        <TouchableOpacity
                            key={cat.id}
                            style={[
                                styles.tab,
                                {
                                    backgroundColor: isSelected ? activeTheme.color + 'E6' : 'rgba(255, 255, 255, 0.9)',
                                },
                                isLast && { marginRight: 24 }
                            ]}
                            onPress={() => onSelect(cat.id)}
                        >
                            <Text style={styles.tabEmoji}>{cat.emoji}</Text>
                            <Text style={[
                                styles.tabLabel,
                                isSelected && styles.tabLabelActive,
                                {
                                    color: isSelected ? '#fff' : bgTheme.subText,
                                    ...(isSelected ? {
                                        textShadowColor: 'rgba(0,0,0,0.1)',
                                        textShadowOffset: { width: 0, height: 1 },
                                        textShadowRadius: 2
                                    } : {})
                                }
                            ]}>
                                {cat.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* 左側のグラデーション (スクロール時表示) */}
            {
                showLeftGradient && (
                    <View style={[styles.gradientLeftContainer, { pointerEvents: 'none' }]}>
                        <LinearGradient
                            colors={[bgTheme.bg, bgTheme.bg + '00']}
                            start={{ x: 0, y: 0.5 }}
                            end={{ x: 1, y: 0.5 }}
                            style={styles.gradientLeft}
                        />
                    </View>
                )
            }

            {/* 右側のグラデーションと自動スクロールボタン */}
            {
                showRightGradient && (
                    <View style={styles.gradientRightContainer}>
                        <View style={[styles.gradientRightWrapper, { pointerEvents: 'none' }]}>
                            <LinearGradient
                                colors={[bgTheme.bg + '00', bgTheme.bg, bgTheme.bg]} // 少し濃いめにフェード
                                start={{ x: 0, y: 0.5 }}
                                end={{ x: 0.8, y: 0.5 }}
                                style={styles.gradientRight}
                            />
                        </View>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPressIn={startScrolling}
                            onPressOut={stopScrolling}
                            style={[styles.chevronIcon, { backgroundColor: activeTheme.color + '33' }]}
                        >
                            <Ionicons name="chevron-forward" size={16} color={activeTheme.color} />
                        </TouchableOpacity>
                    </View>
                )
            }
        </View >
    );
};

const styles = StyleSheet.create({
    wrapper: {
        position: 'relative',
        width: '100%',
    },
    container: {
        paddingVertical: 8,
        paddingHorizontal: 8,
        gap: 8,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)', // デフォルト
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        // 自然な浮き上がりを演出するエフェクト
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    tabEmoji: {
        fontSize: 15,
    },
    tabLabel: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    tabLabelActive: {
        fontWeight: 'bold',
    },
    gradientLeftContainer: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 32,
        zIndex: 10,
    },
    gradientLeft: {
        ...StyleSheet.absoluteFillObject,
    },
    gradientRightContainer: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 48, // グラデ幅広め
        zIndex: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    gradientRightWrapper: {
        ...StyleSheet.absoluteFillObject,
    },
    gradientRight: {
        ...StyleSheet.absoluteFillObject,
    },
    chevronIcon: {
        marginRight: 4,
        borderRadius: 10,
        padding: 2,
    }
});
