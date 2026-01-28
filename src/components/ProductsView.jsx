import React, { useState } from 'react'
import {
  ChevronDown, ChevronUp, Layers, Package, Tag, Filter,
  Lock, Unlock, ShieldCheck
} from 'lucide-react'

export function ProductsView({ products, onAddProduct, onUpdateProduct, onDeleteProduct, onImportProducts, onNavigate, settings, isAdminAuthenticated, setIsAdminAuthenticated }) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [isCustomCategory, setIsCustomCategory] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState({})
  const [showPinModal, setShowPinModal] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)

  const isLocked = settings.pinEnabled && !isAdminAuthenticated

  const handleUnlock = (e) => {
    e.preventDefault()
    if (pinInput === settings.adminPin) {
      setIsAdminAuthenticated(true)
      setShowPinModal(false)
      setPinInput('')
      setPinError(false)
    } else {
      setPinError(true)
      setPinInput('')
      setTimeout(() => setPinError(false), 2000)
    }
  }

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unit: 'kg',
    pricePerUnit: '',
    supplier: '',
    allergens: []
  })

  // Obtener categorías únicas actuales
  const uniqueCategories = Array.from(new Set(products.map(p => p.category || 'General'))).sort()

  const toggleCategory = (cat) => {
    setExpandedCategories(prev => ({
      ...prev,
      [cat]: !prev[cat]
    }))
  }

  const ALLERGEN_MAP = {
    'GLUT': 'Gluten',
    'LAC': 'Lácteos',
    'HUE': 'Huevos',
    'PES': 'Pescado',
    'CRU': 'Crustáceos',
    'FRU': 'Frutos de cáscara',
    'CAC': 'Cacahuetes',
    'SOJ': 'Soja',
    'API': 'Apio',
    'MOS': 'Mostaza',
    'SES': 'Sésamo',
    'SUL': 'Sulfitos',
    'ALT': 'Altramuces',
    'MOL': 'Moluscos'
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingId) {
      onUpdateProduct(editingId, formData)
      setEditingId(null)
    } else {
      onAddProduct(formData)
      setIsAdding(false)
    }
    setIsCustomCategory(false)
    setFormData({ name: '', category: '', unit: 'kg', pricePerUnit: '', supplier: '', allergens: [] })
  }

  const handleEdit = (product) => {
    setFormData(product)
    setEditingId(product.id)
    setIsAdding(true)
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
    setIsCustomCategory(false)
    setFormData({ name: '', category: '', unit: 'kg', pricePerUnit: '', supplier: '', allergens: [] })
  }

  const importProductsFromJSON = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedProducts = JSON.parse(e.target.result)

          // Fusión inteligente: actualiza existentes, añade nuevos
          const productMap = new Map(products.map(p => [p.id, p]))

          let added = 0
          let updated = 0

          importedProducts.forEach(newProduct => {
            if (productMap.has(newProduct.id)) {
              productMap.set(newProduct.id, { ...productMap.get(newProduct.id), ...newProduct })
              updated++
            } else {
              productMap.set(newProduct.id, newProduct)
              added++
            }
          })

          const mergedProducts = Array.from(productMap.values())

          if (onImportProducts) {
            onImportProducts(mergedProducts)
            alert(`✅ Importación completada:\n- ${added} productos añadidos\n- ${updated} productos actualizados\n- Total: ${mergedProducts.length} productos`)
          }
        } catch (error) {
          alert('❌ Error al importar productos: ' + error.message)
        }
      }
      reader.readAsText(file)
    }
  }

  const importProductsFromCSV = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const text = e.target.result
          const lines = text.split('\n')
          const importedProducts = []

          // Familia,Nombre,Precio (€),Unidad,Alergenos
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim()
            if (!line) continue

            const parts = line.split(',')
            if (parts.length < 3) continue

            const category = parts[0]?.trim()
            const name = parts[1]?.trim()
            const priceStr = parts[2]?.trim() || "0"
            const unit = parts[3]?.trim() || "kg"
            const allergensStr = parts[4]?.trim() || ""

            if (!name || isNaN(parseFloat(priceStr.replace('€', '').trim()))) continue

            // Mapear alérgenos (soporta códigos como HUE o nombres separados por ;)
            const allergensCodes = allergensStr ? allergensStr.split(';').map(a => a.trim().toUpperCase()) : []
            const allergens = allergensCodes.map(code => ALLERGEN_MAP[code] || code).filter(Boolean)

            importedProducts.push({
              id: `prod_csv_${Date.now()}_${i}`,
              name,
              category: category || 'General',
              pricePerUnit: parseFloat(priceStr.replace('€', '').trim()) || 0,
              unit: unit || 'kg',
              allergens,
              supplier: 'Importado CSV'
            })
          }

          if (importedProducts.length === 0) {
            alert('⚠️ No se encontraron productos válidos en el CSV. El formato debe ser: Familia,Nombre,Precio,Unidad,Alergenos')
            return
          }

          const existingNames = new Set(products.map(p => p.name.toLowerCase()))
          const finalNewProducts = []
          let skipped = 0

          importedProducts.forEach(p => {
            if (existingNames.has(p.name.toLowerCase())) {
              skipped++
            } else {
              finalNewProducts.push(p)
            }
          })

          if (onImportProducts) {
            onImportProducts([...products, ...finalNewProducts])
            alert(`✅ Importación CSV completada:\n- ${finalNewProducts.length} productos añadidos\n- ${skipped} duplicados omitidos`)
          }
        } catch (error) {
          alert('❌ Error al procesar CSV: ' + error.message)
        }
      }
      reader.readAsText(file)
    }
  }

  return (
    <div className="products-view animate-fade-in">
      <div className="products-header py-4 bg-white border-b border-gray-200">
        <div className="container">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg text-primary">
                <ShoppingCart size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-display text-text-primary">Base de Productos</h1>
                <p className="text-secondary text-sm">Escandallos y Materias Primas</p>
              </div>
            </div>
            <button onClick={() => onNavigate('dashboard')} className="btn btn-outline btn-sm">
              <X size={18} /> Volver al Panel
            </button>
          </div>
        </div>
      </div>

      <div className="products-main py-8">
        <div className="container">
          <div className="products-toolbar flex items-center justify-between mb-8">
            <div className="flex gap-6">
              <div className="stat-pill glass-card px-4 py-2 rounded-full border border-gray-200 flex items-center gap-2">
                <ShoppingCart size={16} className="text-primary" />
                <span className="text-sm font-semibold text-text-primary">{products.length} Registros Activos</span>
              </div>
            </div>
            <div className="flex gap-3">
              {isLocked ? (
                <button
                  onClick={() => setShowPinModal(true)}
                  className="btn btn-outline btn-sm border-error/30 text-error hover:bg-error/5"
                >
                  <Lock size={18} /> Gestión Bloqueada
                </button>
              ) : (
                <>
                  <label className="btn btn-outline btn-sm cursor-pointer border-gray-200 hover:border-primary transition-all">
                    <FileText size={18} />
                    Importar CSV
                    <input
                      type="file"
                      accept=".csv"
                      onChange={importProductsFromCSV}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <label className="btn btn-outline btn-sm cursor-pointer border-gray-200 hover:border-primary transition-all">
                    <Upload size={18} />
                    JSON Sync
                    <input
                      type="file"
                      accept=".json"
                      onChange={importProductsFromJSON}
                      style={{ display: 'none' }}
                    />
                  </label>
                  {!isAdding && (
                    <button onClick={() => setIsAdding(true)} className="btn btn-primary btn-sm">
                      <Plus size={18} /> Agregar Producto
                    </button>
                  )}
                  {settings.pinEnabled && (
                    <button onClick={() => setIsAdminAuthenticated(false)} className="btn btn-ghost btn-sm text-error/70" title="Cerrar sesión de gestión">
                      <Unlock size={18} />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {showPinModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
              <div className="glass-card max-w-sm w-full p-8 border border-white/20 shadow-2xl animate-scale-up">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary">PIN de Gestión</h3>
                  <p className="text-sm text-secondary">Introduce el PIN maestro para modificar productos</p>
                </div>

                <form onSubmit={handleUnlock}>
                  <div className="mb-6">
                    <input
                      type="password"
                      maxLength="6"
                      className={`w-full bg-white border ${pinError ? 'border-error animate-shake' : 'border-gray-200'} rounded-lg p-4 text-center text-2xl font-mono tracking-widest focus:border-primary transition-all outline-none`}
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                      autoFocus
                      placeholder="••••"
                    />
                    {pinError && <p className="text-error text-xs font-bold text-center mt-2">PIN Incorrecto</p>}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowPinModal(false)}
                      className="btn btn-ghost flex-1"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary flex-1"
                    >
                      Desbloquear
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {isAdding && (
            <div className="glass-card p-6 mb-8 border border-primary/20 animate-slide-up">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Edit size={18} className="text-primary" />
                {editingId ? 'Actualizar Ficha de Producto' : 'Crear Nueva Referencia'}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="form-group">
                    <label className="text-xs uppercase tracking-wider font-bold text-muted mb-2 block">Nombre *</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-gray-200 rounded-md p-2.5 text-text-primary focus:border-primary transition-all outline-none"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nombre del ingrediente..."
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="text-xs uppercase tracking-wider font-bold text-muted mb-2 block flex items-center gap-1">
                      <Layers size={12} /> Categoría / Familia
                    </label>
                    <div className="relative">
                      {!isCustomCategory ? (
                        <select
                          className="w-full bg-white border border-gray-200 rounded-md p-2.5 text-text-primary focus:border-primary transition-all outline-none appearance-none"
                          value={formData.category}
                          onChange={(e) => {
                            if (e.target.value === 'NEW_CATEGORY') {
                              setIsCustomCategory(true)
                              setFormData({ ...formData, category: '' })
                            } else {
                              setFormData({ ...formData, category: e.target.value })
                            }
                          }}
                        >
                          <option value="">Seleccionar familia...</option>
                          {uniqueCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                          <option value="NEW_CATEGORY" className="text-primary font-bold">+ Añadir nueva categoría...</option>
                        </select>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            className="flex-1 bg-white border border-gray-200 rounded-md p-2.5 text-text-primary focus:border-primary transition-all outline-none"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            placeholder="Nombre de la familia..."
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => setIsCustomCategory(false)}
                            className="p-2.5 text-muted hover:text-primary transition-colors"
                            title="Volver al listado"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      )}
                      {!isCustomCategory && (
                        <div className="absolute right-3 top-3.5 pointer-events-none text-muted">
                          <ChevronDown size={14} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="text-xs uppercase tracking-wider font-bold text-muted mb-2 block">Unidad de Gestión</label>
                    <select
                      className="w-full bg-white border border-gray-200 rounded-md p-2.5 text-text-primary focus:border-primary transition-all outline-none"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    >
                      <option value="kg">kilogramo (kg)</option>
                      <option value="g">gramo (g)</option>
                      <option value="l">litro (l)</option>
                      <option value="ml">mililitro (ml)</option>
                      <option value="ud">unidad (ud)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="text-xs uppercase tracking-wider font-bold text-muted mb-2 block">Precio compra (€) *</label>
                    <div className="relative">
                      <input
                        type="number"
                        className="w-full bg-white border border-gray-200 rounded-md p-2.5 pl-8 text-text-primary focus:border-primary transition-all outline-none"
                        value={formData.pricePerUnit}
                        onChange={(e) => setFormData({ ...formData, pricePerUnit: e.target.value })}
                        placeholder="0.00"
                        step="0.001"
                        required
                      />
                      <DollarSign size={14} className="absolute left-3 top-3.5 text-primary opacity-50" />
                    </div>
                  </div>

                  <div className="form-group lg:col-span-2">
                    <label className="text-xs uppercase tracking-wider font-bold text-muted mb-2 block">Proveedor de Referencia</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-gray-200 rounded-md p-2.5 text-text-primary focus:border-primary transition-all outline-none"
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                      placeholder="Razón social o distribuidor principal..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-white/5">
                  <button type="button" onClick={handleCancel} className="btn btn-ghost btn-sm">
                    Descartar cambios
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm">
                    <Save size={18} />
                    {editingId ? 'Actualizar Producto' : 'Dar de Alta'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {products.length === 0 ? (
            <div className="glass-card py-20 text-center flex flex-col items-center">
              <div className="p-6 bg-gray-50 rounded-full mb-6">
                <ShoppingCart size={48} className="text-primary opacity-20" />
              </div>
              <h3 className="text-xl font-bold text-text-primary">Inventario Vacío</h3>
              <p className="text-secondary max-w-sm mx-auto mt-2">No se han detectado productos en la base de datos técnica. Inicia el proceso de creación manual o importa un archivo JSON.</p>
              <button onClick={() => setIsAdding(true)} className="btn btn-primary mt-8">
                <Plus size={20} /> Crear Primera Referencia
              </button>
            </div>
          ) : (
            <div className="products-grouped-list space-y-6">
              {uniqueCategories.map(category => {
                const categoryProducts = products.filter(p => (p.category || 'General') === category)
                  .sort((a, b) => a.name.localeCompare(b.name))
                const isExpanded = expandedCategories[category] !== false // Expanded by default

                return (
                  <div key={category} className="category-section glass-card border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                    <div
                      className={`category-header px-6 py-4 flex items-center justify-between cursor-pointer transition-colors ${isExpanded ? 'bg-primary/5 border-b border-gray-100' : 'bg-white'}`}
                      onClick={() => toggleCategory(category)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                          <Tag size={18} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-text-primary capitalize">{category}</h3>
                          <span className="text-xs text-secondary font-medium">{categoryProducts.length} productos registrados</span>
                        </div>
                      </div>
                      <div className="text-muted">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="category-content p-0 animate-fade-in">
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-gray-50/50">
                                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted">Producto</th>
                                <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-muted">Unidad</th>
                                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-muted">Precio Compra</th>
                                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted">Proveedor</th>
                                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-muted">Acciones</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {categoryProducts.map(product => (
                                <tr key={product.id} className="hover:bg-gray-50/80 transition-colors group">
                                  <td className="px-6 py-4">
                                    <div className="font-semibold text-text-primary">{product.name}</div>
                                    <div className="flex gap-1 mt-1">
                                      {product.allergens && product.allergens.map(a => (
                                        <span key={a} className="w-2 h-2 rounded-full bg-error/50" title={a}></span>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-center text-secondary font-medium uppercase">{product.unit}</td>
                                  <td className="px-6 py-4 text-right">
                                    <span className="font-mono font-bold text-primary">
                                      {settings.currency}{parseFloat(product.pricePerUnit).toFixed(3)}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-secondary italic opacity-75">{product.supplier || '-'}</td>
                                  <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      {!isLocked ? (
                                        <>
                                          <button
                                            onClick={(e) => { e.stopPropagation(); handleEdit(product); }}
                                            className="w-8 h-8 flex items-center justify-center rounded bg-white text-secondary hover:text-accent hover:shadow-sm border border-gray-100 transition-all"
                                          >
                                            <Edit size={16} />
                                          </button>
                                          <button
                                            onClick={(e) => { e.stopPropagation(); onDeleteProduct(product.id); }}
                                            className="w-8 h-8 flex items-center justify-center rounded bg-white text-secondary hover:text-error hover:shadow-sm border border-gray-100 transition-all"
                                          >
                                            <Trash2 size={16} />
                                          </button>
                                        </>
                                      ) : (
                                        <div className="text-xs text-muted font-bold flex items-center gap-1 pr-2">
                                          <Lock size={12} /> Protegido
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .products-view {
          min-height: 100vh;
          background: var(--color-bg-primary);
          padding-bottom: 5rem;
        }

        .category-section {
          animation: slideUp 0.4s ease-out backwards;
        }

        .category-header:hover {
          background: var(--color-bg-secondary);
        }

        .product-row {
          transition: all 0.2s ease;
        }

        .product-row:hover {
          background: rgba(var(--color-primary-rgb), 0.02);
          transform: scale(1.001);
        }

        .glass-card {
          backdrop-filter: blur(10px);
          background: rgba(255, 255, 255, 0.8);
        }

        .category-section:nth-child(1) { animation-delay: 0.1s; }
        .category-section:nth-child(2) { animation-delay: 0.2s; }
        .category-section:nth-child(3) { animation-delay: 0.3s; }
        .category-section:nth-child(n+4) { animation-delay: 0.4s; }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .animate-scale-up {
          animation: scaleUp 0.3s ease-out;
        }

        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .animate-fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }

        @media (max-width: 768px) {
          .products-toolbar { flex-direction: column; align-items: stretch; gap: 15px; }
          .products-actions { flex-direction: column; }
        }
      `}</style>
    </div>
  )
}
