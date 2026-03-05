import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, NativeSyntheticEvent, NativeScrollEvent, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { RecipeCard } from '../components/RecipeCard';
import { AdBannerCard } from '../components/AdBannerCard';
import { AdBannerHorizontal } from '../components/AdBannerHorizontal';
import { useTheme } from '../context/ThemeContext';
import { useRecipes } from '../hooks/useRecipes';
import { calculateNutrition } from '../utils/nutritionUtils';
import { MasterRecipe } from '../utils/storage';
import { useLayout } from '../context/LayoutContext';
import { useUIConfig } from '../context/UIConfigContext';
import BackgroundPattern from '../components/BackgroundPattern';
import { SearchHeaderControls } from '../components/SearchHeaderControls';
import { RECIPE_CATEGORIES } from '../data/RecipeCategories';

// --- 検索揺れ吸収用の同義語辞書 ---
const SYNONYM_DICTIONARY = [
    ['豚', 'ぶた', 'ブタ', 'ポーク'],
    ['鶏', 'とり', 'トリ', 'チキン'],
    ['牛', 'うし', 'ウシ', 'ビーフ', 'ぎゅう', 'ギュウ'],
    ['卵', '玉子', 'たまご', 'タマゴ', 'エッグ'],
    ['玉ねぎ', 'たまねぎ', 'タマネギ', '玉葱'],
    ['大根', 'だいこん', 'ダイコン'],
    ['人参', 'にんじん', 'ニンジン', 'キャロット'],
    ['長ネギ', '長ねぎ', 'ねぎ', 'ネギ', '白髪ねぎ'],
    ['ご飯', 'ごはん', 'ゴハン', '御飯', 'ライス', '米'],
    ['塩', 'しお', 'ソルト'],
    ['醤油', 'しょうゆ', 'ショウユ'],
];

// --- ジャンル検索用：キーワード → category ID のマッピング ---
const CATEGORY_SEARCH_MAP: { keywords: string[]; categoryId: string }[] = [
    { keywords: ['和食', '日本食', 'わしょく', 'わ食', 'にほんしょく', 'ジャパン', 'じゃぱん', 'japanese', 'japan'], categoryId: 'japanese' },
    { keywords: ['洋食', '西洋', 'ようしょく', 'せいよう', 'パスタ', 'ぱすた', 'ピザ', 'ぴざ', 'グラタン', 'ぐらたん', 'western', 'europe'], categoryId: 'western' },
    { keywords: ['中華', '中国料理', 'ちゅうか', 'ちゅうごく', 'チュウカ', 'chinese', 'china'], categoryId: 'chinese' },
    { keywords: ['韓国料理', '韓食', 'かんこくりょうり', 'かんこく', 'カンコク', 'コリアン', 'こりあん', 'korean', 'korea'], categoryId: 'korean' },
    { keywords: ['時短', 'じかん', 'じたん', 'ジカン', 'クイック', 'くいっく', '簡単', 'かんたん', '早い', 'quick', 'fast', 'easy'], categoryId: 'quick' },
    { keywords: ['ヘルシー', 'ヘルシ', 'へるしー', 'へるしぃ', 'サラダ', 'さらだ', '健康', 'けんこう', 'healthy', 'health', 'salad'], categoryId: 'healthy' },
    { keywords: ['スイーツ', 'すいーつ', 'デザート', 'でざーと', 'ケーキ', 'けーき', 'お菓子', 'おかし', '洋菓子', 'sweets', 'dessert', 'cake'], categoryId: 'sweets' },
    // サブジャンル
    { keywords: ['主菜', 'しゅさい', 'メイン', 'めいん', 'メインディッシュ', 'main'], categoryId: 'main_dish' },
    { keywords: ['副菜', 'ふくさい', 'おかず', 'サイドディッシュ', 'side'], categoryId: 'side_dish' },
    { keywords: ['丼', 'どんぶり', 'ドンブリ', '丼もの', '丼物', 'どん', 'rice bowl'], categoryId: 'rice_bowl' },
    { keywords: ['麺', 'めん', 'メン', '麺類', 'ラーメン', 'うどん', 'そば', 'パスタ', 'noodle'], categoryId: 'noodles' },
    { keywords: ['スープ', 'すーぷ', '汁物', 'しるもの', '味噌汁', 'みそしる', 'soup'], categoryId: 'soup' },
    { keywords: ['肉', 'にく', 'ニク', '肉料理', 'meat'], categoryId: 'meat' },
    { keywords: ['魚', 'さかな', 'サカナ', '魚料理', '海鮮', 'かいせん', 'fish', 'seafood'], categoryId: 'fish' },
];

