import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DifficultyBadge } from './DifficultyBadge';
import { RECIPE_CATEGORIES } from '../data/RecipeCategories';
import { useTheme } from '../context/ThemeContext';
import { useUIConfig } from '../context/UIConfigContext';

interface RecipeCardProps {
    title: string;
    time: string;
    imageUrl: string;
    onPress: () => void;
    isSponsored?: boolean;
    difficultyLevel?: number; // 1〜3の難易度（省略時は非表示）
    isFavorited?: boolean; // お気に入り登録済みフラグ
    onFavoriteToggle?: () => void; // お気に入りトグル時のコールバック
    categories?: string[]; // 【追加】カテゴリ（ジャンル）情報の配列
    calories?: number; // 【追加】カロリー（kcal）
    variant?: 'list' | 'grid2' | 'grid3' | 'horizontal' | 'compact';
    style?: any;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
    title, time, imageUrl, onPress, isSponsored, difficultyLevel, isFavorited, onFavoriteToggle,
    categories = [],
    calories,
    variant = 'list',
    style
}) => {
    const { activeTheme, bgTheme } = useTheme();
    const { fontSizeScale } = useUIConfig();
    const isGrid = variant === 'grid2' || variant === 'grid3';
    const isSmallGrid = variant === 'grid3';
    const isMediumGrid = variant === 'grid2';
    const isHorizontal = variant === 'horizontal';
    const isCompact = variant === 'compact';

    const cardStyle = [
        styles.card,
        variant === 'grid2' && styles.grid2Card,
        variant === 'grid3' && styles.grid3Card,
        variant === 'horizontal' && styles.horizontalCard,
        isCompact && styles.compactCard,
        style,
    ];

    const imageStyle = [
        styles.image,
        variant === 'grid2' && styles.grid2Image,
        variant === 'grid3' && styles.grid3Image,
        variant === 'horizontal' && styles.horizontalImage,
        isCompact && styles.compactImage,
    ];

    if (isCompact) {
        return (
            <TouchableOpacity style={cardStyle} onPress={onPress}>
                {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={imageStyle} />
                ) : (
                    <View style={[imageStyle, styles.placeholderContainer, { backgroundColor: (bgTheme.surface || '#f5f5f5') + '99' }]}>
                        <Ionicons name="restaurant-outline" size={24} color={(bgTheme.subText || '#666') + '66'} />
                    </View>
                )}
                <View style={styles.compactContent}>
                    <View style={styles.compactInfo}>
                        <Text style={[styles.compactTitle, { fontSize: 14 * fontSizeScale }]} numberOfLines={1}>{title}</Text>
                        <View style={styles.compactTimeBox}>
                            <Ionicons
                                name={time?.includes('オリジナル') ? "diamond-outline" : (time?.includes('アレンジ') ? "sparkles-outline" : "time-outline")}
                                size={13}
                                color={(time?.includes('アレンジ') || time?.includes('オリジナル')) ? activeTheme.color : bgTheme.subText}
                            />
                            <Text style={[
                                styles.compactTimeText,
                                (time?.includes('アレンジ') || time?.includes('オリジナル')) && { color: activeTheme.color, fontWeight: 'bold' }
                            ]}>{time}</Text>
                            {calories !== undefined && calories > 0 && (
                                <Text style={[styles.compactTimeText, { marginLeft: 6, color: bgTheme.subText }]}>🔥 {Math.round(calories)} kcal</Text>
                            )}
                        </View>
                    </View>
                    <View style={styles.compactRightControls}>
                        {difficultyLevel !== undefined && (
                            <View style={styles.compactDifficultyWrapper}>
                                <DifficultyBadge level={difficultyLevel} labelOnly />
                            </View>
                        )}
                        {isFavorited !== undefined && (
                            <TouchableOpacity
                                onPress={() => onFavoriteToggle?.()}
                                activeOpacity={0.5}
                                style={styles.compactFavoriteBtn}
                            >
                                <Ionicons
                                    name={isFavorited ? "heart" : "heart-outline"}
                                    size={20}
                                    color={isFavorited ? "#FF3B30" : bgTheme.subText}
                                />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity style={cardStyle} onPress={onPress}>
            {/* 写真エリア（バッジを写真内の左下に配置するためラップ） */}
            <View style={{ position: 'relative' }}>
                {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={imageStyle} />
                ) : (
                    <View style={[imageStyle, styles.placeholderContainer, { backgroundColor: (bgTheme.surface || '#f5f5f5') + '99' }]}>
                        <Ionicons name="restaurant-outline" size={isSmallGrid ? 30 : 60} color={(bgTheme.subText || '#666') + '66'} />
                    </View>
                )}

                {/* グリッド表示時の難易度バッジ */}
                {difficultyLevel !== undefined && (variant === 'grid2' || variant === 'grid3') && (
                    <View style={[
                        styles.difficultyBadgeOverlay,
                        variant === 'grid2' && { width: 'auto', height: 'auto', borderRadius: 12 }
                    ]}>
                        <DifficultyBadge
                            level={difficultyLevel}
                            simple={variant === 'grid3'}
                            labelOnly={variant === 'grid2'}
                        />
                    </View>
                )}

                {/* 【追加】アレンジ/オリジナルレシピ時のバッジ（写真左下） */}
                {(time?.includes('アレンジ') || time?.includes('オリジナル')) && (variant === 'grid2' || variant === 'grid3') && (
                    <View style={[
                        styles.magicBadgeOverlay,
                        { backgroundColor: activeTheme.color },
                        isMediumGrid && { width: 30, height: 30, borderRadius: 15 }, // 2x2の場合は少し大きく
                        time?.includes('オリジナル') && {
                            borderColor: 'rgba(255,255,255,0.6)',
                            borderWidth: 1.5
                        },
                        difficultyLevel !== undefined && { left: variant === 'grid3' ? 32 : 62 } // バッジ拡大分右へ
                    ]}>
                        <Ionicons
                            name={time?.includes('オリジナル') ? "diamond" : "sparkles"}
                            size={variant === 'grid3' ? 12 : (isMediumGrid ? 18 : 14)}
                            color="#fff"
                        />
                    </View>
                )}
            </View>

            <View style={[styles.content, isSmallGrid && { padding: 8 }]}>
                {!!isSponsored && variant !== 'grid3' && (
                    <View style={styles.sponsorBadge}>
                        <Text style={styles.sponsorText}>SPONSORED</Text>
                    </View>
                )}
                <View style={[
                    isGrid && { minHeight: isSmallGrid ? 40 * fontSizeScale : 54 * fontSizeScale, justifyContent: 'center' },
                    !isGrid && { marginBottom: 4 }
                ]}>
                    <Text style={[
                        styles.title,
                        isSmallGrid && styles.smallTitle,
                        { fontSize: (isSmallGrid ? 12 : 16) * fontSizeScale, lineHeight: (isSmallGrid ? 16 : 22) * fontSizeScale },
                        isHorizontal && { fontSize: 18 * fontSizeScale, marginBottom: 8 * fontSizeScale }
                    ]} numberOfLines={2}>{title}</Text>
                </View>
                {!isSmallGrid && (
                    <View style={isGrid ? { minHeight: isMediumGrid ? 60 * fontSizeScale : 40 * fontSizeScale } : undefined}>
                        <View style={styles.metaRow}>
                            <View style={styles.timeBox}>
                                <Ionicons
                                    name={time?.includes('オリジナル') ? "diamond-outline" : (time?.includes('アレンジ') ? "sparkles-outline" : "time-outline")}
                                    size={isGrid ? 12 : 14}
                                    color={(time?.includes('アレンジ') || time?.includes('オリジナル')) ? activeTheme.color : bgTheme.subText}
                                />
                                <Text style={[
                                    styles.time,
                                    isGrid && { fontSize: 12 * fontSizeScale },
                                    (time?.includes('アレンジ') || time?.includes('オリジナル')) && { color: activeTheme.color, fontWeight: 'bold' }
                                ]}>{time}</Text>
                                {calories !== undefined && calories > 0 && (
                                    <Text style={[
                                        styles.time,
                                        isGrid && { fontSize: 11 * fontSizeScale },
                                        { marginLeft: 8, color: bgTheme.subText }
                                    ]}>🔥 {Math.round(calories)} kcal</Text>
                                )}
                            </View>
                        </View>
                        {/* 【追加】カテゴリバッジの表示 */}
                        {categories.length > 0 && (
                            <View style={[styles.categoryContainer, { marginTop: 6 * fontSizeScale }]}>
                                {categories.slice(0, 2).map(catId => {
                                    const catInfo = RECIPE_CATEGORIES.find(c => c.id === catId);
                                    if (!catInfo) return null;
                                    return (
                                        <View key={catId} style={[styles.categoryBadge, { backgroundColor: activeTheme.color + '15', paddingVertical: 2 * fontSizeScale }]}>
                                            <Text style={[styles.categoryEmoji, { fontSize: 9 * fontSizeScale }]}>{catInfo.emoji}</Text>
                                            <Text style={[styles.categoryLabel, { color: activeTheme.color, fontSize: 9 * fontSizeScale }]}>{catInfo.label}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </View>
                )}
                {/* 【移動】リスト表示等の場合は従来通り右下へ配置（グリッド以外） */}
                {
                    difficultyLevel !== undefined && !isGrid && !isHorizontal && !isCompact && (
                        <View style={styles.difficultyBadgeContainer}>
                            <DifficultyBadge level={difficultyLevel} />
                        </View>
                    )
                }
            </View >
            {isFavorited !== undefined && (
                <View style={[
                    styles.favoriteBadgeContainer,
                    isMediumGrid && styles.mediumFavoriteBadgeContainer,
                    isSmallGrid && styles.smallFavoriteBadgeContainer,
                    { transform: [{ scale: fontSizeScale }] }
                ]}>
                    <TouchableOpacity
                        style={isMediumGrid || isSmallGrid ? [styles.favoriteBadge, { borderRadius: isSmallGrid ? 16 : (isMediumGrid ? 19 : 22) }] : styles.favoriteBadge}
                        onPress={() => onFavoriteToggle?.()}
                        activeOpacity={0.5}
                    >
                        <Ionicons
                            name={isFavorited ? "heart" : "heart-outline"}
                            size={isSmallGrid ? 18 : (isMediumGrid ? 22 : 26)}
                            color={isFavorited ? "#FF3B30" : bgTheme.subText}
                        />
                    </TouchableOpacity>
                </View>
            )}
        </TouchableOpacity >
    );
};

const styles = StyleSheet.create({
    card: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: 160,
        backgroundColor: '#F0F0F0',
    },
    content: {
        padding: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
        lineHeight: 22,
    },
    time: {
        fontSize: 14,
        color: '#666',
        marginLeft: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 4,
        marginTop: 8,
    },
    timeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 4,
    },
    sponsorBadge: {
        backgroundColor: '#FFF1E6',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginBottom: 6,
    },
    sponsorText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#FF6F61',
    },
    favoriteBadgeContainer: {
        position: 'absolute',
        top: 14,
        right: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
    },
    favoriteBadge: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 22,
    },
    placeholderContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F0F0F0',
    },
    grid2Card: {
        flex: 1,
        marginBottom: 12,
    },
    grid3Card: {
        flex: 1,
        marginBottom: 10,
    },
    horizontalCard: {
        width: '100%',
        minHeight: 310, // 335からさらに縮小（固定から可変に変更）
        marginBottom: 8,
        backgroundColor: '#fff',
    },
    grid2Image: {
        height: 120,
    },
    grid3Image: {
        height: 80,
    },
    horizontalImage: {
        height: 200, // 205から微調整
    },
    smallTitle: {
        fontSize: 12,
        lineHeight: 16,
    },
    smallFavoriteBadgeContainer: {
        top: 8,
        right: 8,
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    mediumFavoriteBadgeContainer: {
        top: 6,
        right: 6,
        width: 38,
        height: 38,
        borderRadius: 19,
    },
    categoryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 8,
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        gap: 2,
    },
    categoryEmoji: {
        fontSize: 10,
    },
    categoryLabel: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    difficultyBadgeContainer: {
        position: 'absolute',
        right: 12,
        bottom: 12,
    },
    // コンパクト表示用スタイル
    compactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        marginBottom: 6,
        backgroundColor: '#fff',
        borderRadius: 12,
    },
    compactImage: {
        width: 54,
        height: 54,
        borderRadius: 8,
    },
    compactContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 12,
        minHeight: 54,
        paddingVertical: 4,
    },
    compactInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    compactTitle: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    compactRightControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    compactTimeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        marginTop: 2,
    },
    compactTimeText: {
        fontSize: 13,
        fontWeight: '600',
    },
    compactDifficultyWrapper: {
        paddingTop: 2, // 微調整
    },
    compactFavoriteBtn: {
        padding: 2,
    },
    difficultyBadgeOverlay: {
        position: 'absolute',
        bottom: 5,
        left: 5,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    magicBadgeOverlay: {
        position: 'absolute',
        bottom: 5,
        left: 5,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FF6F61', // 魔法っぽい暖色（または activeTheme.color）
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
        zIndex: 10,
    },
});
