import React, { useState } from 'react';
import { Search, Volume2, GraduationCap, Home, Book } from 'lucide-react';

export function GlossaryView() {
  const [searchTerm, setSearchTerm] = useState('');

  const terms = [
    {
      word: 'Mirepoix',
      def: 'Base aromática clásica compuesta por vegetales cortados en cubos uniformes.',
      pro: '2 partes de cebolla, 1 de zanahoria, 1 de apio. Proporción áurea para fondos y braseados.',
      home: 'La base aromática fundamental, aplicada con rigor para equilibrar sopas y guisos.',
      pronunciation: '/miʁ.pwa/'
    },
    {
      word: 'Mise en place',
      def: 'Organización integral de ingredientes y herramientas previa a la cocción.',
      pro: 'Alistamiento técnico obligatorio. Clave para la eficiencia y el control de costes en servicio.',
      home: 'Preparar y organizar todo antes de encender el fuego ahorra tiempo y evita errores críticos.',
      pronunciation: '/miz ɑ̃ plas/'
    },
    {
      word: 'Blanqueado',
      def: 'Cocción breve en medio líquido hirviendo seguida de un enfriamiento rápido.',
      pro: 'Fijación de clorofila y pre-cocción técnica para producciones de gran volumen.',
      home: 'Ideal para mantener colores vibrantes y texturas firmes en ensaladas y guarniciones.',
      pronunciation: '/blaŋ.keˈa.ðo/'
    },
    {
      word: 'Roux',
      def: 'Mezcla cocida de harina y materia grasa a partes iguales.',
      pro: 'Agente ligante fundamental para salsas madre. Se gradúa por el tiempo de cocción (blanco, rubio, oscuro).',
      home: 'La técnica maestra para espesar cremas y salsas de forma homogénea y sin grumos.',
      pronunciation: '/ʁu/'
    }
  ];

  const filteredTerms = terms.filter(t =>
    t.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.def.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="glossary-view animate-fade-in">
      <section className="section-padding bg-darker">
        <div className="container">
          <div className="section-header text-center mb-5">
            <h1 className="hero-title mb-2">Diccionario Técnico</h1>
            <p className="text-secondary opacity-80">Domina el léxico de la gastronomía profesional. Precisión técnica en cada palabra.</p>
          </div>

          <div className="search-container mb-5">
            <div className="search-wrapper-modern glass-card">
              <Search size={22} className="text-primary opacity-60" />
              <input
                type="text"
                placeholder="Buscar término culinario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="glossary-search-modern"
              />
            </div>
          </div>

          <div className="terms-list">
            {filteredTerms.length > 0 ? (
              filteredTerms.map((term, i) => (
                <div key={i} className="term-card-modern glass-card mb-4">
                  <div className="term-header p-4">
                    <div className="term-word-group">
                      <h2 className="text-2xl font-semibold">{term.word}</h2>
                      <span className="pronunciation-text"><Volume2 size={16} /> {term.pronunciation}</span>
                    </div>
                  </div>

                  <div className="term-content p-4 pt-0">
                    <p className="main-def mb-4">{term.def}</p>

                    <div className="context-grid mt-4">
                      <div className="context-box pro">
                        <div className="context-label"><GraduationCap size={18} /> Dimensión Profesional</div>
                        <p className="text-sm opacity-90">{term.pro}</p>
                      </div>
                      <div className="context-box home">
                        <div className="context-label"><Home size={18} /> Aplicación en el Hogar</div>
                        <p className="text-sm opacity-90">{term.home}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-5">
                <Book size={64} className="text-muted mb-4 mx-auto opacity-20" />
                <p className="text-secondary">No se han encontrado registros para esa búsqueda.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <style jsx>{`
        .bg-darker { background: var(--color-bg-primary); }
        .search-container {
          max-width: 700px;
          margin: 0 auto;
        }

        .search-wrapper-modern {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 12px 25px;
          border-radius: var(--radius-full);
          border: 1px solid var(--color-border);
          background: white;
          transition: 0.3s;
        }
        
        .search-wrapper-modern:focus-within {
          border-color: var(--color-primary);
          box-shadow: var(--soft-glow);
        }

        .glossary-search-modern {
          border: none;
          background: none;
          flex: 1;
          font-size: 1.1rem;
          outline: none;
          color: var(--color-text-primary);
          font-family: var(--font-body);
        }

        .term-card-modern {
          border-radius: var(--radius-lg);
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .term-card-modern:hover {
          border-color: var(--color-primary);
          transform: translateY(-2px);
        }

        .term-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .term-word-group {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .pronunciation-text {
          font-family: var(--font-body);
          font-size: 0.9rem;
          color: var(--color-accent);
          display: flex;
          align-items: center;
          gap: 8px;
          font-style: italic;
          opacity: 0.8;
        }

        .main-def {
          font-size: 1.05rem;
          color: var(--color-text-primary);
          padding-left: 20px;
          border-left: 3px solid var(--color-primary);
          line-height: 1.6;
        }

        .context-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .context-box {
          padding: 20px;
          background: var(--color-bg-secondary);
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border-light);
        }

        .context-box.pro {
          border-top: 2px solid var(--color-primary);
        }

        .context-box.home {
          border-top: 2px solid var(--color-accent);
        }

        .context-label {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 700;
          margin-bottom: 12px;
          font-size: 0.85rem;
          color: var(--color-text-primary);
        }

        .pro .context-label { color: var(--color-primary); }
        .home .context-label { color: var(--color-accent); }

        @media (max-width: 768px) {
          .context-grid { grid-template-columns: 1fr; }
          .term-word-group { flex-direction: column; align-items: flex-start; gap: 5px; }
        }
      `}</style>
    </div>
  );
}