// 検索クエリがジャンルキーワードに該当する場合にそのカテゴリ ID を「すべて」配列で返す関数
const getCategoryIdsFromQuery = (query: string): string[] => {
    const q = normalizeText(query);
    const results: string[] = [];
    for (const entry of CATEGORY_SEARCH_MAP) {
        if (entry.keywords.some(kw => normalizeText(kw).includes(q) || q.includes(normalizeText(kw)))) {
            results.push(entry.categoryId);
        }
    }
    return results;
};

// --- 部分一致の誤検知を防ぐためのマスキングルール ---
const EXCLUSION_RULES = [
    {
        // 検索クエリが「玉」などを意図していない場合
        notIncludes: ['玉', 'たま', 'タマ', 'onion'],
        // 「ねぎ」で検索した際に「玉ねぎ」がヒットするのを防ぐ
        targets: ['玉ねぎ', 'たまねぎ', 'タマネギ', '玉葱'],
        mask: '🧅'
    },
    {
        // 検索クエリが「油」などを意図していない場合
        notIncludes: ['油', 'あぶら', 'アブラ', 'oil'],
        // 「ごま」で検索した際に「ごま油」がヒットするのを防ぐ
        targets: ['ごま油', 'ゴマ油', '胡麻油', 'サラダ油', 'オリーブ油'],
        mask: '🛢️'
    },
    {
        // 検索クエリが「粉」や「フライ」を意図していない場合
        notIncludes: ['粉', 'こ', 'フライ', 'ケーキ'],
        // 「パン」で検索した際に「パン粉」や「フライパン」がヒットするのを防ぐ
        targets: ['パン粉', 'フライパン', 'パンケーキ'],
        mask: '🍞'
    },
    {
        // 検索クエリが「ポン」などを意図していない場合
        notIncludes: ['ポン', 'ぽん'],
        // 「酢」で検索した際に「ポン酢」がヒットするのを防ぐ
        targets: ['ポン酢', 'ぽんず'],
        mask: '🍶'
    }
];




// --- ひらがな/カタカナの相互変換 ---
const hiraganaToKatakana = (str: string): string =>
    str.replace(/[\u3041-\u3096]/g, ch => String.fromCharCode(ch.charCodeAt(0) + 0x60));

const katakanaToHiragana = (str: string): string =>
    str.replace(/[\u30A1-\u30F6]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60));

// 検索比較用に文字列を正規化（小文字化 + ヒラガナ統一）
const normalizeText = (str: string): string =>
    katakanaToHiragana(str.toLowerCase()).normalize('NFKC');

// テキストが検索クエリにマッチするか（表記揺れを考慮）
const isMatch = (text: string, query: string): boolean => {
    if (!text || !query) return false;
    let t = normalizeText(text);
    const q = normalizeText(query);

    // 誤検知を防ぐためのマスキング処理
    for (const rule of EXCLUSION_RULES) {
        const normNotIncludes = rule.notIncludes.map(normalizeText);
        if (normNotIncludes.every(word => !q.includes(word))) {
            for (const target of rule.targets) {
                const normTarget = normalizeText(target);
                t = t.replace(new RegExp(normTarget, 'g'), rule.mask);
            }
        }
    }

    if (t.includes(q)) return true;

    // 同義語・表記揺れグループを走査
    for (const group of SYNONYM_DICTIONARY) {
        const normGroup = group.map(normalizeText);
        if (normGroup.some(synonym => q.includes(synonym) || synonym.includes(q))) {
            if (normGroup.some(synonym => t.includes(synonym))) {
                return true;
            }
        }
    }
    return false;
};

