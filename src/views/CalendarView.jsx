import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, GraduationCap, CheckSquare, Home, ShoppingCart } from 'lucide-react';

export function CalendarView() {
    const [activeMonth, setActiveMonth] = useState(new Date().getMonth());

    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const seasonalData = {
        11: { // Diciembre
            pro: {
                title: 'Logística de Eventos y Banquetes',
                tips: [
                    'Producción anticipada de fondos y bases técnicas.',
                    'Optimización de stocks para cierres de proveedores.',
                    'Diseño de menús eficientes para alta rotación.',
                    'Gestión de APPCC en flujos de trabajo intensos.'
                ],
                focus: 'Producción a escala y conservación técnica.'
            },
            home: {
                title: 'Gastronomía Navideña Eficiente',
                tips: [
                    'Cálculo exacto de gramajes para residuo cero.',
                    'Técnicas de regeneración térmica profesional.',
                    'Elaboraciones estables con mise en place previa.'
                ],
                focus: 'Organización logística y aprovechamiento.'
            },
            products: ['Cardo', 'Besugo', 'Cordero', 'Piña', 'Dátil', 'Granada']
        }
    };

    const currentData = seasonalData[activeMonth] || {
        pro: { title: 'Planificación Operativa', tips: ['Auditoría de proveedores de temporada.', 'Actualización de escandallos técnicos.'], focus: 'Eficiencia de procesos.' },
        home: { title: 'Cocina Estacional', tips: ['Selección de producto de proximidad.', 'Optimización del mercado semanal.'], focus: 'Calidad y temporalidad.' },
        products: ['Variedad según mercado y lonja local']
    };

    return (
        <div className="calendar-view animate-fade-in">
            <section className="section-padding bg-darker">
                <div className="container">
                    <div className="section-header text-center mb-5">
                        <h1 className="hero-title mb-2">Calendario Estacional</h1>
                        <p className="text-secondary opacity-80">Planificación técnica y doméstica. El producto óptimo para cada momento del año.</p>
                    </div>

                    <div className="month-selector-modern mb-5 glass-card">
                        <button className="nav-btn-modern" onClick={() => setActiveMonth((prev) => (prev > 0 ? prev - 1 : 11))}>
                            <ChevronLeft size={24} />
                        </button>
                        <div className="month-display-modern">
                            <h2>{months[activeMonth]}</h2>
                        </div>
                        <button className="nav-btn-modern" onClick={() => setActiveMonth((prev) => (prev < 11 ? prev + 1 : 0))}>
                            <ChevronRight size={24} />
                        </button>
                    </div>

                    <div className="seasonal-grid">
                        <div className="main-content">
                            <div className="grid grid-cols-2 gap-4">
                                {/* Professional Box */}
                                <div className="calendar-card-modern glass-card p-5">
                                    <div className="card-header-modern mb-4">
                                        <div className="icon-badge pro"><GraduationCap size={28} /></div>
                                        <div>
                                            <span className="type-label pro">Ámbito Profesional</span>
                                            <h3 className="text-xl font-bold text-text-primary mt-1">{currentData.pro.title}</h3>
                                        </div>
                                    </div>
                                    <ul className="tips-list-modern mb-4">
                                        {currentData.pro.tips.map((tip, i) => (
                                            <li key={i}><CheckSquare size={16} className="text-primary mt-1 flex-shrink-0" /> <span>{tip}</span></li>
                                        ))}
                                    </ul>
                                    <div className="focus-indicator pro">
                                        <strong>Prioridad Técnica:</strong> {currentData.pro.focus}
                                    </div>
                                </div>

                                {/* Home Box */}
                                <div className="calendar-card-modern glass-card p-5">
                                    <div className="card-header-modern mb-4">
                                        <div className="icon-badge home"><Home size={28} /></div>
                                        <div>
                                            <span className="type-label home">Ámbito Doméstico</span>
                                            <h3 className="text-xl font-bold text-text-primary mt-1">{currentData.home.title}</h3>
                                        </div>
                                    </div>
                                    <ul className="tips-list-modern mb-4">
                                        {currentData.home.tips.map((tip, i) => (
                                            <li key={i}><CheckSquare size={16} className="text-accent mt-1 flex-shrink-0" /> <span>{tip}</span></li>
                                        ))}
                                    </ul>
                                    <div className="focus-indicator home">
                                        <strong>Enfoque Práctico:</strong> {currentData.home.focus}
                                    </div>
                                </div>
                            </div>

                            {/* Products Section */}
                            <div className="products-showcase glass-card mt-5 p-5 text-center">
                                <h3 className="text-lg font-semibold mb-4 text-text-primary flex items-center justify-center gap-2">
                                    <ShoppingCart size={20} className="text-primary" /> Productos Recomendados del Mes
                                </h3>
                                <div className="products-wrap mt-2">
                                    {currentData.products.map((p, i) => (
                                        <span key={i} className="product-chip">{p}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <style jsx>{`
        .bg-darker { background: var(--color-bg-primary); }
        .month-selector-modern {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 40px;
          padding: 25px;
          border-radius: var(--radius-xl);
        }

        .month-display-modern h2 {
          font-family: var(--font-display);
          font-size: 2.25rem;
          min-width: 250px;
          text-align: center;
          margin: 0;
          color: var(--color-text-primary);
          font-weight: 700;
        }

        .nav-btn-modern {
          background: white;
          border: 1px solid var(--color-border);
          width: 50px;
          height: 50px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.3s;
          color: var(--color-text-primary);
        }

        .nav-btn-modern:hover { 
            background: var(--color-primary); 
            border-color: var(--color-primary);
            color: white;
        }

        .card-header-modern {
            display: flex;
            gap: 20px;
            align-items: center;
        }

        .icon-badge {
            width: 55px; height: 55px;
            display: flex; align-items: center; justify-content: center;
            border-radius: var(--radius-md);
            background: var(--color-bg-secondary);
        }
        .icon-badge.pro { color: var(--color-primary); }
        .icon-badge.home { color: var(--color-accent); }

        .type-label {
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 700;
        }
        .type-label.pro { color: var(--color-primary); }
        .type-label.home { color: var(--color-accent); }

        .tips-list-modern {
          list-style: none;
          padding: 0;
        }

        .tips-list-modern li {
          display: flex;
          gap: 12px;
          font-size: 0.95rem;
          color: var(--color-text-secondary);
          margin-bottom: 15px;
          line-height: 1.5;
        }

        .focus-indicator {
          padding: 12px 15px;
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border-light);
        }
        .focus-indicator.pro strong { color: var(--color-primary); }
        .focus-indicator.home strong { color: var(--color-accent); }

        .product-chip {
          display: inline-block;
          background: rgba(16, 185, 129, 0.05);
          padding: 6px 16px;
          border-radius: var(--radius-full);
          font-size: 0.85rem;
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: var(--color-primary);
          font-weight: 600;
          margin: 5px;
        }

        @media (max-width: 900px) {
          .grid-cols-2 { grid-template-columns: 1fr; }
          .month-selector-modern { gap: 20px; flex-direction: column-reverse; }
          .month-display-modern h2 { font-size: 1.75rem; min-width: auto; }
        }
      `}</style>
        </div>
    );
}
