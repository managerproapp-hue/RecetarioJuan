// INSTRUCCIONES PARA IMPLEMENTAR LA BASE DE DATOS DE PRODUCTOS
// ============================================================

## Paso 1: Crear el archivo de productos

Crea un archivo llamado `products-database.json` en la carpeta `src/data/` con el siguiente contenido:

```json
[
  // Aquí van los 1700 productos que proporcionaste
  // El archivo debe tener exactamente el formato que me enviaste
]
```

## Paso 2: Modificar App.jsx para cargar productos iniciales

En `App.jsx`, modifica la sección de carga de productos (líneas 27-35) para incluir:

```javascript
useEffect(() => {
    const savedRecipes = localStorage.getItem('recipes')
    const savedProducts = localStorage.getItem('products')
    const savedSettings = localStorage.getItem('settings')

    if (savedRecipes) setRecipes(JSON.parse(savedRecipes))
    
    // Si no hay productos guardados, cargar la base de datos inicial
    if (savedProducts) {
        setProducts(JSON.parse(savedProducts))
    } else {
        // Importar productos iniciales desde el archivo JSON
        import('./data/products-database.json')
            .then(module => {
                const initialProducts = module.default || module
                setProducts(initialProducts)
                localStorage.setItem('products', JSON.stringify(initialProducts))
                console.log(`✅ ${initialProducts.length} productos cargados desde la base de datos inicial`)
            })
            .catch(error => {
                console.error('Error al cargar productos iniciales:', error)
                setProducts([])
            })
    }
    
    if (savedSettings) setSettings(JSON.parse(savedSettings))
}, [])
```

## Paso 3: Añadir función de importación masiva en ProductsView

En `ProductsView.jsx`, añade una función para importar productos desde JSON:

```javascript
const importProductsFromJSON = (event) => {
    const file = event.target.files[0]
    if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const importedProducts = JSON.parse(e.target.result)
                
                // Fusión inteligente: actualiza existentes, añade nuevos
                const mergedProducts = [...products]
                let added = 0
                let updated = 0
                
                importedProducts.forEach(newProduct => {
                    const existingIndex = mergedProducts.findIndex(p => p.id === newProduct.id)
                    if (existingIndex >= 0) {
                        mergedProducts[existingIndex] = newProduct
                        updated++
                    } else {
                        mergedProducts.push(newProduct)
                        added++
                    }
                })
                
                onUpdateProducts(mergedProducts)
                alert(`✅ Importación completada:\n- ${added} productos añadidos\n- ${updated} productos actualizados\n- Total: ${mergedProducts.length} productos`)
            } catch (error) {
                alert('❌ Error al importar productos: ' + error.message)
            }
        }
        reader.readAsText(file)
    }
}
```

## Paso 4: Añadir botón de importación en ProductsView

Añade este botón en la toolbar de ProductsView:

```jsx
<label className="btn btn-secondary">
    <Upload size={20} />
    Importar Productos JSON
    <input
        type="file"
        accept=".json"
        onChange={importProductsFromJSON}
        style={{ display: 'none' }}
    />
</label>
```

## Paso 5: Códigos de alérgenos

Los códigos de alérgenos utilizados son:
- GLU: Gluten
- LAC: Lácteos
- HUE: Huevos
- PES: Pescado
- CRU: Crustáceos
- MOL: Moluscos
- FRA: Frutos de cáscara (nueces, almendras, etc.)
- SOY: Soja
- SES: Sésamo
- API: Apio
- MUS: Mostaza
- SUL: Sulfitos
- ALT: Altramuces

## Paso 6: Estructura de cada producto

```javascript
{
  "id": "prod_0001",           // ID único (prod_XXXX)
  "name": "Nombre del producto", // Nombre descriptivo
  "category": "carnes",         // Categoría (carnes, pescados, verduras, etc.)
  "unit": "kg",                 // Unidad (kg, L, unidad, g)
  "allergens": ["GLU", "LAC"]   // Array de códigos de alérgenos
}
```

## Categorías disponibles:
- carnes
- pescados
- mariscos
- verduras
- frutas
- lacteos
- congelados
- almacen

## Notas importantes:

1. **Auto-aprendizaje**: Cuando guardas una receta con un ingrediente nuevo, se añade automáticamente a la base de datos
2. **Fusión inteligente**: Al importar productos, los existentes se actualizan y los nuevos se añaden
3. **Persistencia**: Todo se guarda en localStorage del navegador
4. **Exportación**: Puedes exportar toda tu base de datos desde Configuración
5. **Búsqueda**: El buscador en el editor de recetas filtra en tiempo real

## Archivo products-database.json

Debido al tamaño (1700 productos), crea el archivo manualmente copiando los datos que proporcionaste.
El archivo debe estar en: `src/data/products-database.json`

Formato completo:
```json
[
  {"id":"prod_0001","name":"Solomillo de ternera","category":"carnes","unit":"kg","allergens":[]},
  {"id":"prod_0002","name":"Entrecot de buey","category":"carnes","unit":"kg","allergens":[]},
  // ... resto de productos hasta prod_1700
]
```