// --- レーベンシュタイン距離（編集距離）の計算 ---
const getLevenshteinDistance = (a: string, b: string): number => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
};

// 「もしかして」のサジェストを取得（またはレシピリストを引数に取る）
const getDidYouMean = (query: string, recipes: MasterRecipe[]): string | null => {
    if (!query || query.length < 2) return null;
    const q = normalizeText(query);

    // ----- 候補語リストの構造 -----
    // 1) 同義語辞書から全単語を展開
    const candidates: string[] = [];
    for (const group of SYNONYM_DICTIONARY) {
        candidates.push(...group);
    }
    // 2) レシピタイトルを追加
    for (const r of recipes) {
        candidates.push(r.title);
        // タイトルの単語分割（スペース・「。」・「！」等の区切り文字で分割）
        const words = r.title.split(/[\s。！？・「」『』【】・、]/g).filter(Boolean);
        candidates.push(...words);
    }
    // 3) レシピの材料名を追加
    for (const r of recipes) {
        for (const ing of (r.ingredients || [])) {
            candidates.push(ing.name);
        }
    }

    // ----- 候補語の重複除去と正規化 -----
    const uniqueCandidates = [...new Set(candidates)].filter(c => c.length >= 2);

    // ----- クエリが既に候補語のいずれかに完全一致する場合はサジェスト不要 -----
    if (uniqueCandidates.some(c => normalizeText(c) === q)) return null;

    // ----- クエリが候補語に完全包含される場合もスキップ -----
    if (uniqueCandidates.some(c => normalizeText(c).includes(q))) return null;

    let bestMatch: string | null = null;
    let minDistance = 999;

    for (const candidate of uniqueCandidates) {
        const nc = normalizeText(candidate);
        // 候補語がクエリを完全に含む場合はタイポではないのでスキップ
        if (nc.includes(q)) continue;

        const distance = getLevenshteinDistance(q, nc);
        // 文字数に応じた許容範囲：短い単語は厳しめ、長い単語は少し慚め
        const threshold = nc.length <= 4 ? 1 : nc.length <= 7 ? 2 : 3;

        if (distance <= threshold && distance < minDistance) {
            minDistance = distance;
            bestMatch = candidate;
        }
    }
    return bestMatch;
};

