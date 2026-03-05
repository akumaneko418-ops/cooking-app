import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getMyRecipes, getFavorites, saveFavorite, removeFavorite, SavedRecipe, FavoriteRecipe } from '../utils/storage';

export function useMyRecipes() {
    const [myRecipes, setMyRecipes] = useState<SavedRecipe[]>([]);
    const [favorites, setFavorites] = useState<FavoriteRecipe[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [recipes, favs] = await Promise.all([
                getMyRecipes(),
                getFavorites()
            ]);
            setMyRecipes(recipes);
            setFavorites(favs);
        } catch (error) {
            console.error("Failed to load my recipes data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const toggleFavorite = async (item: any) => {
        const isEdited = 'isOriginal' in item;
        const isFav = favorites.some(f => f.id === item.id);

        if (isFav) {
            await removeFavorite(item.id);
            setFavorites(prev => prev.filter(f => f.id !== item.id)); // Optimistic UI update
        } else {
            const newFav: FavoriteRecipe = {
                id: item.id,
                title: item.title,
                imageUrl: item.imageUrl,
                difficultyLevel: isEdited ? 2 : (item as FavoriteRecipe).difficultyLevel,
                time: isEdited ? "アレンジ済み" : (item as FavoriteRecipe).time,
                categories: item.categories,
            };
            await saveFavorite(newFav);
            setFavorites(prev => [newFav, ...prev]);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    return { myRecipes, favorites, loading, toggleFavorite, refreshData: loadData };
}
