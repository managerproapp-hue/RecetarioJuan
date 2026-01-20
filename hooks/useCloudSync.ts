import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export function useCloudSync<T>(key: string, initialValue: T, userId?: string): [T, (value: T | ((val: T) => T)) => void, boolean, string | null] {
    const [storedValue, setStoredValue] = useState<T>(initialValue);
    const [loading, setLoading] = useState(true);
    const [syncError, setSyncError] = useState<string | null>(null);
    const hasLoaded = useRef(false);

    const scopedKey = userId ? `${key}:${userId}` : key;

    // 1. Initial Load from Supabase
    useEffect(() => {
        let isCurrent = true;
        hasLoaded.current = false;
        setSyncError(null);

        async function loadData() {
            if (!userId) {
                if (isCurrent) {
                    setLoading(false);
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
                        // Attempt migration-upsert
                        await supabase.from('store').upsert({ key: scopedKey, value: globalData.value });
                    }
                } else if (error) {
                    throw error;
                }

                if (!isCurrent) return;

                if (data?.value !== undefined && data.value !== null) {
                    setStoredValue(data.value);
                } else {
                    // Fallback to localStorage
                    const localItem = window.localStorage.getItem(scopedKey) || window.localStorage.getItem(key);
                    if (localItem && isCurrent) {
                        try {
                            const localValue = JSON.parse(localItem);
                            setStoredValue(localValue);
                            // Push local data to cloud
                            await supabase.from('store').upsert({ key: scopedKey, value: localValue });
                        } catch (e) { }
                    }
                }
                // SUCCESS: Mark as loaded
                hasLoaded.current = true;
            } catch (err: any) {
                const msg = `Load Error [${scopedKey}]: ${err.message}`;
                console.error("Sync:", msg);
                if (isCurrent) setSyncError(msg);
                // DO NOT set hasLoaded = true on network/auth errors to prevent data overwriting
            } finally {
                if (isCurrent) setLoading(false);
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

            const jsonString = JSON.stringify(valueToStore);
            const sizeMB = (jsonString.length / 1024 / 1024).toFixed(2);

            // 1. Local Persistence
            try {
                if (userId) window.localStorage.setItem(scopedKey, jsonString);
                window.localStorage.setItem(key, jsonString);
            } catch (e: any) {
                console.warn(`Sync: LocalStorage Limit reached for "${scopedKey}" (${sizeMB}MB)`);
            }

            // 2. Cloud Persistence
            // CRITICAL: Only save to cloud if we have finished the initial load successfully.
            if (userId && hasLoaded.current) {
                const { error } = await supabase
                    .from('store')
                    .upsert({
                        key: scopedKey,
                        value: valueToStore,
                        updated_at: new Date().toISOString()
                    });

                if (error) {
                    const msg = `Save Error [${scopedKey}] (${sizeMB}MB): ${error.message}`;
                    console.error("Sync:", msg);
                    setSyncError(msg);
                } else {
                    setSyncError(null); // Clear error on success
                }
            } else if (userId && !hasLoaded.current) {
                console.warn(`Sync: Skipping cloud save for "${scopedKey}" because load failed or is pending.`);
            }
        } catch (error: any) {
            console.warn(`Sync: Exception for "${scopedKey}":`, error.message);
            setSyncError(error.message);
        }
    };

    return [storedValue, setValue, loading, syncError];
}