export default function SearchScreen({ route, navigation }: any) {
    const { recipes, favorites, loading, toggleFavorite, refreshData } = useRecipes();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const { activeTheme, bgTheme } = useTheme();
    const { layoutType, setLayoutType, numColumns } = useLayout();
    const { fontSizeScale } = useUIConfig(); // Added
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
    const flatListRef = React.useRef<FlatList>(null);

    // 外部からの初期検索クエリを受け取ってセットする
    useEffect(() => {
        if (route.params?.initialQuery) {
            setSearchQuery(route.params.initialQuery);
            // 処理後にパラメータをクリア（次回タブ切り替え時の誤爆防止）
            navigation.setParams({ initialQuery: undefined });
        }
    }, [route.params?.initialQuery]);

    // リストのスクロール位置をリセットするためだけのフォーカスエフェクト
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
        });
        return unsubscribe;
    }, [navigation]);

    const filteredResults = recipes.filter(r => {
        const matchesSelectedCategory = !selectedCategory || (r.categories ?? []).includes(selectedCategory);
        if (!searchQuery) return matchesSelectedCategory;

        const matchesTitle = isMatch(r.title, searchQuery);
        const matchesIngredients = r.ingredients && r.ingredients.some(ing => isMatch(ing.name, searchQuery));
        const matchedGenreCategoryIds = getCategoryIdsFromQuery(searchQuery);
        const matchesGenre = matchedGenreCategoryIds.length > 0 &&
            matchedGenreCategoryIds.some(catId => (r.categories ?? []).includes(catId));

        return (matchesTitle || matchesIngredients || matchesGenre) && matchesSelectedCategory;
    });

    const handleScroll = (event: any) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
        const isNearTop = contentOffset.y < 100;

        if (isAtBottom) {
            setShowScrollTop(true);
        } else if (isNearTop || !isAtBottom) {
            setShowScrollTop(false);
        }
    };

    const toggleHeader = () => {
        if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
            UIManager.setLayoutAnimationEnabledExperimental(true);
        }
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsHeaderCollapsed(!isHeaderCollapsed);
    };

    if (loading && recipes.length === 0) {
        return (
            <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: bgTheme.bg, justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={activeTheme.color} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: bgTheme.bg }]}>
            <BackgroundPattern />
            <View style={styles.container}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#999" />
                    <TextInput
                        style={[styles.searchInput, { color: bgTheme.text, fontSize: 16 * fontSizeScale }]}
                        placeholder="料理名やレシピを検索..."
                        placeholderTextColor="#999"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        clearButtonMode="while-editing"
                        selectionColor={activeTheme.color}
                    />
                </View>

                {/* もしかしてサジェスト */}
                {searchQuery.length > 0 && getDidYouMean(searchQuery, recipes) && (
                    <TouchableOpacity
                        style={styles.didYouMeanContainer}
                        onPress={() => setSearchQuery(getDidYouMean(searchQuery, recipes)!)}
                    >
                        <Text style={[styles.didYouMeanText, { color: activeTheme.color, fontSize: 15 * fontSizeScale }]}>
                            もしかして：<Text style={{ fontWeight: 'bold', textDecorationLine: 'underline' }}>{getDidYouMean(searchQuery, recipes)}</Text>
                        </Text>
                    </TouchableOpacity>
                )}

                <SearchHeaderControls
                    isHeaderCollapsed={isHeaderCollapsed}
                    toggleHeader={toggleHeader}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                    setSearchQuery={setSearchQuery}
                    layoutType={layoutType as 'list' | 'grid2' | 'grid3' | 'compact'}
                    setLayoutType={setLayoutType}
                    activeThemeColor={activeTheme.color}
                    bgTheme={bgTheme}
                    fontSizeScale={fontSizeScale}
                />

                <View style={[styles.resultHeader, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: isHeaderCollapsed ? 8 : 16 }]}>
                    <Text
                        style={[
                            styles.resultText,
                            {
                                color: bgTheme.subText,
                                marginBottom: 0,
                                marginTop: 0,
                                fontSize: 20 * fontSizeScale,
                                textShadowColor: bgTheme.id === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.15)',
                                textShadowOffset: { width: 0, height: 1.5 },
                                textShadowRadius: 3
                            }
                        ]}
                    >
                        {searchQuery ? `「${searchQuery}」の検索結果` : selectedCategory ? `${RECIPE_CATEGORIES.find(c => c.id === selectedCategory)?.label} のレシピ` : 'すべてのレシピ'}
                    </Text>
                </View>

                <FlatList
                    ref={flatListRef}
                    key={layoutType} // レイアウト変更時に FlatList を再描画させる
                    numColumns={numColumns}
                    onScroll={(e) => {
                        const isNearTop = e.nativeEvent.contentOffset.y < 100;
                        setShowScrollTop(!isNearTop);
                    }}
                    columnWrapperStyle={numColumns > 1 ? {
                        justifyContent: 'flex-start',
                        gap: 8 // ホーム画面の gap: 8 と統一
                    } : undefined}
                    data={(() => {
                        const resultsWithAds: any[] = [];
                        filteredResults.forEach((item, index) => {
                            // グリッド表示ではない場合のみ広告を挿入
                            if (numColumns === 1 && index > 0) {
                                if (index % 6 === 0) {
                                    resultsWithAds.push({ id: `ad-h-${index}`, isAdHorizontal: true });
                                } else if (index % 3 === 0) {
                                    resultsWithAds.push({ id: `ad-v-${index}`, isAd: true });
                                }
                            }
                            resultsWithAds.push(item);
                        });
                        return resultsWithAds;
                    })()}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item, index }) => {
                        if (item.isAd) {
                            return (
                                <AdBannerCard
                                    sponsorName="キッチン・ウェア・ストア"
                                    title="理想のキッチンツールが見つかる"
                                    description="最新の調理器具で毎日の料理をもっと効率的に。プロが選ぶ逸品を多数取り揃え。"
                                />
                            );
                        }
                        if (item.isAdHorizontal) {
                            return (
                                <AdBannerHorizontal
                                    sponsorName="フレッシュ・デリ"
                                    title="採れたて野菜の定期便"
                                    imageUrl="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=150&q=80"
                                />
                            );
                        }
                        return (
                            <RecipeCard
                                variant={layoutType}
                                title={item.title}
                                time={item.time}
                                imageUrl={item.imageUrl}
                                difficultyLevel={item.difficultyLevel}
                                isFavorited={favorites.some(f => f.id === item.id)}
                                onFavoriteToggle={() => toggleFavorite(item)}
                                categories={item.categories}
                                calories={calculateNutrition(item.ingredients, item.baseServings || 2).calories}
                                onPress={() => navigation.navigate('RecipeDetail', { recipeId: item.id })}
                                style={{ flex: 1, marginBottom: layoutType === 'list' ? 12 : 0 }}
                            />
                        );
                    }}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 40 }}>
                            <Text style={{ color: bgTheme.subText, fontSize: 16 * fontSizeScale }}>レシピが見つかりませんでした</Text>
                        </View>
                    }
                />

                {/* トップに戻るボタン (最下部付近でのみ表示) */}
                {showScrollTop && (
                    <TouchableOpacity
                        style={[styles.scrollTopBtn, { backgroundColor: activeTheme.color + 'E6' }]}
                        onPress={() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true })}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="arrow-up" size={24} color="#fff" />
                        <Text style={[styles.scrollTopText, { fontSize: 14 * fontSizeScale }]}>トップへ</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF', // 検索窓は透かさない
        borderRadius: 24,
        paddingHorizontal: 16,
        marginBottom: 16,
        height: 48,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 0,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
        color: '#333',
    },
    didYouMeanContainer: {
        marginBottom: 16,
        paddingHorizontal: 8,
    },
    didYouMeanText: {
        fontSize: 15,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
        textShadowColor: 'rgba(255, 255, 255, 0.9)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 6,
    },
    // カテゴリチップ（横スクロール・コンパクト形式）
    categoryRow: {
        marginBottom: 12,
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryChip: {
        width: '22%',
        flexGrow: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.85)', // 15% 透明度を適用
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)', // 極薄の境界線
    },
    categoryChipEmoji: {
        fontSize: 14,
        marginRight: 4,
    },
    categoryChipText: {
        fontSize: 13,
        fontWeight: '600',
    },
    resultText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 16,
        marginTop: 8,
    },
    listContainer: {
        paddingBottom: 160,
    },
    resultHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        marginTop: 8,
    },
    layoutSwitcher: {
        flexDirection: 'row',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 2,
        gap: 2,
    },
    layoutBtn: {
        padding: 8,
        borderRadius: 8,
        minWidth: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
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
    collapseBtn: {
        padding: 8,
    },
    headerControls: {
        marginBottom: 4,
    },
    settingsUnit: {
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
        position: 'relative',
    },
    handleBtn: {
        position: 'absolute',
        bottom: -14,
        alignSelf: 'center',
        left: '50%',
        marginLeft: -20,
        width: 40,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
    },
    collapsedBar: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginBottom: 8,
    },
    expandBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 24,
        borderWidth: 1.5,
        // 背景との境界を自然にするため、elevationを廃止し繊細な影へ
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    expandBtnText: {
        fontWeight: 'bold',
    },
});
