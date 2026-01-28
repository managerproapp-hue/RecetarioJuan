import { X } from 'lucide-react'
import { ALLERGENS } from '../utils/dataModels'

export function AllergenModal({ isOpen, onClose, selectedAllergens, onToggleAllergen }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content allergen-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Gestionar Alérgenos</h3>
          <button onClick={onClose} className="btn btn-ghost btn-icon">
            <X size={20} />
          </button>
        </div>

        <div className="allergen-grid">
          {ALLERGENS.map(allergen => {
            const isSelected = selectedAllergens.includes(allergen.id)
            return (
              <button
                key={allergen.id}
                onClick={() => onToggleAllergen(allergen.id)}
                className={`allergen-button ${isSelected ? 'selected' : ''}`}
              >
                <span className="allergen-icon">{allergen.icon}</span>
                <span className="allergen-name">{allergen.name}</span>
                {isSelected && <span className="allergen-check">✓</span>}
              </button>
            )
          })}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-primary">
            Aceptar
          </button>
        </div>
      </div>

      <style jsx>{`
        .allergen-modal {
          max-width: 600px;
          padding: 0;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--spacing-xl);
          border-bottom: 1px solid var(--color-border);
        }

        .modal-title {
          font-size: var(--font-size-xl);
          font-weight: 700;
          color: var(--color-text-primary);
        }

        .allergen-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: var(--spacing-md);
          padding: var(--spacing-xl);
          max-height: 60vh;
          overflow-y: auto;
        }

        .allergen-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-lg);
          background: var(--color-bg-secondary);
          border: 2px solid var(--color-border);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all var(--transition-base);
          position: relative;
        }

        .allergen-button:hover {
          border-color: var(--color-primary);
          transform: translateY(-2px);
        }

        .allergen-button.selected {
          background: linear-gradient(135deg, rgba(255, 107, 53, 0.2), rgba(255, 107, 53, 0.1));
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
        }

        .allergen-icon {
          font-size: 2rem;
        }

        .allergen-name {
          font-size: var(--font-size-sm);
          font-weight: 600;
          color: var(--color-text-primary);
          text-align: center;
        }

        .allergen-check {
          position: absolute;
          top: var(--spacing-xs);
          right: var(--spacing-xs);
          width: 24px;
          height: 24px;
          background: var(--color-primary);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--font-size-sm);
          font-weight: bold;
        }

        .modal-footer {
          padding: var(--spacing-xl);
          border-top: 1px solid var(--color-border);
          display: flex;
          justify-content: flex-end;
        }

        @media (max-width: 640px) {
          .allergen-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  )
}

// Componente para mostrar badges de alérgenos
export function AllergenBadges({ allergens }) {
  if (!allergens || allergens.length === 0) return null

  // Mapeo de colores por alérgeno
  const allergenColors = {
    'gluten': { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' },
    'crustaceos': { bg: '#FCE7F3', border: '#EC4899', text: '#831843' },
    'huevos': { bg: '#FED7AA', border: '#F97316', text: '#9A3412' },
    'pescado': { bg: '#DBEAFE', border: '#3B82F6', text: '#1E3A8A' },
    'cacahuetes': { bg: '#FEE2E2', border: '#EF4444', text: '#991B1B' },
    'soja': { bg: '#D1FAE5', border: '#10B981', text: '#065F46' },
    'lacteos': { bg: '#E0E7FF', border: '#6366F1', text: '#3730A3' },
    'frutos_secos': { bg: '#F3E8FF', border: '#A855F7', text: '#6B21A8' },
    'apio': { bg: '#D1FAE5', border: '#059669', text: '#064E3B' },
    'mostaza': { bg: '#FEF9C3', border: '#EAB308', text: '#713F12' },
    'sesamo': { bg: '#FED7AA', border: '#F59E0B', text: '#78350F' },
    'sulfitos': { bg: '#E0E7FF', border: '#818CF8', text: '#3730A3' },
    'altramuces': { bg: '#DBEAFE', border: '#60A5FA', text: '#1E40AF' },
    'moluscos': { bg: '#FCE7F3', border: '#F472B6', text: '#9F1239' }
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
      {allergens.map(allergenId => {
        const allergen = ALLERGENS.find(a => a.id === allergenId)
        if (!allergen) return null

        const colors = allergenColors[allergenId] || { bg: '#F3F4F6', border: '#9CA3AF', text: '#374151' }

        return (
          <span
            key={allergenId}
            title={allergen.name}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              backgroundColor: colors.bg,
              border: `1.5px solid ${colors.border}`,
              borderRadius: '6px',
              color: colors.text,
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.3px',
              cursor: 'help',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            <span style={{ fontSize: '0.9rem', lineHeight: 1 }}>{allergen.icon}</span>
            <span style={{ lineHeight: 1, fontSize: '0.7rem', fontWeight: 700 }}>
              {allergen.name.toUpperCase()}
            </span>
          </span>
        )
      })}
    </div>
  )
}
