import { useState, useMemo } from 'react'
import {
    Search, Plus, Trash2, ChevronUp, ChevronDown,
    FileText, AlertOctagon, Printer, Calendar, X, Check, ShoppingCart
} from 'lucide-react'
import { DetailView } from './DetailView'

// ============================================
// PLANIFICADOR DE MENÚS - VISTA PRINCIPAL
// ============================================
export function MenuPlannerView({ recipes, onNavigate, settings }) {
    const [activeTab, setActiveTab] = useState('planner') // planner, service-order, allergen-matrix
    const [searchTerm, setSearchTerm] = useState('')
    const [currentMenu, setCurrentMenu] = useState({
        title: '',
        date: new Date().toISOString().split('T')[0],
        pax: 50, // Default pax
        dishes: [], // { recipeId, recipe, order, customServings, checklist, verified }
        manualItems: [] // { id, name, quantity, unit, category, checked }
    })
    const [verifyingDishIndex, setVerifyingDishIndex] = useState(null)

    // Función para imprimir menú completo
    const handlePrintFullMenu = () => {
        window.print()
    }

    // Filtrar recetas por búsqueda
    const filteredRecipes = useMemo(() => {
        return recipes.filter(recipe =>
            recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            recipe.category.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [recipes, searchTerm])

    // Añadir plato al menú
    const addDishToMenu = (recipe) => {
        // Generar checklist inicial desde elaboraciones
        const initialChecklist = recipe.elaborations.map((elab, index) => ({
            id: `chk-${Date.now()}-${index}`,
            text: elab.name,
            checked: false
        }))

        const newDish = {
            recipeId: recipe.id,
            recipe: recipe,
            order: currentMenu.dishes.length + 1,
            customServings: currentMenu.pax, // Por defecto igual a Pax del menú
            checklist: initialChecklist,
            verified: false
        }
        setCurrentMenu({
            ...currentMenu,
            dishes: [...currentMenu.dishes, newDish]
        })
    }

    // Eliminar plato del menú
    const removeDishFromMenu = (index) => {
        const newDishes = currentMenu.dishes.filter((_, i) => i !== index)
        // Reordenar
        const reorderedDishes = newDishes.map((dish, i) => ({
            ...dish,
            order: i + 1
        }))
        setCurrentMenu({
            ...currentMenu,
            dishes: reorderedDishes
        })
    }

    // Mover plato arriba
    const moveDishUp = (index) => {
        if (index === 0) return
        const newDishes = [...currentMenu.dishes]
        const temp = newDishes[index]
        newDishes[index] = newDishes[index - 1]
        newDishes[index - 1] = temp
        // Reordenar
        const reorderedDishes = newDishes.map((dish, i) => ({
            ...dish,
            order: i + 1
        }))
        setCurrentMenu({
            ...currentMenu,
            dishes: reorderedDishes
        })
    }

    // Mover plato abajo
    const moveDishDown = (index) => {
        if (index === currentMenu.dishes.length - 1) return
        const newDishes = [...currentMenu.dishes]
        const temp = newDishes[index]
        newDishes[index] = newDishes[index + 1]
        newDishes[index + 1] = temp
        // Reordenar
        const reorderedDishes = newDishes.map((dish, i) => ({
            ...dish,
            order: i + 1
        }))
        setCurrentMenu({
            ...currentMenu,
            dishes: reorderedDishes
        })
    }

    // Nuevo menú
    const newMenu = () => {
        setCurrentMenu({
            title: '',
            date: new Date().toISOString().split('T')[0],
            pax: 50,
            dishes: []
        })
        setActiveTab('planner')
    }

    // Abrir modal de verificación
    const handleVerifyDish = (index) => {
        setVerifyingDishIndex(index)
    }

    // Guardar verificación
    const handleSaveVerification = (index, updatedData) => {
        const newDishes = [...currentMenu.dishes]
        newDishes[index] = {
            ...newDishes[index],
            ...updatedData, // { customServings, checklist }
            verified: true
        }
        setCurrentMenu({
            ...currentMenu,
            dishes: newDishes
        })
        setVerifyingDishIndex(null)
    }

    return (
        <div className="view-container">
            {/* VISTA DE PANTALLA (oculta al imprimir) */}
            <div className="screen-only">
                {/* Header */}
                <div className="view-header">
                    <div className="view-header-content">
                        <div className="view-title-section">
                            <Calendar className="view-icon" />
                            <h1 className="view-title">Planificador de Menús</h1>
                        </div>
                        <div className="header-actions" style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={handlePrintFullMenu} className="btn btn-primary">
                                <Printer size={20} />
                                Imprimir Completo
                            </button>
                            <button onClick={() => onNavigate('dashboard')} className="btn btn-secondary">
                                <X size={20} />
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="tabs-container">
                    <button
                        className={`tab ${activeTab === 'planner' ? 'active' : ''}`}
                        onClick={() => setActiveTab('planner')}
                    >
                        <Calendar size={18} />
                        Planificador
                    </button>
                    <button
                        className={`tab ${activeTab === 'order' ? 'active' : ''}`}
                        onClick={() => setActiveTab('order')}
                        disabled={currentMenu.dishes.length === 0}
                    >
                        <ShoppingCart size={18} />
                        Pedido General
                    </button>
                    <button
                        className={`tab ${activeTab === 'service-order' ? 'active' : ''}`}
                        onClick={() => setActiveTab('service-order')}
                        disabled={currentMenu.dishes.length === 0}
                    >
                        <FileText size={18} />
                        Orden de Servicio
                    </button>
                    <button
                        className={`tab ${activeTab === 'allergen-matrix' ? 'active' : ''}`}
                        onClick={() => setActiveTab('allergen-matrix')}
                        disabled={currentMenu.dishes.length === 0}
                    >
                        <AlertOctagon size={18} />
                        Matriz de Alérgenos
                    </button>
                </div>

                {/* Content */}
                <div className="view-content">
                    {activeTab === 'planner' && (
                        <PlannerTab
                            recipes={filteredRecipes}
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            currentMenu={currentMenu}
                            setCurrentMenu={setCurrentMenu}
                            addDishToMenu={addDishToMenu}
                            removeDishFromMenu={removeDishFromMenu}
                            moveDishUp={moveDishUp}
                            moveDishDown={moveDishDown}
                            newMenu={newMenu}
                            onVerify={handleVerifyDish}
                        />
                    )}
                    {activeTab === 'service-order' && (
                        <ServiceOrderTab
                            currentMenu={currentMenu}
                            settings={settings}
                        />
                    )}
                    {activeTab === 'order' && (
                        <OrderTab
                            currentMenu={currentMenu}
                            setCurrentMenu={setCurrentMenu}
                            settings={settings}
                            productDatabase={[]} // Idealmente pasar la DB completa
                        />
                    )}
                    {activeTab === 'allergen-matrix' && (
                        <AllergenMatrixTab
                            currentMenu={currentMenu}
                            settings={settings}
                        />
                    )}
                </div>

                {/* Modal de Verificación */}
                {verifyingDishIndex !== null && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 1000,
                        background: 'white',
                        overflowY: 'auto'
                    }}>
                        <DetailView
                            recipe={currentMenu.dishes[verifyingDishIndex].recipe}
                            productDatabase={[]} // Asumimos que no necesitamos DB completa aquí o se pasará como prop si es necesario
                            onClose={() => setVerifyingDishIndex(null)}
                            settings={settings}

                            // Props de verificación
                            verificationMode={true}
                            initialServings={currentMenu.dishes[verifyingDishIndex].customServings}
                            initialChecklist={currentMenu.dishes[verifyingDishIndex].checklist}
                            onSaveVerification={(data) => handleSaveVerification(verifyingDishIndex, data)}
                        />
                    </div>
                )}
            </div>

            {/* VISTA DE IMPRESIÓN (visible solo al imprimir) */}
            <div className="print-only">
                {/* 1. Portada del Menú */}
                <div className="print-menu-cover page-break">
                    <div className="text-center" style={{ padding: '4rem 0' }}>
                        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>{currentMenu.title || 'Menú sin título'}</h1>
                        <p style={{ fontSize: '1.5rem', color: '#666' }}>
                            Fecha: {new Date(currentMenu.date).toLocaleDateString()}
                        </p>
                        <p style={{ fontSize: '1.5rem', marginTop: '1rem' }}>
                            <strong>{currentMenu.pax}</strong> Comensales
                        </p>
                    </div>
                </div>

                {/* 2. Fichas Técnicas con Checklist */}
                {currentMenu.dishes.map((dish, index) => (
                    <div key={index} className="print-recipe-page page-break">
                        <DetailView
                            recipe={dish.recipe}
                            productDatabase={[]}
                            onClose={() => { }}
                            onEdit={() => { }}
                            settings={settings}

                            // Modo Lectura pero con datos verificados
                            verificationMode={false}
                            initialServings={dish.customServings} // Usamos serving custom
                            initialChecklist={dish.checklist} // Usamos checklist verificado
                        />
                    </div>
                ))}

                {/* 3. Pedido de Géneros */}
                <div className="print-order-page page-break-before">
                    <OrderTab
                        currentMenu={currentMenu}
                        setCurrentMenu={() => { }} // Read only
                        settings={settings}
                        productDatabase={[]}
                    />
                </div>
            </div>
        </div>
    )
}

