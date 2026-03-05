import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { isFavorite, saveFavorite, removeFavorite, getMasterRecipes, MasterRecipe } from '../utils/storage';

export function useRecipeDetail(recipeId: string) {
    const [recipe, setRecipe] = useState<MasterRecipe | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFavorited, setIsFavorited] = useState(false);
    const [servings, setServings] = useState(2);

    const loadRecipe = useCallback(async () => {
        setLoading(true);
        try {
            const [masterRecipes, favorited] = await Promise.all([
                getMasterRecipes(),
                isFavorite(recipeId)
            ]);
            const found = masterRecipes.find(r => r.id === recipeId);
            if (found) {
                setRecipe(found);
                setServings(found.baseServings);
            }
            setIsFavorited(favorited);
        } catch (error) {
            console.error("Failed to load recipe detail:", error);
        } finally {
            setLoading(false);
        }
    }, [recipeId]);

    useFocusEffect(
        useCallback(() => {
            loadRecipe();
        }, [loadRecipe])
    );

    const toggleFavorite = async () => {
        if (!recipe) return;
        if (isFavorited) {
            await removeFavorite(recipe.id);
            setIsFavorited(false);
        } else {
            await saveFavorite({
                id: recipe.id,
                title: recipe.title,
                imageUrl: recipe.imageUrl,
                difficultyLevel: recipe.difficultyLevel,
                time: recipe.time,
                categories: recipe.categories,
            });
            setIsFavorited(true);
        }
    };

    return {
        recipe,
        loading,
        isFavorited,
        servings,
        setServings,
        toggleFavorite,
        refreshData: loadRecipe
    };
}
