import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getFavorites, saveFavorite, removeFavorite, FavoriteRecipe, getMasterRecipes, MasterRecipe } from '../utils/storage';

export function useRecipes() {
  const [recipes, setRecipes] = useState<MasterRecipe[]>([]);
  const [favorites, setFavorites] = useState<FavoriteRecipe[]>([]);
  const [loading, setLoading] = useState(true);

  // データの読み込み
  const loadData = useCallback(async () => {
    // 最初の読み込み時のみloadingをtrueにする処理は使う側で行うか、ここで管理するか
    setLoading(true);
    try {
      const [favs, masterRecipes] = await Promise.all([
        getFavorites(),
        getMasterRecipes(),
      ]);
      setFavorites(favs);
      setRecipes(masterRecipes);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 画面フォーカス時に再読み込みさせたい場合用のフック組み込み
  // ※コンポーネント側で呼び出す想定
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // お気に入りの切り替え
  const toggleFavorite = async (recipe: any) => {
    const isFav = favorites.some((f) => f.id === recipe.id);
    if (isFav) {
      await removeFavorite(recipe.id);
      setFavorites((prev) => prev.filter((f) => f.id !== recipe.id));
    } else {
      const newFav: FavoriteRecipe = {
        id: recipe.id,
        title: recipe.title,
        imageUrl: recipe.imageUrl,
        difficultyLevel: recipe.difficultyLevel,
        time: recipe.time,
        categories: recipe.categories,
      };
      await saveFavorite(newFav);
      setFavorites((prev) => [newFav, ...prev]);
    }
  };

  return {
    recipes,
    favorites,
    loading,
    toggleFavorite,
    refreshData: loadData
  };
}
