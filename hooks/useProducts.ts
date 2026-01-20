import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Product } from '../types';

export function useProducts(userProfile: any) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isAdmin = userProfile?.role === 'admin';

    useEffect(() => {
        fetchProducts();

        // 🔄 REALTIME: Listen for any changes in the shared products table
        const channel = supabase
            .channel('shared-products')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'products' },
                () => {
                    fetchProducts(); // Simple re-fetch on change
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userProfile]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;

            // Map DB fields to Frontend fields if necessary (snake_case to camelCase)
            const mapped = (data || []).map(p => ({
                id: p.id,
                name: p.name,
                category: p.category,
                unit: p.unit,
                pricePerUnit: Number(p.price_per_unit),
                allergens: p.allergens || [],
                is_approved: p.is_approved,
                created_by: p.created_by
            } as Product));

            setProducts(mapped);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const addProduct = async (p: Product) => {
        const { error } = await supabase.from('products').insert({
            name: p.name,
            category: p.category,
            unit: p.unit,
            price_per_unit: p.pricePerUnit,
            allergens: p.allergens,
            created_by: userProfile?.id,
            is_approved: isAdmin // Admins products are auto-approved
        });
        if (error) throw error;
    };

    const updateProduct = async (p: Product) => {
        const { error } = await supabase.from('products').update({
            name: p.name,
            category: p.category,
            unit: p.unit,
            price_per_unit: p.pricePerUnit,
            allergens: p.allergens,
            is_approved: p.is_approved
        }).eq('id', p.id);
        if (error) throw error;
    };

    const deleteProduct = async (id: string) => {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
    };

    return { products, loading, error, addProduct, updateProduct, deleteProduct, refresh: fetchProducts };
}
