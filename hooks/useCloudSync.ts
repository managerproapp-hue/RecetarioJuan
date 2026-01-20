import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useCloudSync<T>(key: string, initialValue: T, userId?: string): [T, (value: T | ((val: T) => T)) => void, boolean] {
    const [storedValue, setStoredValue] = useState<T>(initialValue);
    const [loading, setLoading] = useState(true);

    const scopedKey = userId ? `${key}:${userId}` : key;

    // 1. Initial Load from Supabase
    useEffect(() => {
        async function loadData() {
            if (!userId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);

                // Try scoped key first (e.g. 'recipes:USER_ID')
                let { data, error } = await supabase
                    .from('store')
                    .select('value')
                    .eq('key', scopedKey)
                    .single();

                // If not found and using a scoped key, try to migrate from global key ('recipes')
                // code 'PGRST116' means 'no rows returned'
                if ((error && error.code === 'PGRST116')) {
                    const { data: globalData, error: globalError } = await supabase
                        .from('store')
                        .select('value')
                        .eq('key', key)
                        .single();

                    if (globalData?.value) {
                        data = globalData;
                        // Auto-migrate to scoped key for the future
                        await supabase.from('store').upsert({ key: scopedKey, value: globalData.value });
                    }
                } else if (error) {
                    console.error(`Sync: Error loading "${scopedKey}":`, error.message);
                }

                if (data?.value) {
                    setStoredValue(data.value);
                } else {
                    // Check localStorage as fallback (for new users or offline data)
                    const localItem = window.localStorage.getItem(scopedKey) || window.localStorage.getItem(key);
                    if (localItem) {
                        try {
                            const localValue = JSON.parse(localItem);
                            setStoredValue(localValue);
                            // Push local data to cloud
                            await supabase.from('store').upsert({ key: scopedKey, value: localValue });
                        } catch (e) {
                            console.error("Sync: Invalid JSON in localStorage", e);
                        }
                    }
                }
            } catch (err: any) {
                console.warn('Sync Load Exception:', err.message);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [scopedKey, userId]);

    // 2. Set Value (Update Local and Cloud)
    const setValue = async (value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);

            // 1. Local Persistence (Fast)
            if (userId) window.localStorage.setItem(scopedKey, JSON.stringify(valueToStore));
            window.localStorage.setItem(key, JSON.stringify(valueToStore));

            // 2. Cloud Persistence (Async)
            if (userId) {
                const { error } = await supabase
                    .from('store')
                    .upsert({
                        key: scopedKey,
                        value: valueToStore,
                        updated_at: new Date().toISOString()
                    });

                if (error) {
                    console.error(`Sync: Cloud Save Error for "${scopedKey}":`, error.message);
                    // Inform the user if it's a permission/RLS issue
                    if (error.code === '42501') {
                        console.warn("Sync: Posible problema de permisos RLS en Supabase.");
                    }
                }
            }
        } catch (error: any) {
            console.warn(`Sync: Exception in setValue for "${scopedKey}":`, error.message);
        }
    };

    return [storedValue, setValue, loading];
}
