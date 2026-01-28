import { useState, useEffect } from 'react'
import {
    X, Save, Plus, Trash2, Image as ImageIcon, Shield, Search,
    ChefHat, Utensils, Clock, Thermometer, Users, Globe, Lock
} from 'lucide-react'
import {
    createElaboration, CATEGORIES, UNITS, SERVICE_TYPES,
    searchProducts, learnNewProduct
} from '../utils/dataModels'
import { AllergenModal } from './AllergenModal'

export function EditorView({ recipe, productDatabase, onSave, onCancel, onUpdateProductDatabase, settings, user }) {
    const [formData, setFormData] = useState(recipe)
    const [activeElaborationIndex, setActiveElaborationIndex] = useState(0)
    const [allergenModalOpen, setAllergenModalOpen] = useState(false)
    const [currentIngredientIndex, setCurrentIngredientIndex] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])

    // Buscar productos mientras se escribe
    useEffect(() => {
        if (searchQuery.length >= 2) {
            const results = searchProducts(searchQuery, productDatabase)
            setSearchResults(results)
        } else {
            setSearchResults([])
        }
    }, [searchQuery, productDatabase])

    const handleImageUpload = (e, type = 'final') => {
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                if (type === 'final') {
                    setFormData({ ...formData, finalImage: reader.result })
                } else {
                    // Imagen de elaboración específica
                    const updatedElaborations = [...formData.elaborations]
                    updatedElaborations[activeElaborationIndex].image = reader.result
                    setFormData({ ...formData, elaborations: updatedElaborations })
                }
            }
            reader.readAsDataURL(file)
        }
    }

    const addElaboration = () => {
        setFormData({
            ...formData,
            elaborations: [...formData.elaborations, createElaboration(`Nueva Elaboración ${formData.elaborations.length + 1}`)]
        })
        setActiveElaborationIndex(formData.elaborations.length)
    }

    const removeElaboration = (index) => {
        if (formData.elaborations.length === 1) {
            alert('Debe haber al menos una elaboración')
            return
        }
        const updatedElaborations = formData.elaborations.filter((_, i) => i !== index)
        setFormData({ ...formData, elaborations: updatedElaborations })
        if (activeElaborationIndex >= updatedElaborations.length) {
            setActiveElaborationIndex(updatedElaborations.length - 1)
        }
    }

    const updateElaborationName = (index, name) => {
        const updatedElaborations = [...formData.elaborations]
        updatedElaborations[index].name = name
        setFormData({ ...formData, elaborations: updatedElaborations })
    }

    const addIngredient = (productData = null) => {
        const elaborations = [...formData.elaborations]
        const newIngredient = {
            id: Date.now() + Math.random(),
            product: productData?.name || searchQuery || '',
            quantity: '',
            unit: productData?.unit || 'kg',
            allergens: productData?.allergens || [],
            waste: productData?.waste || 0
        }

        elaborations[activeElaborationIndex].ingredients.push(newIngredient)
        setFormData({ ...formData, elaborations })
        setSearchQuery('')
        setSearchResults([])

        // Auto-aprendizaje: Si es un producto nuevo, añadirlo a la base de datos
        if (!productData && searchQuery) {
            const newProduct = learnNewProduct(searchQuery, 'kg', [])
            onUpdateProductDatabase([...productDatabase, newProduct])
        }
    }

    const removeIngredient = (ingredientId) => {
        const elaborations = [...formData.elaborations]
        elaborations[activeElaborationIndex].ingredients =
            elaborations[activeElaborationIndex].ingredients.filter(ing => ing.id !== ingredientId)
        setFormData({ ...formData, elaborations })
    }

    const updateIngredient = (ingredientId, field, value) => {
        const elaborations = [...formData.elaborations]
        const ingredient = elaborations[activeElaborationIndex].ingredients.find(ing => ing.id === ingredientId)
        if (ingredient) {
            ingredient[field] = value
            setFormData({ ...formData, elaborations })
        }
    }

    const openAllergenModal = (ingredientIndex) => {
        setCurrentIngredientIndex(ingredientIndex)
        setAllergenModalOpen(true)
    }

    const toggleAllergen = (allergenId) => {
        const elaborations = [...formData.elaborations]
        const ingredient = elaborations[activeElaborationIndex].ingredients[currentIngredientIndex]

        if (ingredient.allergens.includes(allergenId)) {
            ingredient.allergens = ingredient.allergens.filter(a => a !== allergenId)
        } else {
            ingredient.allergens = [...ingredient.allergens, allergenId]
        }

        setFormData({ ...formData, elaborations })
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!formData.name.trim()) {
            alert('Por favor, ingresa un nombre para la receta')
            return
        }

        // Auto-aprendizaje final: Revisar todos los ingredientes
        const newProducts = []
        formData.elaborations.forEach(elab => {
            elab.ingredients.forEach(ing => {
                const exists = productDatabase.find(p => p.name.toLowerCase() === ing.product.toLowerCase())
                if (!exists && ing.product.trim()) {
                    newProducts.push(learnNewProduct(ing.product, ing.unit, ing.allergens))
                }
            })
        })

        if (newProducts.length > 0) {
            onUpdateProductDatabase([...productDatabase, ...newProducts])
        }

        onSave({
            ...formData,
            updatedAt: new Date().toISOString(),
            authorId: user?.id || formData.authorId,
            authorName: user?.user_metadata?.full_name || formData.authorName
        })
    }

    const currentElaboration = formData.elaborations[activeElaborationIndex]

    return (
        <div className="editor-view">
            <div className="editor-header no-print">
                <div className="container">
                    <div className="header-content">
                        <h1 className="text-2xl font-bold">
                            {recipe?.id ? 'Editar Ficha Técnica' : 'Nueva Ficha Técnica'}
                        </h1>
                        <div className="header-actions">
                            {user && (
                                <label className="publish-toggle">
                                    <input
                                        type="checkbox"
                                        checked={formData.isPublished || false}
                                        onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                                    />
                                    <span className="toggle-icon">
                                        {formData.isPublished ? <Globe size={18} /> : <Lock size={18} />}
                                    </span>
                                    <span className="toggle-label">
                                        {formData.isPublished ? 'Publicada' : 'Privada'}
                                    </span>
                                </label>
                            )}
                            <button onClick={onCancel} className="btn btn-ghost">
                                <X size={20} />
                                Cancelar
                            </button>
                            <button onClick={handleSubmit} className="btn btn-success">
                                <Save size={20} />
                                Guardar Ficha
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="editor-main">
                <div className="container">
                    <form onSubmit={handleSubmit} className="editor-form">
                        {/* SECCIÓN 1: DATOS GENERALES */}
                        <div className="card">
                            <h2 className="section-title">
                                <ChefHat size={24} />
                                Datos Generales
                            </h2>

                            <div className="form-grid">
                                <div className="form-group span-2">
                                    <label className="form-label">Foto Final del Plato</label>
                                    <div className="image-upload">
                                        {formData.finalImage ? (
                                            <div className="image-preview">
                                                <img src={formData.finalImage} alt="Preview" />
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, finalImage: null })}
                                                    className="btn btn-danger btn-sm image-remove"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="image-upload-label">
                                                <ImageIcon size={48} />
                                                <span>Click para subir foto final</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleImageUpload(e, 'final')}
                                                    style={{ display: 'none' }}
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Nombre del Plato *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ej: Solomillo al Foie"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Categoría</label>
                                    <select
                                        className="form-select"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Rendimiento (Cantidad)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.yield.amount}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            yield: { ...formData.yield, amount: parseInt(e.target.value) || 1 }
                                        })}
                                        min="1"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Unidad</label>
                                    <select
                                        className="form-select"
                                        value={formData.yield.unit}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            yield: { ...formData.yield, unit: e.target.value }
                                        })}
                                    >
                                        <option value="Raciones">Raciones</option>
                                        <option value="Personas">Personas</option>
                                        <option value="Unidades">Unidades</option>
                                        <option value="kg">kg</option>
                                        <option value="l">l</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* SECCIÓN 2: ELABORACIONES (PESTAÑAS) */}
                        <div className="card">
                            <div className="elaborations-header">
                                <h2 className="section-title">
                                    <Utensils size={24} />
                                    Elaboraciones
                                </h2>
                                <button
                                    type="button"
                                    onClick={addElaboration}
                                    className="btn btn-primary btn-sm"
                                >
                                    <Plus size={16} />
                                    Nueva Elaboración
                                </button>
                            </div>

                            {/* Pestañas */}
                            <div className="elaboration-tabs">
                                {formData.elaborations.map((elab, index) => (
                                    <div key={elab.id} className="tab-wrapper">
                                        <button
                                            type="button"
                                            className={`elaboration-tab ${index === activeElaborationIndex ? 'active' : ''}`}
                                            onClick={() => setActiveElaborationIndex(index)}
                                        >
                                            <input
                                                type="text"
                                                value={elab.name}
                                                onChange={(e) => {
                                                    e.stopPropagation()
                                                    updateElaborationName(index, e.target.value)
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                className="tab-name-input"
                                            />
                                        </button>
                                        {formData.elaborations.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeElaboration(index)}
                                                className="tab-remove"
                                                title="Eliminar elaboración"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Contenido de la elaboración activa */}
                            <div className="elaboration-content">
                                {/* Foto específica de la elaboración */}
                                <div className="form-group">
                                    <label className="form-label">Foto de esta Elaboración (Opcional)</label>
                                    <div className="image-upload-small">
                                        {currentElaboration.image ? (
                                            <div className="image-preview-small">
                                                <img src={currentElaboration.image} alt="Elaboración" />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const elaborations = [...formData.elaborations]
                                                        elaborations[activeElaborationIndex].image = null
                                                        setFormData({ ...formData, elaborations })
                                                    }}
                                                    className="btn btn-danger btn-sm"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="image-upload-label-small">
                                                <ImageIcon size={24} />
                                                <span>Subir foto</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleImageUpload(e, 'elaboration')}
                                                    style={{ display: 'none' }}
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                {/* Ingredientes con búsqueda inteligente */}
                                <div className="ingredients-section">
                                    <h3 className="subsection-title">Géneros (Ingredientes)</h3>

                                    <div className="ingredient-search">
                                        <div className="search-input-wrapper">
                                            <Search size={20} />
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="Buscar producto... (ej: tomate, cebolla)"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault()
                                                        if (searchResults.length > 0) {
                                                            addIngredient(searchResults[0])
                                                        } else if (searchQuery.trim()) {
                                                            addIngredient()
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>

                                        {searchResults.length > 0 && (
                                            <div className="search-results">
                                                {searchResults.map((product, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        className="search-result-item"
                                                        onClick={() => addIngredient(product)}
                                                    >
                                                        <span className="result-name">{product.name}</span>
                                                        <span className="result-unit">{product.unit}</span>
                                                        {product.allergens?.length > 0 && (
                                                            <span className="result-allergens">
                                                                {product.allergens.length} alérgenos
                                                            </span>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {searchQuery.length >= 2 && searchResults.length === 0 && (
                                            <div className="search-no-results">
                                                <p>No se encontró "{searchQuery}"</p>
                                                <button
                                                    type="button"
                                                    onClick={() => addIngredient()}
                                                    className="btn btn-sm btn-secondary"
                                                >
                                                    <Plus size={16} />
                                                    Añadir como nuevo producto
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Lista de ingredientes */}
                                    <div className="ingredients-list">
                                        {currentElaboration.ingredients.map((ing, ingIndex) => (
                                            <div key={ing.id} className="ingredient-row">
                                                <span className="ingredient-number">{ingIndex + 1}</span>

                                                <input
                                                    type="text"
                                                    className="form-input ingredient-product"
                                                    value={ing.product}
                                                    onChange={(e) => updateIngredient(ing.id, 'product', e.target.value)}
                                                    placeholder="Producto"
                                                />

                                                <input
                                                    type="number"
                                                    className="form-input ingredient-quantity"
                                                    value={ing.quantity}
                                                    onChange={(e) => updateIngredient(ing.id, 'quantity', e.target.value)}
                                                    placeholder="Cant."
                                                    step="0.01"
                                                />

                                                <select
                                                    className="form-select ingredient-unit"
                                                    value={ing.unit}
                                                    onChange={(e) => updateIngredient(ing.id, 'unit', e.target.value)}
                                                >
                                                    {UNITS.map(unit => (
                                                        <option key={unit} value={unit}>{unit}</option>
                                                    ))}
                                                </select>

                                                <div className="ingredient-waste-input">
                                                    <input
                                                        type="number"
                                                        className="form-input"
                                                        value={ing.waste || 0}
                                                        onChange={(e) => updateIngredient(ing.id, 'waste', parseFloat(e.target.value) || 0)}
                                                        placeholder="% M."
                                                        min="0"
                                                        max="99"
                                                    />
                                                    <span className="waste-unit">% M.</span>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => openAllergenModal(ingIndex)}
                                                    className="btn btn-ghost btn-icon allergen-btn"
                                                    title="Gestionar alérgenos"
                                                >
                                                    <Shield size={18} className={ing.allergens?.length > 0 ? 'has-allergens' : ''} />
                                                    {ing.allergens?.length > 0 && (
                                                        <span className="allergen-count">{ing.allergens.length}</span>
                                                    )}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => removeIngredient(ing.id)}
                                                    className="btn btn-ghost btn-icon"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Proceso de elaboración */}
                                <div className="form-group">
                                    <label className="form-label">Proceso de Elaboración</label>
                                    <textarea
                                        className="form-textarea"
                                        value={currentElaboration.process}
                                        onChange={(e) => {
                                            const elaborations = [...formData.elaborations]
                                            elaborations[activeElaborationIndex].process = e.target.value
                                            setFormData({ ...formData, elaborations })
                                        }}
                                        placeholder="Describe paso a paso el proceso de esta elaboración..."
                                        rows="6"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* SECCIÓN 3: MONTAJE Y EMPLATADO */}
                        <div className="card">
                            <h2 className="section-title">
                                <Utensils size={24} />
                                Montaje y Emplatado
                            </h2>

                            <div className="form-group">
                                <label className="form-label">Descripción del Montaje</label>
                                <textarea
                                    className="form-textarea"
                                    value={formData.plating}
                                    onChange={(e) => setFormData({ ...formData, plating: e.target.value })}
                                    placeholder="Explica cómo se ensamblan las elaboraciones y cómo se emplata el plato..."
                                    rows="4"
                                />
                            </div>
                        </div>

                        {/* SECCIÓN 4: DATOS DE SERVICIO */}
                        <div className="card">
                            <h2 className="section-title">
                                <Clock size={24} />
                                Datos de Servicio
                            </h2>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">
                                        <Thermometer size={16} />
                                        Temperatura
                                    </label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.serviceDetails.temperature}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            serviceDetails: { ...formData.serviceDetails, temperature: e.target.value }
                                        })}
                                        placeholder="Ej: 65ºC"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        <Clock size={16} />
                                        Tiempo de Pase
                                    </label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.serviceDetails.passTime}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            serviceDetails: { ...formData.serviceDetails, passTime: e.target.value }
                                        })}
                                        placeholder="Ej: 12 min"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Marcaje/Cubiertos</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.serviceDetails.cutlery}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            serviceDetails: { ...formData.serviceDetails, cutlery: e.target.value }
                                        })}
                                        placeholder="Ej: Cuchillo de carne"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Tipo de Servicio</label>
                                    <select
                                        className="form-select"
                                        value={formData.serviceDetails.serviceType}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            serviceDetails: { ...formData.serviceDetails, serviceType: e.target.value }
                                        })}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {SERVICE_TYPES.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group span-2">
                                    <label className="form-label">Notas Visuales</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.serviceDetails.visualNotes}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            serviceDetails: { ...formData.serviceDetails, visualNotes: e.target.value }
                                        })}
                                        placeholder="Ej: Altura en el centro, decoración con microgreens"
                                    />
                                </div>

                                <div className="form-group span-2">
                                    <label className="form-label">Descripción Comercial</label>
                                    <textarea
                                        className="form-textarea"
                                        value={formData.serviceDetails.commercialDescription}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            serviceDetails: { ...formData.serviceDetails, commercialDescription: e.target.value }
                                        })}
                                        placeholder="Texto sugerente para la carta o para que el camarero lo explique al cliente..."
                                        rows="3"
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* Modal de Alérgenos */}
            <AllergenModal
                isOpen={allergenModalOpen}
                onClose={() => setAllergenModalOpen(false)}
                selectedAllergens={
                    currentIngredientIndex !== null && currentElaboration.ingredients[currentIngredientIndex]
                        ? currentElaboration.ingredients[currentIngredientIndex].allergens
                        : []
                }
                onToggleAllergen={toggleAllergen}
            />

            <style jsx>{`
        .editor-view {
          min-height: 100vh;
          background: var(--color-bg-primary);
        }

        .editor-header {
          background: white;
          border-bottom: 1px solid var(--color-border);
          padding: var(--spacing-lg) 0;
          position: sticky;
          top: 0;
          z-index: 100;
          backdrop-filter: blur(10px);
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .header-actions {
          display: flex;
          gap: var(--spacing-sm);
        }

        .editor-main {
          padding: var(--spacing-2xl) 0;
        }

        .editor-form {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xl);
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          font-size: var(--font-size-xl);
          font-weight: 700;
          margin-bottom: var(--spacing-lg);
          color: var(--color-text-primary);
        }

        .subsection-title {
          font-size: var(--font-size-lg);
          font-weight: 600;
          margin-bottom: var(--spacing-md);
          color: var(--color-text-primary);
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--spacing-lg);
        }

        .span-2 {
          grid-column: span 2;
        }

        @media (max-width: 768px) {
          .span-2 {
            grid-column: span 1;
          }
        }

        /* Elaboraciones */
        .elaborations-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--spacing-lg);
        }

        .elaboration-tabs {
          display: flex;
          gap: var(--spacing-xs);
          margin-bottom: var(--spacing-xl);
          overflow-x: auto;
          padding-bottom: var(--spacing-sm);
        }

        .tab-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .elaboration-tab {
          padding: var(--spacing-md) var(--spacing-lg);
          background: var(--color-bg-secondary);
          border: 2px solid var(--color-border);
          border-bottom: none;
          border-radius: var(--radius-md) var(--radius-md) 0 0;
          cursor: pointer;
          transition: all var(--transition-base);
          white-space: nowrap;
        }

        .elaboration-tab.active {
          background: white;
          border-color: var(--color-primary);
          transform: translateY(2px);
        }

        .tab-name-input {
          background: transparent;
          border: none;
          outline: none;
          color: var(--color-text-primary);
          font-weight: 600;
          font-size: var(--font-size-sm);
          min-width: 120px;
        }

        .tab-remove {
          position: absolute;
          top: -6px;
          right: -6px;
          width: 20px;
          height: 20px;
          background: var(--color-error);
          color: white;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity var(--transition-fast);
        }

        .tab-wrapper:hover .tab-remove {
          opacity: 1;
        }

        .elaboration-content {
          padding: var(--spacing-xl);
          background: white;
          border: 2px solid var(--color-primary);
          border-radius: 0 var(--radius-lg) var(--radius-lg) var(--radius-lg);
        }

        /* Búsqueda de ingredientes */
        .ingredients-section {
          margin: var(--spacing-xl) 0;
        }

        .ingredient-search {
          position: relative;
          margin-bottom: var(--spacing-lg);
        }

        .search-input-wrapper {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          background: white;
          border: 2px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 0 var(--spacing-md);
        }

        .search-input-wrapper:focus-within {
          border-color: var(--color-primary);
        }

        .search-results {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 2px solid var(--color-primary);
          border-radius: var(--radius-md);
          margin-top: var(--spacing-xs);
          max-height: 300px;
          overflow-y: auto;
          z-index: 10;
          box-shadow: var(--shadow-lg);
        }

        .search-result-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-md);
          background: transparent;
          border: none;
          border-bottom: 1px solid var(--color-border);
          width: 100%;
          text-align: left;
          cursor: pointer;
          transition: background var(--transition-fast);
        }

        .search-result-item:hover {
          background: var(--color-bg-hover);
        }

        .result-name {
          flex: 1;
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .result-unit {
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
        }

        .result-allergens {
          color: var(--color-warning);
          font-size: var(--font-size-xs);
        }

        .search-no-results {
          padding: var(--spacing-lg);
          text-align: center;
          color: var(--color-text-secondary);
        }

        /* Lista de ingredientes */
        .ingredients-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .ingredient-row {
          display: grid;
          grid-template-columns: auto 2fr 1fr 120px 100px auto auto;
          gap: var(--spacing-sm);
          align-items: center;
        }

        .ingredient-waste-input {
          display: flex;
          align-items: center;
          background: white;
          border-radius: var(--radius-md);
          padding-right: var(--spacing-xs);
          border: 1px solid var(--color-border);
          height: 40px;
        }

        .ingredient-waste-input input {
          border: none;
          background: transparent;
          width: 45px;
          text-align: right;
          padding: 0 4px;
          font-family: monospace;
          font-weight: 600;
          font-size: var(--font-size-sm);
        }

        .waste-unit {
          font-size: 10px;
          color: var(--color-text-muted);
          font-weight: bold;
          white-space: nowrap;
        }

        .ingredient-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: var(--color-primary);
          color: white;
          border-radius: 50%;
          font-weight: 600;
          font-size: var(--font-size-sm);
        }

        .allergen-btn {
          position: relative;
        }

        .allergen-btn .has-allergens {
          color: var(--color-warning);
        }

        .allergen-count {
          position: absolute;
          top: -4px;
          right: -4px;
          background: var(--color-warning);
          color: white;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          font-size: 10px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Imágenes */
        .image-upload {
          margin-top: var(--spacing-sm);
        }

        .image-upload-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-md);
          padding: var(--spacing-2xl);
          background: white;
          border: 2px dashed var(--color-border);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all var(--transition-base);
          color: var(--color-text-muted);
        }

        .image-upload-label:hover {
          border-color: var(--color-primary);
          color: var(--color-primary);
        }

        .image-preview {
          position: relative;
          width: 100%;
          max-width: 500px;
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        .image-preview img {
          width: 100%;
          height: auto;
          display: block;
        }

        .image-remove {
          position: absolute;
          top: var(--spacing-sm);
          right: var(--spacing-sm);
        }

        .image-upload-small {
          max-width: 300px;
        }

        .image-preview-small {
          position: relative;
          width: 100%;
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .image-preview-small img {
          width: 100%;
          height: auto;
          display: block;
        }

        .image-upload-label-small {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-md);
          background: var(--color-bg-tertiary);
          border: 1px dashed var(--color-border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-base);
          color: var(--color-text-muted);
          font-size: var(--font-size-sm);
        }

        .image-upload-label-small:hover {
          border-color: var(--color-primary);
          color: var(--color-primary);
        }

        @media (max-width: 768px) {
          .ingredient-row {
            grid-template-columns: auto 1fr auto;
            gap: var(--spacing-xs);
          }

          .ingredient-product {
            grid-column: 2 / 4;
          }

          .ingredient-quantity,
          .ingredient-unit {
            grid-column: 2 / 3;
          }

          .header-content {
            flex-direction: column;
            gap: var(--spacing-md);
            align-items: stretch;
          }

          .header-actions {
            justify-content: stretch;
          }

          .header-actions button {
            flex: 1;
          }
        }
      `}</style>
        </div>
    )
}
