// Alérgenos disponibles en el sistema
export const ALLERGENS = [
    { id: 'gluten', name: 'Gluten', icon: '🌾' },
    { id: 'crustaceos', name: 'Crustáceos', icon: '🦐' },
    { id: 'huevos', name: 'Huevos', icon: '🥚' },
    { id: 'pescado', name: 'Pescado', icon: '🐟' },
    { id: 'cacahuetes', name: 'Cacahuetes', icon: '🥜' },
    { id: 'soja', name: 'Soja', icon: '🫘' },
    { id: 'lacteos', name: 'Lácteos', icon: '🥛' },
    { id: 'frutos_secos', name: 'Frutos Secos', icon: '🌰' },
    { id: 'apio', name: 'Apio', icon: '🥬' },
    { id: 'mostaza', name: 'Mostaza', icon: '🟡' },
    { id: 'sesamo', name: 'Sésamo', icon: '⚪' },
    { id: 'sulfitos', name: 'Sulfitos', icon: '🍷' },
    { id: 'altramuces', name: 'Altramuces', icon: '🫘' },
    { id: 'moluscos', name: 'Moluscos', icon: '🦪' }
]

// Categorías de recetas
export const CATEGORIES = [
    'Entrantes',
    'Carnes',
    'Pescados',
    'Arroces',
    'Pastas',
    'Ensaladas',
    'Postres',
    'Salsas',
    'Guarniciones',
    'Bebidas'
]

// Unidades de medida
export const UNITS = [
    'g',
    'kg',
    'ml',
    'l',
    'ud',
    'cdta',
    'cda',
    'pizca',
    'al gusto'
]

// Tipos de servicio
export const SERVICE_TYPES = [
    'Emplatado',
    'Gueridón',
    'Buffet',
    'Familia',
    'Degustación'
]

// Base de datos inicial de productos (se irá expandiendo con auto-aprendizaje)
export const INITIAL_PRODUCTS = [
    // Verduras y Hortalizas
    { name: 'Tomate', unit: 'kg', allergens: [], category: 'Verduras' },
    { name: 'Cebolla', unit: 'kg', allergens: [], category: 'Verduras' },
    { name: 'Ajo', unit: 'kg', allergens: [], category: 'Verduras' },
    { name: 'Pimiento rojo', unit: 'kg', allergens: [], category: 'Verduras' },
    { name: 'Pimiento verde', unit: 'kg', allergens: [], category: 'Verduras' },
    { name: 'Zanahoria', unit: 'kg', allergens: [], category: 'Verduras' },
    { name: 'Patata', unit: 'kg', allergens: [], category: 'Verduras' },
    { name: 'Lechuga', unit: 'ud', allergens: [], category: 'Verduras' },
    { name: 'Espinacas', unit: 'kg', allergens: [], category: 'Verduras' },
    { name: 'Champiñón', unit: 'kg', allergens: [], category: 'Verduras' },

    // Carnes
    { name: 'Solomillo de ternera', unit: 'kg', allergens: [], category: 'Carnes' },
    { name: 'Entrecot', unit: 'kg', allergens: [], category: 'Carnes' },
    { name: 'Pechuga de pollo', unit: 'kg', allergens: [], category: 'Carnes' },
    { name: 'Muslo de pollo', unit: 'kg', allergens: [], category: 'Carnes' },
    { name: 'Costillas de cerdo', unit: 'kg', allergens: [], category: 'Carnes' },
    { name: 'Jamón serrano', unit: 'kg', allergens: [], category: 'Carnes' },
    { name: 'Chorizo', unit: 'kg', allergens: [], category: 'Carnes' },

    // Pescados y Mariscos
    { name: 'Merluza', unit: 'kg', allergens: ['pescado'], category: 'Pescados' },
    { name: 'Salmón', unit: 'kg', allergens: ['pescado'], category: 'Pescados' },
    { name: 'Bacalao', unit: 'kg', allergens: ['pescado'], category: 'Pescados' },
    { name: 'Lubina', unit: 'kg', allergens: ['pescado'], category: 'Pescados' },
    { name: 'Gambas', unit: 'kg', allergens: ['crustaceos'], category: 'Mariscos' },
    { name: 'Langostinos', unit: 'kg', allergens: ['crustaceos'], category: 'Mariscos' },
    { name: 'Mejillones', unit: 'kg', allergens: ['moluscos'], category: 'Mariscos' },
    { name: 'Almejas', unit: 'kg', allergens: ['moluscos'], category: 'Mariscos' },

    // Lácteos
    { name: 'Leche', unit: 'l', allergens: ['lacteos'], category: 'Lácteos' },
    { name: 'Nata', unit: 'l', allergens: ['lacteos'], category: 'Lácteos' },
    { name: 'Mantequilla', unit: 'kg', allergens: ['lacteos'], category: 'Lácteos' },
    { name: 'Queso parmesano', unit: 'kg', allergens: ['lacteos'], category: 'Lácteos' },
    { name: 'Queso manchego', unit: 'kg', allergens: ['lacteos'], category: 'Lácteos' },
    { name: 'Mozzarella', unit: 'kg', allergens: ['lacteos'], category: 'Lácteos' },

    // Huevos
    { name: 'Huevos', unit: 'ud', allergens: ['huevos'], category: 'Huevos' },

    // Cereales y Legumbres
    { name: 'Arroz', unit: 'kg', allergens: [], category: 'Cereales' },
    { name: 'Pasta', unit: 'kg', allergens: ['gluten'], category: 'Cereales' },
    { name: 'Harina de trigo', unit: 'kg', allergens: ['gluten'], category: 'Cereales' },
    { name: 'Pan rallado', unit: 'kg', allergens: ['gluten'], category: 'Cereales' },
    { name: 'Lentejas', unit: 'kg', allergens: [], category: 'Legumbres' },
    { name: 'Garbanzos', unit: 'kg', allergens: [], category: 'Legumbres' },

    // Aceites y Condimentos
    { name: 'Aceite de oliva', unit: 'l', allergens: [], category: 'Aceites' },
    { name: 'Aceite de girasol', unit: 'l', allergens: [], category: 'Aceites' },
    { name: 'Sal', unit: 'kg', allergens: [], category: 'Condimentos' },
    { name: 'Pimienta negra', unit: 'kg', allergens: [], category: 'Condimentos' },
    { name: 'Azúcar', unit: 'kg', allergens: [], category: 'Condimentos' },
    { name: 'Vinagre', unit: 'l', allergens: ['sulfitos'], category: 'Condimentos' },

    // Vinos y Licores
    { name: 'Vino blanco', unit: 'l', allergens: ['sulfitos'], category: 'Vinos' },
    { name: 'Vino tinto', unit: 'l', allergens: ['sulfitos'], category: 'Vinos' },
    { name: 'Brandy', unit: 'l', allergens: ['sulfitos'], category: 'Licores' },

    // Otros
    { name: 'Caldo de pollo', unit: 'l', allergens: [], category: 'Caldos' },
    { name: 'Caldo de pescado', unit: 'l', allergens: ['pescado'], category: 'Caldos' },
    { name: 'Tomate frito', unit: 'kg', allergens: [], category: 'Conservas' }
]