// ============================================
// PESTAÑA PLANIFICADOR
// ============================================
function PlannerTab({
    recipes,
    searchTerm,
    setSearchTerm,
    currentMenu,
    setCurrentMenu,
    addDishToMenu,
    removeDishFromMenu,
    moveDishUp,
    moveDishDown,
    newMenu,
    onVerify
}) {
    return (
        <div className="planner-grid">
            {/* Columna Izquierda: Buscador de Recetas */}
            <div className="planner-column">
                <div className="planner-column-header">
                    <h2>Fichas Técnicas Disponibles</h2>
                    <div className="search-box">
                        <Search size={20} />
                        <input
                            type="text"
                            placeholder="Buscar recetas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="recipe-list">
                    {recipes.length === 0 ? (
                        <div className="empty-state">
                            <p>No hay recetas disponibles</p>
                        </div>
                    ) : (
                        recipes.map(recipe => (
                            <div key={recipe.id} className="recipe-item">
                                <div className="recipe-item-info">
                                    {recipe.image && (
                                        <img
                                            src={recipe.image}
                                            alt={recipe.name}
                                            className="recipe-item-image"
                                        />
                                    )}
                                    <div>
                                        <h3>{recipe.name}</h3>
                                        <p className="recipe-category">{recipe.category}</p>
                                    </div>
                                </div>
                                <button
                                    className="btn btn-icon btn-primary"
                                    onClick={() => addDishToMenu(recipe)}
                                    title="Añadir al menú"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Columna Derecha: Menú Actual */}
            <div className="planner-column">
                <div className="planner-column-header">
                    <h2>Menú Actual</h2>
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={newMenu}
                    >
                        Nuevo Menú
                    </button>
                </div>

                {/* Cabecera del Evento */}
                <div className="menu-header-form">
                    <div className="form-group">
                        <label>Título del Evento</label>
                        <input
                            type="text"
                            placeholder="Ej: Menú Degustación Navidad"
                            value={currentMenu.title}
                            onChange={(e) => setCurrentMenu({
                                ...currentMenu,
                                title: e.target.value
                            })}
                            className="input"
                        />
                    </div>
                    <div className="form-group">
                        <label>Fecha del Servicio</label>
                        <input
                            type="date"
                            value={currentMenu.date}
                            onChange={(e) => setCurrentMenu({
                                ...currentMenu,
                                date: e.target.value
                            })}
                            className="input"
                        />
                    </div>
                </div>

                {/* Pax Input */}
                <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label>Comensales (Pax)</label>
                    <input
                        type="number"
                        min="1"
                        value={currentMenu.pax}
                        onChange={(e) => {
                            const newPax = parseInt(e.target.value) || 0
                            const updatedDishes = currentMenu.dishes.map(d => ({
                                ...d,
                                customServings: d.verified ? d.customServings : newPax // Actualizar solo si no ha sido verificado manualmente (opcional, aquí decidimos actualizar todos los no-verificados o todos por defecto)
                                // Decisión: Si cambiamos Pax del evento, sugerimos cambiar Pax de los platos no verificados.
                            }))

                            setCurrentMenu({
                                ...currentMenu,
                                pax: newPax,
                                dishes: updatedDishes
                            })
                        }}
                        className="input"
                    />
                </div>

                {/* Lista de Platos */}
                <div className="menu-dishes-list">
                    {currentMenu.dishes.length === 0 ? (
                        <div className="empty-state">
                            <Calendar size={48} />
                            <p>Añade platos desde la columna izquierda</p>
                        </div>
                    ) : (
                        currentMenu.dishes.map((dish, index) => (
                            <div key={index} className="menu-dish-item">
                                <div className="menu-dish-order">
                                    {dish.order}
                                </div>
                                <div className="menu-dish-info">
                                    {dish.recipe.image && (
                                        <img
                                            src={dish.recipe.image}
                                            alt={dish.recipe.name}
                                            className="menu-dish-image"
                                        />
                                    )}
                                    <div>
                                        <h3>{dish.recipe.name}</h3>
                                        <p className="recipe-category">{dish.recipe.category}</p>
                                        <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
                                            Pax: <strong>{dish.customServings}</strong>
                                            {dish.verified && <span style={{ marginLeft: '8px', color: 'green' }}>✓ Verificado</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="menu-dish-actions">
                                    <button
                                        className={`btn btn-icon ${dish.verified ? 'btn-success' : 'btn-secondary'}`}
                                        onClick={() => onVerify(index)}
                                        title="Verificar y Adaptar"
                                    >
                                        <Check size={18} />
                                    </button>
                                    <button
                                        className="btn btn-icon"
                                        onClick={() => moveDishUp(index)}
                                        disabled={index === 0}
                                        title="Subir"
                                    >
                                        <ChevronUp size={18} />
                                    </button>
                                    <button
                                        className="btn btn-icon"
                                        onClick={() => moveDishDown(index)}
                                        disabled={index === currentMenu.dishes.length - 1}
                                        title="Bajar"
                                    >
                                        <ChevronDown size={18} />
                                    </button>
                                    <button
                                        className="btn btn-icon btn-danger"
                                        onClick={() => removeDishFromMenu(index)}
                                        title="Eliminar"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}

// ============================================
// PESTAÑA ORDEN DE SERVICIO
// ============================================
function ServiceOrderTab({ currentMenu, settings }) {
    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="document-container">
            <div className="document-actions no-print">
                <button className="btn btn-primary" onClick={handlePrint}>
                    <Printer size={20} />
                    Imprimir
                </button>
            </div>

            <div className="printable-document service-order">
                {/* Header */}
                <div className="document-header">
                    {settings.logo && (
                        <img src={settings.logo} alt="Logo" className="document-logo" />
                    )}
                    <div className="document-title-section">
                        <h1>ORDEN DE SERVICIO</h1>
                        <h2>{currentMenu.title || 'Sin título'}</h2>
                        <p className="document-date">
                            Fecha: {new Date(currentMenu.date).toLocaleDateString('es-ES', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>
                    {settings.professorLogo && (
                        <img src={settings.professorLogo} alt="Logo Profesor" className="document-logo" />
                    )}
                </div>

                {/* Table */}
                <table className="service-order-table">
                    <thead>
                        <tr>
                            <th>Orden</th>
                            <th>Plato</th>
                            <th>Presentación</th>
                            <th>Temp.</th>
                            <th>Marcaje</th>
                            <th>Servicio</th>
                            <th>Descripción al Cliente</th>
                            <th>Tiempo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentMenu.dishes.map((dish, index) => (
                            <tr key={index}>
                                <td className="text-center">{dish.order}º</td>
                                <td><strong>{dish.recipe.name}</strong></td>
                                <td>{dish.recipe.presentation || '-'}</td>
                                <td className="text-center">{dish.recipe.temperature || '-'}</td>
                                <td>{dish.recipe.cutlery || '-'}</td>
                                <td>{dish.recipe.serviceType || '-'}</td>
                                <td className="description-cell">{dish.recipe.clientDescription || '-'}</td>
                                <td className="text-center">{dish.recipe.serviceTime ? `${dish.recipe.serviceTime} min` : '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Footer */}
                <div className="document-footer">
                    <p>
                        <strong>Chef:</strong> {settings.chefName || settings.professorName || '___________________'}
                    </p>
                    <p>
                        <strong>Total de platos:</strong> {currentMenu.dishes.length}
                    </p>
                </div>
            </div>
        </div>
    )
}

// ============================================
// PESTAÑA MATRIZ DE ALÉRGENOS
// ============================================
function AllergenMatrixTab({ currentMenu, settings }) {
    // Lista oficial de 14 alérgenos
    const allergens = [
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

    // Calcular alérgenos por plato
    const calculateAllergens = (recipe) => {
        const allergenSet = new Set()

        // Función recursiva para procesar ingredientes y sub-recetas
        const processIngredients = (ingredients) => {
            if (!ingredients) return

            ingredients.forEach(ing => {
                // Si es una sub-receta, procesar sus ingredientes
                if (ing.isSubRecipe && ing.subRecipe) {
                    processIngredients(ing.subRecipe.ingredients)
                }

                // Procesar alérgenos del producto
                if (ing.product && ing.product.allergens) {
                    ing.product.allergens.forEach(allergen => {
                        allergenSet.add(allergen)
                    })
                }
            })
        }

        processIngredients(recipe.ingredients)
        return Array.from(allergenSet)
    }

    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="document-container">
            <div className="document-actions no-print">
                <button className="btn btn-primary" onClick={handlePrint}>
                    <Printer size={20} />
                    Imprimir
                </button>
            </div>

            <div className="printable-document allergen-matrix">
                {/* Header */}
                <div className="document-header">
                    {settings.logo && (
                        <img src={settings.logo} alt="Logo" className="document-logo" />
                    )}
                    <div className="document-title-section">
                        <h1>MATRIZ DE ALÉRGENOS</h1>
                        <h2>{currentMenu.title || 'Sin título'}</h2>
                        <p className="document-date">
                            Fecha: {new Date(currentMenu.date).toLocaleDateString('es-ES', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>
                    {settings.professorLogo && (
                        <img src={settings.professorLogo} alt="Logo Profesor" className="document-logo" />
                    )}
                </div>

                {/* Table */}
                <div className="allergen-table-wrapper">
                    <table className="allergen-matrix-table">
                        <thead>
                            <tr>
                                <th className="dish-column">Plato</th>
                                {allergens.map(allergen => (
                                    <th key={allergen.id} className="allergen-column">
                                        <div className="allergen-header">
                                            <span className="allergen-icon">{allergen.icon}</span>
                                            <span className="allergen-name">{allergen.name}</span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {currentMenu.dishes.map((dish, index) => {
                                const dishAllergens = calculateAllergens(dish.recipe)
                                return (
                                    <tr key={index}>
                                        <td className="dish-name">
                                            <strong>{dish.order}.</strong> {dish.recipe.name}
                                        </td>
                                        {allergens.map(allergen => (
                                            <td key={allergen.id} className="allergen-cell">
                                                {dishAllergens.includes(allergen.id) ? (
                                                    <span className="allergen-mark">✗</span>
                                                ) : (
                                                    <span className="allergen-empty">-</span>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Legend */}
                <div className="allergen-legend">
                    <h3>Leyenda de Alérgenos</h3>
                    <div className="allergen-legend-grid">
                        {allergens.map(allergen => (
                            <div key={allergen.id} className="allergen-legend-item">
                                <span className="allergen-icon">{allergen.icon}</span>
                                <span>{allergen.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Legal Disclaimer */}
                <div className="document-footer allergen-disclaimer">
                    <p>
                        <strong>AVISO IMPORTANTE:</strong> Esta matriz ha sido elaborada con la información disponible
                        de los proveedores. Si tiene alguna alergia o intolerancia alimentaria, por favor consulte con
                        el personal de sala antes de consumir cualquier plato. No podemos garantizar la ausencia total
                        de trazas de alérgenos debido a la manipulación en cocina.
                    </p>
                    <p className="legal-text">
                        Reglamento (UE) Nº 1169/2011 sobre información alimentaria facilitada al consumidor.
                    </p>
                </div>
            </div>
        </div>
    )
}
// ============================================
// PESTAÑA PEDIDO GENERAL
// ============================================
function OrderTab({ currentMenu, setCurrentMenu, settings, productDatabase }) {
    // 1. Calcular ingredientes agregados
    const aggregatedIngredients = useMemo(() => {
        const ingredientsMap = {} // Key: "productName-unit" -> {...data, quantity}
        const excludedItems = []

        currentMenu.dishes.forEach(dish => {
            const scaleFactor = dish.customServings / (dish.recipe.yield?.amount || 1)

            // Recorrer elaboraciones e ingredientes
            const processIngredients = (ingredients) => {
                if (!ingredients) return

                ingredients.forEach(ing => {
                    if (ing.isSubRecipe && ing.subRecipe) {
                        processIngredients(ing.subRecipe.ingredients)
                        return
                    }

                    const productName = ing.product
                    // Cantidad bruta (considerando mermas)
                    const netQty = parseFloat(ing.quantity) || 0
                    const waste = parseFloat(ing.waste) || 0
                    const grossQty = waste < 100 ? netQty / (1 - (waste / 100)) : netQty

                    const scaledQty = grossQty * scaleFactor

                    // Identificar categoría (usando la DB o 'Excluidos' si no existe)
                    // IMPORTANTE: En una app real, productDatabase debería venir lleno.
                    // Aquí simularemos una búsqueda básica o usaremos 'Otros'
                    let category = 'Otros' // Default
                    if (ing.productData && ing.productData.category) {
                        category = ing.productData.category
                    } else {
                        // Intento simple de categorización por nombre si no hay data
                        // (Esto es mejorable con la DB real)
                    }

                    const key = `${productName.toLowerCase()}-${ing.unit.toLowerCase()}`

                    if (ingredientsMap[key]) {
                        ingredientsMap[key].quantity += scaledQty
                    } else {
                        ingredientsMap[key] = {
                            name: productName,
                            unit: ing.unit,
                            quantity: scaledQty,
                            category: category, // TODO: Mejorar categorización real
                            checked: false // TODO: Estado checked local o persistido?
                        }
                    }
                })
            }

            dish.recipe.elaborations.forEach(elab => {
                processIngredients(elab.ingredients)
            })
        })

        // Convertir mapa a array y agrupar por categorías
        const grouped = {}
        Object.values(ingredientsMap).forEach(item => {
            if (!grouped[item.category]) {
                grouped[item.category] = []
            }
            grouped[item.category].push(item)
        })

        // Ordenar categorías
        return grouped

    }, [currentMenu.dishes])

    const [manualItemName, setManualItemName] = useState('')
    const [manualItemQty, setManualItemQty] = useState('')
    const [manualItemUnit, setManualItemUnit] = useState('ud')

    const addManualItem = () => {
        if (!manualItemName) return
        const newItem = {
            id: Date.now(),
            name: manualItemName,
            quantity: parseFloat(manualItemQty) || 1,
            unit: manualItemUnit,
            category: 'Manual / Extra',
            checked: false
        }
        setCurrentMenu({
            ...currentMenu,
            manualItems: [...(currentMenu.manualItems || []), newItem]
        })
        setManualItemName('')
        setManualItemQty('')
    }

    const removeManualItem = (id) => {
        setCurrentMenu({
            ...currentMenu,
            manualItems: currentMenu.manualItems.filter(i => i.id !== id)
        })
    }

    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="document-container">
            <div className="document-actions no-print">
                <button className="btn btn-primary" onClick={handlePrint}>
                    <Printer size={20} />
                    Imprimir Pedido
                </button>
            </div>

            <div className="printable-document order-list">
                {/* Header */}
                <div className="document-header">
                    <div className="document-title-section">
                        <h1>PEDIDO DE GÉNEROS</h1>
                        <h2>{currentMenu.title || 'Sin título'} - {currentMenu.pax} Pax</h2>
                        <p className="document-date">Fecha: {new Date().toLocaleDateString()}</p>
                    </div>
                </div>

                <div className="order-content">
                    {/* Generados Automáticamente (Agrupados) */}
                    {Object.entries(aggregatedIngredients).map(([category, items]) => (
                        <div key={category} className="order-category-section">
                            <h3 className="order-category-title">{category}</h3>
                            <div className="order-items-grid">
                                {items.map((item, idx) => (
                                    <div key={idx} className="order-item-row">
                                        <div className="checkbox-circle"></div>
                                        <span className="item-name">{item.name}</span>
                                        <span className="item-qty">{item.quantity.toFixed(2)} {item.unit}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Manuales */}
                    <div className="order-category-section manual-section">
                        <h3 className="order-category-title">Extras / Manuales</h3>
                        <div className="manual-input-row no-print">
                            <input
                                type="text"
                                placeholder="Producto..."
                                value={manualItemName}
                                onChange={e => setManualItemName(e.target.value)}
                                className="input-sm"
                            />
                            <input
                                type="number"
                                placeholder="Cant."
                                value={manualItemQty}
                                onChange={e => setManualItemQty(e.target.value)}
                                className="input-sm qty-input"
                            />
                            <select
                                value={manualItemUnit}
                                onChange={e => setManualItemUnit(e.target.value)}
                                className="select-sm"
                            >
                                <option value="ud">ud</option>
                                <option value="kg">kg</option>
                                <option value="l">l</option>
                            </select>
                            <button onClick={addManualItem} className="btn btn-sm btn-primary">
                                <Plus size={16} />
                            </button>
                        </div>
                        <div className="order-items-grid">
                            {currentMenu.manualItems && currentMenu.manualItems.map(item => (
                                <div key={item.id} className="order-item-row">
                                    <div className="checkbox-circle"></div>
                                    <span className="item-name">{item.name}</span>
                                    <span className="item-qty">{item.quantity} {item.unit}</span>
                                    <button
                                        onClick={() => removeManualItem(item.id)}
                                        className="btn-icon-danger no-print"
                                        style={{ marginLeft: 'auto' }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <style jsx>{`
                .order-category-section {
                    margin-bottom: 2rem;
                    page-break-inside: avoid;
                }
                .order-category-title {
                    font-size: 1.2rem;
                    font-weight: bold;
                    border-bottom: 2px solid #000;
                    margin-bottom: 1rem;
                    text-transform: uppercase;
                }
                .order-items-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 0.5rem 2rem;
                }
                .order-item-row {
                    display: flex;
                    align-items: center;
                    padding: 0.25rem 0;
                    border-bottom: 1px dotted #ccc;
                }
                .checkbox-circle {
                    width: 16px;
                    height: 16px;
                    border: 1px solid #000;
                    border-radius: 50%;
                    margin-right: 10px;
                }
                .item-name {
                    font-weight: 500;
                    flex: 1;
                }
                .item-qty {
                    font-weight: bold;
                    white-space: nowrap;
                }
                .manual-input-row {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                    padding: 1rem;
                    background: #f0f9ff;
                    border-radius: 8px;
                }
                .input-sm { padding: 0.25rem 0.5rem; border: 1px solid #ccc; border-radius: 4px; }
                .qty-input { width: 80px; }
                .select-sm { padding: 0.25rem; border: 1px solid #ccc; border-radius: 4px; }
            `}</style>
        </div>
    )
}
