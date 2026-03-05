import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, UIManager, LayoutAnimation } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { RECIPE_CATEGORIES } from '../data/RecipeCategories';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface SearchHeaderControlsProps {
    isHeaderCollapsed: boolean;
    toggleHeader: () => void;
    selectedCategory: string | null;
    setSelectedCategory: (catId: string | null) => void;
    setSearchQuery: (query: string) => void;
    layoutType: 'list' | 'grid2' | 'grid3' | 'compact';
    setLayoutType: (type: 'list' | 'grid2' | 'grid3' | 'compact') => void;
    activeThemeColor: string;
    bgTheme: { text: string; subText: string; id: string; surface: string; bg: string };
    fontSizeScale: number;
}

export function SearchHeaderControls({
    isHeaderCollapsed,
    toggleHeader,
    selectedCategory,
    setSelectedCategory,
    setSearchQuery,
    layoutType,
    setLayoutType,
    activeThemeColor,
    bgTheme,
    fontSizeScale
}: SearchHeaderControlsProps) {
    return (
        <View style={styles.headerControls}>
            {!isHeaderCollapsed ? (
                <View style={[styles.settingsUnit, { backgroundColor: bgTheme.surface + 'B3', borderColor: 'rgba(0,0,0,0.08)' }]}>
                    {/* カテゴリチップ - wrap グリッド、スクロール不要 */}
                    <View style={styles.categoryRow}>
                        <View style={styles.categoryGrid}>
                            {RECIPE_CATEGORIES.filter(c => c.id !== 'all').map((cat) => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[
                                        styles.categoryChip,
                                        {
                                            paddingVertical: 12 * fontSizeScale,
                                            backgroundColor: selectedCategory === cat.id ? activeThemeColor : 'rgba(255, 255, 255, 0.9)',
                                            // アクティブ時の強調シャドウ
                                            ...(selectedCategory === cat.id ? {
                                                shadowColor: '#000',
                                                shadowOffset: { width: 0, height: 4 },
                                                shadowOpacity: 0.2,
                                                shadowRadius: 6,
                                                elevation: 6,
                                            } : {})
                                        }
                                    ]}
                                    onPress={() => {
                                        setSelectedCategory(selectedCategory === cat.id ? null : cat.id);
                                        setSearchQuery('');
                                    }}
                                >
                                    <Text style={[styles.categoryChipEmoji, { fontSize: 14 * fontSizeScale, color: selectedCategory === cat.id ? '#fff' : bgTheme.subText }]}>{cat.emoji}</Text>
                                    <Text style={[
                                        styles.categoryChipText,
                                        { fontSize: 13 * fontSizeScale, color: selectedCategory === cat.id ? '#fff' : bgTheme.subText }
                                    ]}>{cat.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={[styles.layoutSwitcher, { backgroundColor: 'rgba(0,0,0,0.03)', width: '100%', marginBottom: 0 }]}>
                        <TouchableOpacity
                            onPress={() => setLayoutType('list')}
                            style={[styles.layoutBtn, { flex: 1 }, layoutType === 'list' && { backgroundColor: activeThemeColor + 'E6' }]}
                        >
                            <MaterialIcons name="call-to-action" size={24 * fontSizeScale} color={layoutType === 'list' ? '#fff' : bgTheme.subText} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setLayoutType('grid2')}
                            style={[styles.layoutBtn, { flex: 1 }, layoutType === 'grid2' && { backgroundColor: activeThemeColor + 'E6' }]}
                        >
                            <Ionicons name="grid-outline" size={24 * fontSizeScale} color={layoutType === 'grid2' ? '#fff' : bgTheme.subText} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setLayoutType('grid3')}
                            style={[styles.layoutBtn, { flex: 1 }, layoutType === 'grid3' && { backgroundColor: activeThemeColor + 'E6' }]}
                        >
                            <Ionicons name="apps-outline" size={24 * fontSizeScale} color={layoutType === 'grid3' ? '#fff' : bgTheme.subText} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setLayoutType('compact')}
                            style={[styles.layoutBtn, { flex: 1 }, layoutType === 'compact' && { backgroundColor: activeThemeColor + 'E6' }]}
                        >
                            <Ionicons name="reorder-four-outline" size={24 * fontSizeScale} color={layoutType === 'compact' ? '#fff' : bgTheme.subText} />
                        </TouchableOpacity>
                    </View>

                    {/* 折りたたみボタン（ハンドル風） */}
                    <TouchableOpacity onPress={toggleHeader} style={[styles.handleBtn, { backgroundColor: activeThemeColor }]}>
                        <Ionicons name="chevron-up" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.collapsedBar}>
                    <TouchableOpacity
                        onPress={toggleHeader}
                        style={[
                            styles.expandBtn,
                            {
                                backgroundColor: bgTheme.surface === '#fff' ? 'rgba(255,255,255,0.95)' : bgTheme.surface,
                                borderColor: bgTheme.id === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'
                            }
                        ]}
                    >
                        <Ionicons name="options-outline" size={18} color={activeThemeColor} />
                        <Text style={[styles.expandBtnText, { color: bgTheme.text, fontSize: 13 * fontSizeScale }]}>フィルタ・表示設定</Text>
                        <Ionicons name="chevron-down" size={16} color={bgTheme.subText} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    headerControls: {
        marginBottom: 8,
    },
    settingsUnit: {
        borderRadius: 20,
        padding: 16,
        paddingBottom: 24, // ハンドルボタン用の余白
        borderWidth: 1,
        // ガラスエフェクト風のシャドウ（オプション）
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
        position: 'relative', // ハンドルボタンの絶対配置のため
    },
    categoryRow: {
        marginBottom: 20,
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'flex-start',
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        minWidth: '30%', // 約3列を基本にする
        flexGrow: 1,     // 余ったスペースを埋める
        justifyContent: 'center', // 中央寄せ
    },
    categoryChipEmoji: {
        marginRight: 6,
    },
    categoryChipText: {
        fontWeight: 'bold',
    },
    layoutSwitcher: {
        flexDirection: 'row',
        borderRadius: 16, // より丸く
        padding: 4,
        gap: 4,
    },
    layoutBtn: {
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
    },
    handleBtn: {
        position: 'absolute',
        bottom: -12, // コンテナの下にはみ出させる
        alignSelf: 'center',
        width: 48,
        height: 24,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 2,
        // シャドウ
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 4,
    },
    collapsedBar: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 8,
    },
    expandBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        // シャドウ
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    expandBtnText: {
        fontWeight: 'bold',
        marginLeft: 6,
    },
});
