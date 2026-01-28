# Guía de Aplicación del Fix de Visibilidad de Recetas

## 🎯 Objetivo

Resolver el problema donde las recetas aparecen en la auditoría pero no en la vista principal, aplicando una solución completa desde cero con todas las mejoras ya diseñadas.

## 📋 Pasos para Aplicar el Fix

### 1. Ejecutar el Script SQL en Supabase

1. **Accede a tu proyecto en Supabase**
   - Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Selecciona tu proyecto RecetarioJuan

2. **Abre el SQL Editor**
   - En el menú lateral, haz clic en "SQL Editor"
   - Haz clic en "New Query"

3. **Copia y pega el contenido completo del archivo** [`complete_rls_fix.sql`](file:///c:/Users/jcbpr/Downloads/Antigraviti/Rectas-Juan/Mis%20recetas%20-%20Antigravity/RecetarioJuan-main/complete_rls_fix.sql)

4. **Ejecuta el script**
   - Haz clic en "Run" o presiona `Ctrl+Enter`
   - Espera a que termine la ejecución (puede tardar unos segundos)

5. **Verifica los resultados**
   - Al final del script verás 3 tablas de diagnóstico:
     - **Políticas activas**: Deberías ver las nuevas políticas creadas
     - **Resumen de recetas**: Muestra cuántas recetas hay por usuario
     - **Información de perfiles**: Verifica que tu perfil admin está configurado

### 2. Verificar los Cambios en el Código

Los siguientes archivos ya han sido actualizados con mejoras de logging:

- ✅ [`useCloudSync.ts`](file:///c:/Users/jcbpr/Downloads/Antigraviti/Rectas-Juan/Mis%20recetas%20-%20Antigravity/RecetarioJuan-main/hooks/useCloudSync.ts) - Mejor manejo de errores y logging detallado
- ✅ [`App.tsx`](file:///c:/Users/jcbpr/Downloads/Antigraviti/Rectas-Juan/Mis%20recetas%20-%20Antigravity/RecetarioJuan-main/App.tsx) - Logging mejorado en `fetchCommunityRecipes`

### 3. Probar la Aplicación

1. **Abre la consola del navegador** (F12)
   - Verás mensajes detallados con el prefijo `[useCloudSync]` y `[fetchCommunityRecipes]`

2. **Recarga la aplicación**
   - Presiona `Ctrl+Shift+R` para forzar recarga sin caché

3. **Verifica en la consola**:
   ```
   [useCloudSync] Successfully loaded data for "recipes:USER_ID" from cloud
   [fetchCommunityRecipes] Found X recipe entries in store
   [fetchCommunityRecipes] Found Y public recipes total
   ```

4. **Prueba crear una receta**:
   - Crea una nueva receta
   - Verifica que aparece en "Mis Recetas"
   - Márcala como pública
   - Verifica que aparece en "Comunidad"

### 4. Diagnóstico de Problemas

Si las recetas aún no aparecen, revisa la consola del navegador:

#### Error: "RLS policy violation" o "permission denied"
- **Causa**: Las políticas RLS no se aplicaron correctamente
- **Solución**: Vuelve a ejecutar el script SQL completo

#### Error: "PGRST116" (No rows found)
- **Causa**: No hay datos en la clave `recipes:userId`
- **Solución**: El sistema intentará migrar desde la clave legacy `recipes`
- **Verifica**: Busca en la consola mensajes como `[useCloudSync] Found legacy data...`

#### Las recetas aparecen en auditoría pero no en Dashboard
- **Causa**: Problema con el filtrado de recetas propias
- **Solución**: Verifica que `ownerId` está configurado correctamente
- **Debug**: Busca en la consola cuántas recetas se cargaron para tu usuario

## 🔍 Verificación Final

### Checklist de Verificación

- [ ] Script SQL ejecutado sin errores
- [ ] Perfil admin verificado en la tabla de diagnóstico
- [ ] Aplicación recargada con caché limpio
- [ ] Consola del navegador muestra logs de carga exitosa
- [ ] Recetas propias visibles en "Mis Recetas"
- [ ] Recetas públicas visibles en "Comunidad"
- [ ] Admin puede ver todas las recetas en auditoría

### Comandos SQL de Diagnóstico

Si necesitas verificar manualmente el estado de la base de datos:

```sql
-- Ver todas las recetas en la tabla store
SELECT key, jsonb_array_length(value) as count 
FROM store 
WHERE key LIKE 'recipes%';

-- Ver tu perfil
SELECT * FROM profiles WHERE email = 'TU_EMAIL@gmail.com';

-- Ver todas las políticas activas
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('store', 'profiles', 'products')
ORDER BY tablename, policyname;
```

## 📞 Soporte

Si después de seguir todos estos pasos las recetas aún no aparecen:

1. Copia los logs de la consola del navegador
2. Ejecuta los comandos SQL de diagnóstico
3. Comparte los resultados para análisis adicional

## ✨ Mejoras Aplicadas

Este fix incluye todas las mejoras y diseños previos:

- ✅ Sistema de autenticación con Google
- ✅ Recetas públicas y privadas
- ✅ Dashboard de administración
- ✅ Base de datos de productos compartida
- ✅ Sincronización en tiempo real
- ✅ Políticas RLS robustas y seguras
- ✅ Logging detallado para debugging
