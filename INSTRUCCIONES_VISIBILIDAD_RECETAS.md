# 🔧 Instrucciones para Arreglar la Visibilidad de Recetas

## 📋 Resumen de Cambios

He implementado las siguientes correcciones para resolver los problemas de visibilidad de recetas:

1. ✅ **Asignación correcta de `ownerId`** - Todas las recetas ahora guardan correctamente el ID del propietario
2. ✅ **Actualización de `lastModified`** - Las recetas se ordenan correctamente por fecha de modificación
3. ✅ **Refresco automático de comunidad** - Cuando marcas una receta como pública, la vista de comunidad se actualiza automáticamente
4. ✅ **Logging detallado** - Mensajes de consola con emojis para facilitar la depuración
5. ✅ **Detección de errores RLS** - Identificación clara de problemas de permisos de base de datos

## 🚀 Pasos para Aplicar los Cambios

### Paso 1: Verificar la Base de Datos (IMPORTANTE)

Antes de probar la aplicación, ejecuta el script de verificación en Supabase:

1. Abre tu proyecto en [Supabase](https://app.supabase.com)
2. Ve a **SQL Editor**
3. Abre el archivo `verify_rls_and_data.sql` que he creado
4. Copia todo el contenido y pégalo en el SQL Editor
5. Haz clic en **Run** (Ejecutar)

**Qué deberías ver:**
- ✅ 4 políticas RLS en la tabla `store` (SELECT, INSERT, UPDATE, DELETE)
- ✅ 4 políticas RLS en la tabla `profiles`
- ✅ Al menos una entrada de recetas en la tabla `store`
- ✅ Tu perfil de usuario con `is_approved = true`
- ✅ RLS habilitado en todas las tablas

**Si NO ves esto**, ejecuta primero el script `complete_rls_fix.sql`:
1. Abre `complete_rls_fix.sql` en el SQL Editor
2. Ejecuta todo el script
3. Vuelve a ejecutar `verify_rls_and_data.sql` para confirmar

### Paso 2: Probar la Aplicación

1. **Abre la aplicación en tu navegador**
2. **Abre la Consola del Navegador** (F12 o clic derecho → Inspeccionar → Console)
3. **Actualiza la página** (F5)

### Paso 3: Revisar los Logs de la Consola

Deberías ver mensajes como estos:

```
[useCloudSync] ✅ Successfully loaded data for "recipes:USER_ID" from cloud
[useCloudSync] 📊 Data type: Array, Length: 5
[Dashboard] 📊 Recipe display update: { activeView: 'personal', personalRecipesCount: 5, ... }
[fetchCommunityRecipes] 🔍 Fetching all recipes from store...
[fetchCommunityRecipes] ✅ Found 2 recipe entries in store
[fetchCommunityRecipes] 🌍 Added public recipe: "Paella Valenciana" (owner: abc123...)
```

**🚨 Si ves errores:**

- **`❌ RLS POLICY ERROR`** → Las políticas RLS no están correctamente configuradas. Ejecuta `complete_rls_fix.sql`
- **`⚠️ No recipe data found`** → No hay recetas en la base de datos. Crea una receta nueva
- **`❌ Error fetching recipes`** → Problema de conexión con Supabase. Verifica tu archivo `.env`

## 🧪 Pruebas de Funcionalidad

### Prueba 1: Recetas Personales

1. Ve a la pestaña **"Mis Recetas"**
2. Deberías ver todas tus recetas
3. Si no aparecen, revisa la consola para ver los logs de `[useCloudSync]`

**Solución si no aparecen:**
- Verifica que el usuario está autenticado (mira el email en la esquina superior derecha)
- Crea una nueva receta y verifica que aparece inmediatamente
- Revisa la consola para errores RLS

### Prueba 2: Recetas Públicas

**Como Usuario A (el creador):**
1. Crea una nueva receta o edita una existente
2. Haz clic en el botón **"Público"** (debería ponerse verde)
3. Verifica que aparece el badge "PÚBLICO" en la receta
4. Revisa la consola - deberías ver:
   ```
   [handleSave] 💾 Saving recipe: { ..., isPublic: true }
   [handleSave] 🌍 Recipe is public, refreshing community recipes...
   ```

**Como Usuario B (otro usuario):**
1. Inicia sesión con una cuenta diferente
2. Ve a la pestaña **"Explorador Comunidad"**
3. Deberías ver la receta pública del Usuario A
4. Revisa la consola - deberías ver:
   ```
   [fetchCommunityRecipes] 🌍 Added public recipe: "Nombre de la Receta" (owner: USER_A_ID)
   ```

### Prueba 3: Toggle de Privacidad

1. En **"Mis Recetas"**, encuentra una receta
2. Haz clic en **"Privado"** → debería ponerse verde
3. Haz clic en **"Público"** → debería ponerse verde
4. Actualiza la página (F5)
5. Verifica que el estado de privacidad se mantuvo

## 🐛 Solución de Problemas Comunes

### Problema: "Las recetas no aparecen en Mis Recetas"

**Diagnóstico:**
1. Abre la consola (F12)
2. Busca mensajes de `[useCloudSync]`
3. Busca `[Dashboard]` para ver cuántas recetas se están mostrando

**Soluciones:**
- Si ves `❌ RLS POLICY ERROR` → Ejecuta `complete_rls_fix.sql` en Supabase
- Si ves `Length: 0` → No hay recetas guardadas, crea una nueva
- Si ves `⚠️ Skipping cloud save` → El hook no terminó de cargar, espera unos segundos y recarga

### Problema: "Las recetas públicas no aparecen para otros usuarios"

**Diagnóstico:**
1. Usuario A: Verifica que la receta tiene `isPublic: true` en la consola
2. Usuario B: Busca mensajes de `[fetchCommunityRecipes]` en la consola
3. Verifica que el `ownerId` está correctamente asignado

**Soluciones:**
- Si ves `🔒 Skipped private recipe` → La receta no está marcada como pública
- Si ves `⚠️ No recipe data found` → No hay recetas públicas en la base de datos
- Si no ves ningún mensaje de `[fetchCommunityRecipes]` → El usuario no está autenticado

### Problema: "Error de permisos RLS"

**Mensaje en consola:**
```
🚨 RLS POLICY ERROR: User does not have permission to insert/update "recipes:USER_ID"
```

**Solución:**
1. Ve a Supabase SQL Editor
2. Ejecuta `complete_rls_fix.sql` completo
3. Ejecuta `verify_rls_and_data.sql` para confirmar
4. Cierra sesión y vuelve a iniciar sesión en la aplicación

## 📊 Verificación Final

Después de aplicar todos los cambios, deberías poder:

- ✅ Ver todas tus recetas en "Mis Recetas"
- ✅ Crear nuevas recetas y verlas aparecer inmediatamente
- ✅ Marcar recetas como públicas/privadas con los botones
- ✅ Ver recetas públicas de otros usuarios en "Explorador Comunidad"
- ✅ Importar recetas de la comunidad a tu recetario personal
- ✅ Ver actualizaciones en tiempo real cuando otros usuarios publican recetas

## 📞 Si Sigues Teniendo Problemas

Si después de seguir todos estos pasos sigues teniendo problemas:

1. **Copia todos los mensajes de la consola** (especialmente los que tienen ❌ o 🚨)
2. **Toma una captura de pantalla** de la vista de "Mis Recetas" y "Explorador Comunidad"
3. **Ejecuta `verify_rls_and_data.sql`** y copia los resultados
4. Comparte esta información para que pueda ayudarte mejor

## 🎯 Archivos Modificados

Para tu referencia, estos son los archivos que he modificado:

1. **`verify_rls_and_data.sql`** (NUEVO) - Script de verificación de base de datos
2. **`App.tsx`** - Mejorado `handleSave` y `fetchCommunityRecipes`
3. **`components/Dashboard.tsx`** - Añadido logging de depuración
4. **`hooks/useCloudSync.ts`** - Mejorado logging y detección de errores RLS

¡Buena suerte! 🚀