// Estructura de una Elaboración (Sub-receta)
export const createElaboration = (name = 'Nueva Elaboración') => ({
    id: Date.now() + Math.random(),
    name,
    image: null,
    ingredients: [], // { id, product, quantity, unit, allergens: [] }
    process: ''
})

// Estructura de una Receta Completa
export const createRecipe = () => ({
    id: Date.now(),
    // Datos Generales
    name: '',
    category: '',
    finalImage: null,
    yield: { amount: 4, unit: 'Raciones' },

    // Elaboraciones (Sub-recetas)
    elaborations: [createElaboration('Elaboración Principal')],

    // Montaje y Servicio
    plating: '',
    serviceDetails: {
        temperature: '',
        passTime: '',
        cutlery: '',
        serviceType: '',
        visualNotes: '',
        commercialDescription: ''
    },

    // Metadatos
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isPublished: false,
    authorId: null,
    authorName: null
})

// Función para calcular todos los alérgenos de una receta
export const calculateRecipeAllergens = (recipe) => {
    const allergensSet = new Set()

    recipe.elaborations?.forEach(elaboration => {
        elaboration.ingredients?.forEach(ingredient => {
            ingredient.allergens?.forEach(allergen => {
                allergensSet.add(allergen)
            })
        })
    })

    return Array.from(allergensSet)
}

// Función para buscar productos
export const searchProducts = (query, productDatabase) => {
    if (!query || query.length < 2) return []

    const lowerQuery = query.toLowerCase()
    return productDatabase
        .filter(product =>
            product.name.toLowerCase().includes(lowerQuery)
        )
        .slice(0, 10) // Limitar a 10 resultados
}

// Función para auto-aprender un nuevo producto
export const learnNewProduct = (productName, unit = 'kg', allergens = []) => ({
    name: productName,
    unit,
    allergens,
    category: 'Otros',
    learned: true, // Marca que fue aprendido automáticamente
    learnedAt: new Date().toISOString()
})
