import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, FlatList, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SearchBar } from '../components/SearchBar';
import { RecipeCard } from '../components/RecipeCard';
import { AdBannerCard } from '../components/AdBannerCard';
import { AdBannerHorizontal } from '../components/AdBannerHorizontal';
import BackgroundPattern from '../components/BackgroundPattern';
import { useUserLevel } from '../context/UserLevelContext';
import { CategoryTabs } from '../components/CategoryTabs';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useRecipes } from '../hooks/useRecipes';
import { GreetingHeader } from '../components/GreetingHeader';
import { calculateNutrition } from '../utils/nutritionUtils';
import { useFocusEffect, useScrollToTop } from '@react-navigation/native';
import { useLayout } from '../context/LayoutContext';
import { useUIConfig } from '../context/UIConfigContext';
import { RecommendedCarousel } from '../components/RecommendedCarousel';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
  const { recipes, favorites, loading, toggleFavorite } = useRecipes();
  const { user } = useAuth();
  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'ゲスト';
  const { layoutType, setLayoutType, numColumns } = useLayout();
  const { fontSizeScale } = useUIConfig();
  const { activeTheme, bgTheme } = useTheme();
  const { userLevel } = useUserLevel();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterEnabled, setFilterEnabled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useScrollToTop(scrollRef);

  useFocusEffect(
    React.useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      return () => {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      };
    }, [])
  );

  const filteredRecipes = recipes
    .filter((r) => selectedCategory === 'all' || (r.categories ?? []).includes(selectedCategory))
    .filter((r) => !filterEnabled || (r.difficultyLevel <= userLevel));

  const recommendedRecipes = filteredRecipes.slice(0, 6);

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
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.container}
        onScroll={(e) => {
          const isNearTop = e.nativeEvent.contentOffset.y < 100;
          setShowScrollTop(!isNearTop);
        }}
        scrollEventThrottle={16}
      >
        <GreetingHeader
          user={user}
          displayName={displayName}
          activeThemeColor={activeTheme.color}
          bgTheme={bgTheme}
          fontSizeScale={fontSizeScale}
          onLoginPress={() => navigation.navigate('Auth')}
        />

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSearch={() => {
            if (searchQuery.trim().length > 0) {
              navigation.navigate('検索', { initialQuery: searchQuery });
              setSearchQuery('');
            } else {
              navigation.navigate('検索');
            }
          }}
        />

        <CategoryTabs
          selectedCategory={selectedCategory}
          onSelect={setSelectedCategory}
        />

        <TouchableOpacity
          style={[
            styles.filterBanner,
            {
              backgroundColor: filterEnabled ? activeTheme.color + 'E6' : '#FFFFFF',
              alignSelf: 'center',
              paddingHorizontal: 20,
              gap: 8,
            }
          ]}
          onPress={() => setFilterEnabled(!filterEnabled)}
        >
          <Ionicons
            name={filterEnabled ? 'funnel' : 'funnel-outline'}
            size={16}
            color={filterEnabled ? '#fff' : bgTheme.subText}
          />
          <Text style={[
            styles.filterBannerText,
            { color: filterEnabled ? '#fff' : bgTheme.subText, fontSize: 13 * fontSizeScale }
          ]}>
            {filterEnabled
              ? `設定したレベルに合わせて絞り込む`
              : 'あなたのレベルに合うレシピだけ表示'}
          </Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[
              styles.sectionTitle,
              {
                fontSize: 20 * fontSizeScale,
                color: bgTheme.subText,
                textShadowColor: bgTheme.id === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.15)',
                textShadowOffset: { width: 0, height: 1.5 },
                textShadowRadius: 3
              }
            ]}>あなたへのおすすめ</Text>
          </View>

          <RecommendedCarousel
            recipes={recommendedRecipes}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            onPressRecipe={(recipeId) => navigation.navigate('RecipeDetail', { recipeId })}
            activeThemeColor={activeTheme.color}
            bgTheme={bgTheme}
            fontSizeScale={fontSizeScale}
          />
        </View>

        <View style={[styles.section, { flex: 1 }]}>
          <View style={[styles.sectionHeader, { flexDirection: 'column', alignItems: 'stretch' }]}>
            <Text style={[
              styles.sectionTitle,
              {
                fontSize: 20 * fontSizeScale,
                marginBottom: 12,
                color: bgTheme.subText,
                textShadowColor: bgTheme.id === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.15)',
                textShadowOffset: { width: 0, height: 1.5 },
                textShadowRadius: 3
              }
            ]}>レシピを探す</Text>
            <View style={[styles.layoutSwitcher, { backgroundColor: bgTheme.surface || '#f5f5f5', width: '100%' }]}>
              <TouchableOpacity
                onPress={() => setLayoutType('list')}
                style={[styles.layoutBtn, { flex: 1 }, layoutType === 'list' ? { backgroundColor: activeTheme.color + 'E6' } : null]}
              >
                <MaterialIcons name="call-to-action" size={24 * fontSizeScale} color={layoutType === 'list' ? '#fff' : bgTheme.subText} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setLayoutType('grid2')}
                style={[styles.layoutBtn, { flex: 1 }, layoutType === 'grid2' ? { backgroundColor: activeTheme.color + 'E6' } : null]}
              >
                <Ionicons name="grid-outline" size={24 * fontSizeScale} color={layoutType === 'grid2' ? '#fff' : bgTheme.subText} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setLayoutType('grid3')}
                style={[styles.layoutBtn, { flex: 1 }, layoutType === 'grid3' ? { backgroundColor: activeTheme.color + 'E6' } : null]}
              >
                <Ionicons name="apps-outline" size={24 * fontSizeScale} color={layoutType === 'grid3' ? '#fff' : bgTheme.subText} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setLayoutType('compact')}
                style={[styles.layoutBtn, { flex: 1 }, layoutType === 'compact' ? { backgroundColor: activeTheme.color + 'E6' } : null]}
              >
                <Ionicons name="reorder-four-outline" size={24 * fontSizeScale} color={layoutType === 'compact' ? '#fff' : bgTheme.subText} />
              </TouchableOpacity>
            </View>
          </View>

          {filteredRecipes.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>😅 該当するレシピがありません</Text>
              <Text style={styles.emptySubText}>レベル設定を上げるか、フィルターをOFFにしてみてください。</Text>
            </View>
          ) : (
            <View style={styles.recipesGrid}>
              {filteredRecipes.map((recipe, index) => {
                const containerWidth = SCREEN_WIDTH - 32;
                const gap = 8;
                let itemWidth: any = '100%';
                let marginBottom = 16;

                if (layoutType === 'grid2') {
                  itemWidth = (containerWidth - gap) / 2;
                  marginBottom = 0;
                } else if (layoutType === 'grid3') {
                  itemWidth = (containerWidth - gap * 2) / 3;
                  marginBottom = 0;
                } else if (layoutType === 'compact') {
                  marginBottom = 0;
                } else if (layoutType === 'list') {
                  marginBottom = 12;
                }

                return (
                  <React.Fragment key={recipe.id}>
                    {index > 0 && layoutType === 'list' && (
                      <View style={{ width: '100%' }}>
                        {index % 6 === 0 ? (
                          <AdBannerHorizontal
                            sponsorName="フレッシュ・デリ"
                            title="採れたて野菜の定期便"
                            imageUrl="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=150&q=80"
                          />
                        ) : index % 3 === 0 ? (
                          <AdBannerCard
                            sponsorName="オーガニック・マート"
                            title="厳選された旬の野菜をお届け"
                            description="今なら新規会員登録で、初回のご注文が20%OFF！新鮮な食材で料理をもっと楽しく。"
                          />
                        ) : null}
                      </View>
                    )}
                    <View style={{ width: itemWidth, marginBottom, position: 'relative' }}>
                      <RecipeCard
                        variant={layoutType}
                        title={recipe.title}
                        time={recipe.time}
                        imageUrl={recipe.imageUrl}
                        isSponsored={recipe.isSponsored}
                        difficultyLevel={recipe.difficultyLevel}
                        isFavorited={favorites.some((f: any) => f.id === recipe.id)}
                        onFavoriteToggle={() => toggleFavorite(recipe)}
                        categories={recipe.categories}
                        calories={calculateNutrition(recipe.ingredients, recipe.baseServings || 2).calories}
                        onPress={() => navigation.navigate('RecipeDetail', { recipeId: recipe.id })}
                        style={{ flex: 1 }}
                      />
                    </View>
                  </React.Fragment>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {showScrollTop && (
        <TouchableOpacity
          style={[styles.scrollTopBtn, { backgroundColor: activeTheme.color + 'E6' }]}
          onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
          activeOpacity={0.8}
        >
          <Ionicons
            name="arrow-up"
            size={24}
            color="#fff"
            style={{
              textShadowColor: 'rgba(0,0,0,0.2)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 2
            }}
          />
          <Text style={[styles.scrollTopText, { fontSize: 14 * fontSizeScale }]}>トップへ</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: 16,
    paddingBottom: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  filterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  filterBannerText: {
    fontWeight: 'bold',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#555',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
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
  recipesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    columnGap: 8,
    rowGap: 4,
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
});
