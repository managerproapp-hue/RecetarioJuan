import { createClient } from '@supabase/supabase-js'

// Intentamos obtener las credenciales de localStorage (ajustes de la app)
const getCredentials = () => {
    const savedSettings = localStorage.getItem('settings')
    if (savedSettings) {
        const settings = JSON.parse(savedSettings)
        return {
            url: settings.supabaseUrl,
            key: settings.supabaseKey
        }
    }
    return { url: '', key: '' }
}

const { url, key } = getCredentials()

// El cliente se exporta como una función para permitir re-inicialización
// si el usuario cambia las claves en ajustes sin recargar
export const getSupabase = (customUrl, customKey) => {
    const finalUrl = customUrl || url
    const finalKey = customKey || key

    if (!finalUrl || !finalKey) return null

    return createClient(finalUrl, finalKey)
}

export const supabase = getSupabase()
