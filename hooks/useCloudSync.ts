import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export function useCloudSync<T>(key: string, initialValue: T, userId?: string): [T, (value: T | ((val: T) => T)) => void, boolean] {
    const [storedValue, setStoredValue] = useState<T>(initialValue);
    const [loading, setLoading] = useState(true);
    const hasLoaded = useRef(false); // Flag to prevent premature cloud saves

    const scopedKey = userId ? `${key}:${userId}` : key;

    // 1. Initial Load from Supabase
    useEffect(() => {
        let isCurrent = true;
        hasLoaded.current = false;

        async function loadData() {
            if (!userId) {
                if (isCurrent) {
                    setLoading(false);
                    // For unauthenticated users, fallback to localStorage immediately
                    const localData = window.localStorage.getItem(key);
                    if (localData) {
                        try { setStoredValue(JSON.parse(localData)); } catch (e) { }
                    }
                    hasLoaded.current = true;
                }
                return;
            }

            try {
                if (isCurrent) setLoading(true);

                // Try scoped key first (e.g. 'recipes:USER_ID')
                let { data, error } = await supabase
                    .from('store')
                    .select('value')
                    .eq('key', scopedKey)
                    .single();

                // If not found, try to migrate from global key ('recipes')
                if (isCurrent && error && error.code === 'PGRST116') {
                    const { data: globalData } = await supabase
                        .from('store')
                        .select('value')
                        .eq('key', key)
                        .single();

                    if (globalData?.value) {
                        data = globalData;
                        // Auto-migrate to scoped key
                        await supabase.from('store').upsert({ key: scopedKey, value: globalData.value });
                    }
                }

                if (!isCurrent) return;

                if (data?.value !== undefined && data.value !== null) {
                    setStoredValue(data.value);
                } else {
                    // Check localStorage as fallback
                    const localItem = window.localStorage.getItem(scopedKey) || window.localStorage.getItem(key);
                    if (localItem && isCurrent) {
                        try {
                            const localValue = JSON.parse(localItem);
                            setStoredValue(localValue);
                            // Push local data to cloud so it's synced next time
                            await supabase.from('store').upsert({ key: scopedKey, value: localValue });
                        } catch (e) {
                            console.error("Sync Error: LocalStorage corrupt", e);
                        }
                    }
                }
            } catch (err: any) {
                console.warn('Sync Load Exception:', err.message);
            } finally {
                if (isCurrent) {
                    setLoading(false);
                    hasLoaded.current = true;
                }
            }
        }

        loadData();
        return () => { isCurrent = false; };
    }, [scopedKey, userId]);

    // 2. Set Value (Update Local and Cloud)
    const setValue = async (value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);

            // 1. Local Persistence (Fast)
            if (userId) window.localStorage.setItem(scopedKey, JSON.stringify(valueToStore));
            window.localStorage.setItem(key, JSON.stringify(valueToStore));

            // 2. Cloud Persistence
            // CRITICAL: Only save to cloud if we have finished the initial load.
            // This prevents the initial [] state from wiping out existing cloud data.
            if (userId && hasLoaded.current) {
                const { error } = await supabase
                    .from('store')
                    .upsert({
                        key: scopedKey,
                        value: valueToStore,
                        updated_at: new Date().toISOString()
                    });

                if (error) console.error(`Sync: Save error for "${scopedKey}":`, error.message);
            }
        } catch (error: any) {
            console.warn(`Sync: Exception in setValue for "${scopedKey}":`, error.message);
        }
    };

    return [storedValue, setValue, loading];
}
