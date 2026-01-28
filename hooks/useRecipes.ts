import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Recipe } from '../types';

export function useRecipes(userId?: string) {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 1. Fetch "Light" Recipes (Metadata only for Dashboard)
    const fetchLightRecipes = useCallback(async () => {
        if (!userId) return;
        try {
            setLoading(true);
            console.log('[useRecipes] 🔍 Fetching light recipes...');

            const { data, error } = await supabase
                .from('recipes')
                .select('*, all_content')
                .order('last_accessed_at', { ascending: false })
                .limit(200);

            if (error) throw error;

            const lightRecipes: Recipe[] = (data || []).map(row => {
                const fullData = row.all_content as Recipe;
                return {
                    ...fullData,
                    id: row.id,
                    totalCost: row.total_cost || fullData.totalCost || 0,
                    isPublic: row.is_public,
                    lastModified: new Date(row.last_modified).getTime()
                };
            });

            setRecipes(lightRecipes);
        } catch (err: any) {
            console.error('[useRecipes] ❌ Error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    // 2. Fetch Full Recipe Details (Lazy Load)
    const fetchRecipeDetail = async (id: string): Promise<Recipe | null> => {
        try {
            console.log(`[useRecipes] 📦 Loading details for recipe ${id}...`);

            // Update last_accessed_at for "Recently Viewed" logic
            await supabase
                .from('recipes')
                .update({ last_accessed_at: new Date().toISOString() })
                .eq('id', id);

            const { data, error } = await supabase
                .from('recipes')
                .select('all_content')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data.all_content as Recipe;
        } catch (err) {
            console.error(`[useRecipes] ❌ Failed to load recipe ${id}:`, err);
            return null;
        }
    };

    // 3. Save / Upsert Recipe
    const saveRecipe = async (recipe: Recipe) => {
        if (!userId) return;
        try {
            const { error } = await supabase
                .from('recipes')
                .upsert({
                    id: recipe.id,
                    name: recipe.name,
                    category: recipe.category,
                    photo: recipe.photo,
                    creator: recipe.creator,
                    is_public: recipe.isPublic,
                    owner_id: userId,
                    total_cost: recipe.totalCost || 0,
                    last_modified: new Date().toISOString(),
                    last_accessed_at: new Date().toISOString(),
                    all_content: recipe
                });

            if (error) throw error;

            // Update local state
            setRecipes(prev => {
                const index = prev.findIndex(r => r.id === recipe.id);
                if (index >= 0) {
                    const newArr = [...prev];
                    newArr[index] = recipe;
                    return newArr;
                }
                return [recipe, ...prev];
            });

            console.log(`[useRecipes] ✅ Recipe "${recipe.name}" saved successfully`);
        } catch (err: any) {
            console.error('[useRecipes] ❌ Save error:', err);
            throw err;
        }
    };

    // 4. Delete Recipe
    const deleteRecipe = async (id: string) => {
        try {
            const { error } = await supabase
                .from('recipes')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setRecipes(prev => prev.filter(r => r.id !== id));
        } catch (err: any) {
            console.error('[useRecipes] ❌ Delete error:', err);
            throw err;
        }
    };

    useEffect(() => {
        fetchLightRecipes();
    }, [fetchLightRecipes]);

    return {
        recipes,
        loading,
        error,
        saveRecipe,
        deleteRecipe,
        fetchRecipeDetail,
        refresh: fetchLightRecipes
    };
}
