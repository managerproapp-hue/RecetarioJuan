import { X, Edit, Printer, Clock, Users, Thermometer, ChefHat, Utensils, FileText, CheckSquare, Plus, Trash, Save } from 'lucide-react'
import { AllergenBadges } from './AllergenModal'
import { calculateRecipeAllergens } from '../utils/dataModels'

export function DetailView({
  recipe,
  productDatabase,
  onEdit,
  onClose,
  settings,
  // Props de verificacion
  verificationMode = false,
  initialServings = null,
  initialChecklist = null,
  onSaveVerification = null
}) {
  const [activeElaborationIndex, setActiveElaborationIndex] = useState(0)
  const [servings, setServings] = useState(initialServings || recipe.yield?.amount || 1)
  const [checklist, setChecklist] = useState(initialChecklist || [])
  const calculatedAllergens = calculateRecipeAllergens(recipe)

  const originalServings = recipe.yield?.amount || 1
  const scaleFactor = servings / originalServings

  // Calcular costes
  const calculateCosts = () => {
    let totalCost = 0
    recipe.elaborations.forEach(elab => {
      elab.ingredients.forEach(ing => {
        const product = productDatabase.find(p => p.name.toLowerCase() === ing.product.toLowerCase())
        if (product && product.price) {
          const wastePercent = parseFloat(ing.waste) || 0
          const netQty = (parseFloat(ing.quantity) || 0)
          // Peso Bruto = Neto / (1 - %Merma/100)
          const grossQty = wastePercent < 100 ? netQty / (1 - (wastePercent / 100)) : netQty
          totalCost += grossQty * product.price
        }
      })
    })

    const scaledTotal = totalCost * scaleFactor
    const costPerServing = servings > 0 ? scaledTotal / servings : 0

    return {
      total: scaledTotal,
      perServing: costPerServing
    }
  }

  const costs = calculateCosts()

  const handlePrint = () => {
    window.print()
  }

  // Handlers para Checklist (solo en verificationMode)
  const toggleCheckitem = (id) => {
    if (!verificationMode) return
    setChecklist(prev => prev.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ))
  }

  const addCheckitem = () => {
    const newItem = {
      id: `chk-${Date.now()}`,
      text: 'Nuevo punto de control',
      checked: false
    }
    setChecklist([...checklist, newItem])
  }

  const removeCheckitem = (id) => {
    setChecklist(checklist.filter(item => item.id !== id))
  }

  const updateCheckitemText = (id, text) => {
    setChecklist(prev => prev.map(item =>
      item.id === id ? { ...item, text } : item
    ))
  }

  const handleSave = () => {
    if (onSaveVerification) {
      onSaveVerification({
        customServings: servings,
        checklist: checklist
      })
    }
  }

  const currentElaboration = recipe.elaborations[activeElaborationIndex]

  return (
    <div className="detail-view">
      <div className="detail-header no-print">
        <div className="container">
          <div className="header-content">
            <h1 className="text-2xl font-bold">Ficha Técnica Profesional</h1>
            <div className="header-actions">
              {verificationMode ? (
                <button onClick={handleSave} className="btn btn-primary">
                  <Save size={20} />
                  Guardar Verificación
                </button>
              ) : (
                <>
                  <button onClick={handlePrint} className="btn btn-ghost">
                    <Printer size={20} />
                    Imprimir
                  </button>
                  <button onClick={onEdit} className="btn btn-secondary">
                    <Edit size={20} />
                    Editar
                  </button>
                </>
              )}
              <button onClick={onClose} className="btn btn-ghost">
                <X size={20} />
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="detail-main">
        <div className="container">
          {/* Header de impresión (oculto en pantalla) */}
          <div className="print-header-pro print-only">
            <div className="print-header-top">
              <div className="print-header-left">
                <img src="/logo.png" alt="Logo" className="print-logo" onError={(e) => e.target.style.display = 'none'} />
                <div className="print-business-info">
                  <h2 className="print-business-name">{settings.businessName}</h2>
                  <p className="print-teacher-name">Chef/Profesor: {settings.teacherName}</p>
                </div>
              </div>
              <div className="print-header-right">
                <p><strong>Fecha:</strong> {new Date().toLocaleDateString()}</p>
                <p><strong>Ref:</strong> RE-{recipe.id.toString().slice(-6)}</p>
                <p><strong>Versión:</strong> 1.1 (Escandallo)</p>
              </div>
            </div>
            <h1 className="print-recipe-title">{recipe.name}</h1>
          </div>

          <div className="recipe-detail-card">
            {/* CABECERA DE LA FICHA */}
            <div className="recipe-header">
              <div className="recipe-header-content">
                <div className="recipe-title-section">
                  <h1 className="recipe-name">{recipe.name}</h1>
                  <div className="recipe-badges">
                    {recipe.category && (
                      <span className="badge badge-primary">{recipe.category}</span>
                    )}
                    <AllergenBadges allergens={calculatedAllergens} />
                  </div>
                </div>

                <div className="recipe-meta-grid">
                  <div className="meta-item servings-control no-print">
                    <Users size={20} />
                    <div>
                      <span className="meta-label">Rendimiento (Escalable)</span>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          className="btn-scale"
                          onClick={() => setServings(Math.max(1, servings - 1))}
                        >-</button>
                        <span className="meta-value">{servings} {recipe.yield.unit}</span>
                        <button
                          className="btn-scale"
                          onClick={() => setServings(servings + 1)}
                        >+</button>
                      </div>
                    </div>
                  </div>

                  {/* Vista Impresión raciones */}
                  <div className="meta-item print-only">
                    <Users size={20} />
                    <div>
                      <span className="meta-label">Rendimiento</span>
                      <span className="meta-value">{servings} {recipe.yield.unit}</span>
                    </div>
                  </div>

                  <div className="meta-item cost-badge">
                    <DollarSign size={20} />
                    <div>
                      <span className="meta-label">Coste Ración (Est.)</span>
                      <span className="meta-value text-primary">
                        {costs.perServing.toFixed(2)}{settings.currency || '€'}
                      </span>
                    </div>
                  </div>

                  <div className="meta-item cost-badge">
                    <Calculator size={20} />
                    <div>
                      <span className="meta-label">Coste Total</span>
                      <span className="meta-value">
                        {costs.total.toFixed(2)}{settings.currency || '€'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {recipe.finalImage && (
                <div className="recipe-header-image">
                  <img src={recipe.finalImage} alt={recipe.name} />
                </div>
              )}
            </div>

            {/* CONTENIDO PRINCIPAL: ELABORACIONES */}
            <div className="recipe-body">
              <div className="elaborations-nav no-print">
                {recipe.elaborations.map((elab, index) => (
                  <button
                    key={elab.id}
                    className={`nav-tab ${index === activeElaborationIndex ? 'active' : ''}`}
                    onClick={() => setActiveElaborationIndex(index)}
                  >
                    {elab.name}
                  </button>
                ))}
              </div>

              {/* Vista de impresión: Muestra todas las elaboraciones secuencialmente */}
              <div className="print-only-elaborations">
                {recipe.elaborations.map((elab, index) => (
                  <div key={elab.id} className="print-elaboration-section">
                    <h3 className="print-elaboration-title">{elab.name}</h3>
                    <ElaborationContent
                      elaboration={elab}
                      scaleFactor={scaleFactor}
                    />
                  </div>
                ))}

                {/* Resumen de Escandallo Profesional para impresión */}
                <div className="print-escandallo-section">
                  <h3 className="print-elaboration-title">Resumen de Escandallo (Costes)</h3>
                  <table className="print-cost-table">
                    <thead>
                      <tr>
                        <th>Ingrediente</th>
                        <th className="text-right">Cant. Neta</th>
                        <th className="text-right">% Merma</th>
                        <th className="text-right">P. Unitario</th>
                        <th className="text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recipe.elaborations.flatMap(elab => elab.ingredients).map((ing, idx) => {
                        const product = productDatabase.find(p => p.name.toLowerCase() === ing.product.toLowerCase())
                        const wastePercent = parseFloat(ing.waste) || 0
                        const netQty = (parseFloat(ing.quantity) || 0) * scaleFactor
                        const grossQty = wastePercent < 100 ? netQty / (1 - (wastePercent / 100)) : netQty
                        const unitPrice = product?.price || 0
                        const subtotal = grossQty * unitPrice

                        return (
                          <tr key={idx}>
                            <td>{ing.product}</td>
                            <td className="text-right">{netQty.toFixed(3)} {ing.unit}</td>
                            <td className="text-right">{wastePercent}%</td>
                            <td className="text-right">{unitPrice.toFixed(2)}{settings.currency}</td>
                            <td className="text-right">{subtotal.toFixed(2)}{settings.currency}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="grand-total">
                        <td colSpan="4" className="text-right">COSTE TOTAL (Escalado):</td>
                        <td className="text-right">{costs.total.toFixed(2)}{settings.currency}</td>
                      </tr>
                      <tr className="serving-total">
                        <td colSpan="4" className="text-right">COSTE POR RACIÓN:</td>
                        <td className="text-right">{costs.perServing.toFixed(2)}{settings.currency}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Vista de pantalla: Muestra solo la elaboración activa */}
              <div className="screen-only-elaboration">
                <h2 className="section-title">{currentElaboration.name}</h2>
                <ElaborationContent
                  elaboration={currentElaboration}
                  scaleFactor={scaleFactor}
                />
              </div>

              {/* MONTAJE Y SERVICIO */}
              <div className="recipe-footer-section">
                <div className="footer-grid">
                  <div className="footer-card">
                    <h3 className="footer-title">
                      <Utensils size={20} />
                      Montaje y Emplatado
                    </h3>
                    <p className="footer-text">{recipe.plating || 'Sin instrucciones de montaje.'}</p>
                  </div>

                  <div className="footer-card">
                    <h3 className="footer-title">
                      <FileText size={20} />
                      Detalles de Servicio
                    </h3>
                    <div className="service-details-list">
                      {recipe.serviceDetails?.serviceType && (
                        <div className="service-row">
                          <strong>Tipo:</strong> {recipe.serviceDetails.serviceType}
                        </div>
                      )}
                      {recipe.serviceDetails?.cutlery && (
                        <div className="service-row">
                          <strong>Marcaje:</strong> {recipe.serviceDetails.cutlery}
                        </div>
                      )}
                      {recipe.serviceDetails?.visualNotes && (
                        <div className="service-row">
                          <strong>Notas Visuales:</strong> {recipe.serviceDetails.visualNotes}
                        </div>
                      )}
                      {recipe.serviceDetails?.commercialDescription && (
                        <div className="service-row commercial-desc">
                          <strong>Descripción Comercial:</strong>
                          <p>{recipe.serviceDetails.commercialDescription}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {/* CHECKLIST DE VERIFICACIÓN */}
              <div className="recipe-footer-section">
                <div className="footer-title">
                  <CheckSquare size={20} />
                  Checklist de Verificación y Control
                </div>
                {verificationMode ? (
                  <div className="checklist-editor">
                    <button onClick={addCheckitem} className="btn btn-sm btn-secondary mb-4">
                      <Plus size={16} /> Añadir Punto de Control
                    </button>
                    <div className="checklist-grid">
                      {checklist.map(item => (
                        <div key={item.id} className="checklist-edit-row">
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={() => toggleCheckitem(item.id)}
                            className="checklist-checkbox"
                          />
                          <input
                            type="text"
                            value={item.text}
                            onChange={(e) => updateCheckitemText(item.id, e.target.value)}
                            className="checklist-input"
                          />
                          <button onClick={() => removeCheckitem(item.id)} className="btn-icon-danger">
                            <Trash size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Modo lectura / impresión
                  <div className="checklist-view">
                    {checklist && checklist.length > 0 ? (
                      <div className="checklist-grid-view">
                        {checklist.map(item => (
                          <div key={item.id} className="checklist-view-row">
                            <div className={`checklist-box ${item.checked ? 'checked' : ''}`}>
                              {item.checked ? '✓' : ''}
                            </div>
                            <span className={item.checked ? 'text-checked' : ''}>{item.text}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-data-text">No hay puntos de control definidos para esta receta en este menú.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .checklist-edit-row {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 0.5rem;
            padding: 0.5rem;
            background: #f8fafc;
            border-radius: 6px;
        }
        .checklist-input {
            flex: 1;
            padding: 0.5rem;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        .checklist-checkbox {
            width: 20px;
            height: 20px;
        }
        .btn-icon-danger {
            color: #ef4444;
            background: none;
            border: none;
            cursor: pointer;
        }
        
        .checklist-view-row {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 0.5rem 0;
            border-bottom: 1px dashed #eee;
        }
        .checklist-box {
            width: 24px;
            height: 24px;
            border: 2px solid #cbd5e1;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: var(--color-primary);
        }
        .checklist-box.checked {
            border-color: var(--color-primary);
            background: #f0fdf4;
        }
        .text-checked {
            text-decoration: line-through;
            color: #94a3b8;
        }
        /* ... existing styles ... */

        .detail-view {
          min-height: 100vh;
          background: var(--color-bg-primary);
        }

        .detail-header {
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

        .detail-main {
          padding: var(--spacing-2xl) 0;
        }

        .recipe-detail-card {
          background: white;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          overflow: hidden;
          box-shadow: var(--shadow-lg);
        }

        .recipe-header {
          display: grid;
          grid-template-columns: 1fr 400px;
          border-bottom: 1px solid var(--color-border);
        }

        .recipe-header-content {
          padding: var(--spacing-2xl);
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .recipe-title-section {
          margin-bottom: var(--spacing-xl);
        }

        .recipe-name {
          font-size: var(--font-size-4xl);
          font-weight: 800;
          color: var(--color-text-primary);
          margin-bottom: var(--spacing-md);
          line-height: 1.2;
        }

        .recipe-badges {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .recipe-meta-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: var(--spacing-lg);
          padding-top: var(--spacing-lg);
          border-top: 1px solid var(--color-border);
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          color: var(--color-text-secondary);
        }

        .meta-item svg {
          color: var(--color-primary);
        }

        .meta-label {
          display: block;
          font-size: var(--font-size-xs);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .meta-value {
          display: block;
          font-size: var(--font-size-lg);
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .btn-scale {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 1px solid var(--color-border);
          background: white;
          color: var(--color-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          cursor: pointer;
          transition: 0.2s;
        }

        .btn-scale:hover {
          background: var(--color-primary);
          color: white;
          border-color: var(--color-primary);
        }

        .cost-badge .meta-value {
          font-family: var(--font-display);
        }

        .print-only { display: none; }

        .recipe-header-image {
          height: 100%;
          min-height: 300px;
          background: var(--color-bg-tertiary);
        }

        .recipe-header-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .recipe-body {
          padding: var(--spacing-2xl);
        }

        .elaborations-nav {
          display: flex;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-xl);
          border-bottom: 2px solid var(--color-border);
          padding-bottom: 2px;
        }

        .nav-tab {
          padding: var(--spacing-md) var(--spacing-lg);
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: var(--color-text-secondary);
          font-weight: 600;
          cursor: pointer;
          margin-bottom: -4px;
          transition: all var(--transition-base);
        }

        .nav-tab:hover {
          color: var(--color-text-primary);
        }

        .nav-tab.active {
          color: var(--color-primary);
          border-bottom-color: var(--color-primary);
        }

        .section-title {
          font-size: var(--font-size-2xl);
          font-weight: 700;
          margin-bottom: var(--spacing-lg);
          color: var(--color-text-primary);
        }

        .recipe-footer-section {
          margin-top: var(--spacing-2xl);
          padding-top: var(--spacing-2xl);
          border-top: 1px solid var(--color-border);
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-xl);
        }

        .footer-card {
          background: var(--color-bg-secondary);
          padding: var(--spacing-xl);
          border: 1px solid var(--color-border-light);
          border-radius: var(--radius-lg);
        }

        .footer-title {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          font-size: var(--font-size-lg);
          font-weight: 600;
          margin-bottom: var(--spacing-lg);
          color: var(--color-primary);
        }

        .footer-text {
          white-space: pre-wrap;
          line-height: 1.6;
          color: var(--color-text-primary);
        }

        .service-row {
          margin-bottom: var(--spacing-md);
          color: var(--color-text-primary);
        }

        .service-row strong {
          color: var(--color-text-secondary);
          margin-right: var(--spacing-sm);
        }

        .commercial-desc {
          margin-top: var(--spacing-lg);
          padding-top: var(--spacing-md);
          border-top: 1px solid var(--color-border);
        }

        .commercial-desc p {
          margin-top: var(--spacing-xs);
          font-style: italic;
          color: var(--color-text-secondary);
        }

        @media print {
          .no-print {
            display: none !important;
          }

          .print-only {
            display: block !important;
          }

          .print-header-pro {
            border-bottom: 2px solid #000;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
          }

          .print-header-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }

          .print-header-left {
            display: flex;
            align-items: center;
            gap: 1.5rem;
          }

          .print-logo {
            height: 60px;
            width: auto;
          }

          .print-business-name {
            font-size: 1.5rem;
            font-weight: 800;
            margin: 0;
            color: #000;
          }

          .print-teacher-name {
            margin: 0;
            font-size: 0.9rem;
            color: #444;
          }

          .print-header-right {
            text-align: right;
            font-size: 0.8rem;
          }

          .print-header-right p {
            margin: 2px 0;
          }

          .print-recipe-title {
            font-size: 2.5rem;
            font-weight: 800;
            margin-top: 1rem;
            text-align: center;
            text-transform: uppercase;
          }

          .detail-view {
            background: white;
            color: black;
            padding: 0;
          }

          .recipe-detail-card {
            box-shadow: none;
            border: none;
          }

          .recipe-header {
            display: none; /* Usamos nuestro print-header-pro */
          }

          .recipe-header-image {
            display: block;
            height: 300px;
            width: 100%;
            margin-bottom: 2rem;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #ddd;
          }

          .recipe-header-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .screen-only-elaboration {
            display: none;
          }

          .print-only-elaborations {
            display: block;
          }

          .print-elaboration-section {
            margin-bottom: 3rem;
            page-break-inside: avoid;
          }

          .print-elaboration-title {
            font-size: 1.6rem;
            font-weight: bold;
            border-bottom: 2px solid #333;
            margin-bottom: 1.5rem;
            padding-bottom: 0.5rem;
            color: #000;
          }

          .print-escandallo-section {
            margin-top: 4rem;
            page-break-before: always;
          }

          .print-cost-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1rem;
          }

          .print-cost-table th {
            text-align: left;
            border-bottom: 2px solid #000;
            padding: 8px;
            font-size: 0.9rem;
          }

          .print-cost-table td {
            padding: 8px;
            border-bottom: 1px solid #eee;
            font-size: 0.85rem;
          }

          .text-right { text-align: right !important; }

          .grand-total td {
            font-weight: 800;
            font-size: 1rem;
            border-top: 2px solid #000;
            padding-top: 12px;
          }

          .serving-total td {
            font-weight: 700;
            font-size: 1.1rem;
            color: #000;
          }

          .footer-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }

          .footer-card {
            background: #fafafa;
            border: 1px solid #ccc;
          }
        }

        @media (max-width: 768px) {
          .recipe-header {
            grid-template-columns: 1fr;
          }

          .recipe-header-image {
            height: 250px;
            min-height: auto;
          }

          .footer-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

function ElaborationContent({ elaboration, scaleFactor = 1 }) {
  return (
    <div className="elaboration-content-grid">
      <div className="ingredients-column">
        <h3 className="column-title">
          <ChefHat size={18} />
          Ingredientes
        </h3>
        <div className="ingredients-table">
          {elaboration.ingredients.map((ing, idx) => {
            const scaledQty = (parseFloat(ing.quantity) * scaleFactor).toFixed(2)
            return (
              <div key={ing.id || idx} className="ing-row">
                <span className="ing-name">{ing.product}</span>
                <div className="ing-qty-box">
                  <span className="ing-qty">{scaledQty} {ing.unit}</span>
                  {ing.waste > 0 && <span className="ing-waste-tag">{ing.waste}% M.</span>}
                </div>
                <div className="ing-allergens">
                  <AllergenBadges allergens={ing.allergens} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="process-column">
        <h3 className="column-title">
          <Utensils size={18} />
          Proceso
        </h3>
        {elaboration.image && (
          <div className="elaboration-image">
            <img src={elaboration.image} alt={elaboration.name} />
          </div>
        )}
        <div className="process-text">
          {elaboration.process || 'Sin descripción del proceso.'}
        </div>
      </div>

      <style jsx>{`
        .elaboration-content-grid {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: var(--spacing-xl);
        }

        .column-title {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          font-size: var(--font-size-lg);
          font-weight: 600;
          margin-bottom: var(--spacing-lg);
          color: var(--color-primary);
          border-bottom: 2px solid var(--color-border);
          padding-bottom: var(--spacing-sm);
        }

        .ingredients-table {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .ing-row {
          display: grid;
          grid-template-columns: 1fr auto auto;
          gap: var(--spacing-md);
          align-items: center;
          padding: var(--spacing-sm);
          background: white;
          border: 1px solid var(--color-border-light);
          border-radius: var(--radius-md);
        }

        .ing-name {
          font-weight: 500;
        }

        .ing-qty-box {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }

        .ing-qty {
          color: var(--color-text-primary);
          font-family: monospace;
          font-weight: 600;
        }

        .ing-waste-tag {
          font-size: 10px;
          background: var(--color-bg-tertiary);
          padding: 1px 4px;
          border-radius: 4px;
          color: var(--color-text-secondary);
          font-weight: bold;
        }

        .process-text {
          white-space: pre-wrap;
          line-height: 1.8;
          color: var(--color-text-primary);
        }

        .elaboration-image {
          margin-bottom: var(--spacing-lg);
          border-radius: var(--radius-lg);
          overflow: hidden;
          max-height: 300px;
        }

        .elaboration-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        @media print {
          .elaboration-content-grid {
            display: block;
          }
          
          .ingredients-column {
            margin-bottom: 1rem;
          }
          
          .ing-row {
            background: transparent;
            border-bottom: 1px solid #eee;
          }
        }

        @media (max-width: 768px) {
          .elaboration-content-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
