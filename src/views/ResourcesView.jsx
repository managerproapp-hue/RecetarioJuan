import React from 'react';
import { BarChart2, Clock, CheckSquare, Users, Info, FileText, Download, Shield } from 'lucide-react';

export function ResourcesView({ onNavigate }) {
    const proResources = [
        { title: 'Fichas técnicas de recetas', desc: 'Plantillas con porcentajes, mermas y rendimientos.', type: 'Herramienta Digital', icon: <BarChart2 size={24} /> },
        { title: 'Tiempos estándar de ejecución', desc: 'Manual de planificación de tiempos por ración.', type: 'Guía PDF', icon: <Clock size={24} /> },
        { title: 'Control de calidad sensorial', desc: 'Formatos para la evaluación técnica de platos.', type: 'Plantilla Excel', icon: <CheckSquare size={24} /> },
        { title: 'Manual de Brigada', desc: 'Organización eficiente del puesto de trabajo.', type: 'Documento PDF', icon: <Users size={24} /> },
        { title: 'Diagramas de Temperaturas', desc: 'APPCC simplificado para el taller culinario.', type: 'Infografía', icon: <Info size={24} /> }
    ];

    const homeResources = [
        { title: 'Guías: Puntos de Cocción', desc: 'Cómo reconocer el punto óptimo visualmente.', type: 'Guía Visual', icon: <FileText size={24} /> },
        { title: 'Planificadores de Compra', desc: 'Listas inteligentes para optimizar el hogar.', type: 'Plantilla PDF', icon: <Download size={24} /> },
        { title: 'Higiene y Seguridad', desc: 'Protocolos de limpieza post-cocción en casa.', type: 'Guía Técnica', icon: <CheckSquare size={24} /> }
    ];

    return (
        <div className="resources-view animate-fade-in">
            <section className="section-padding bg-darker">
                <div className="container">
                    <div className="section-header text-center mb-5">
                        <h1 className="hero-title mb-2">Recursos Formativos</h1>
                        <p className="text-secondary opacity-80">Material didáctico y herramientas profesionales para optimizar tu flujo de trabajo.</p>
                    </div>

                    <div className="resources-grid">
                        {/* Professional Section */}
                        <div className="resource-section mb-5">
                            <h2 className="section-subtitle pro mb-4">
                                <Shield size={24} /> Formación Profesional
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                {proResources.map((res, i) => (
                                    <div key={i} className="resource-card glass-card h-100">
                                        <div className="resource-icon pro">{res.icon}</div>
                                        <div className="resource-info">
                                            <div className="resource-type">{res.type}</div>
                                            <h3>{res.title}</h3>
                                            <p>{res.desc}</p>
                                            <button
                                                className="btn btn-primary btn-sm mt-3"
                                                onClick={res.title.includes('Fichas') ? () => onNavigate('student-area') : undefined}
                                            >
                                                <Download size={14} /> {res.title.includes('Fichas') ? 'Abrir Aplicación' : 'Descargar Material'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Domestic Section */}
                        <div className="resource-section">
                            <h2 className="section-subtitle home mb-4">
                                <FileText size={24} /> Formación Doméstica
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                {homeResources.map((res, i) => (
                                    <div key={i} className="resource-card glass-card h-100">
                                        <div className="resource-icon home">{res.icon}</div>
                                        <div className="resource-info">
                                            <div className="resource-type">{res.type}</div>
                                            <h3>{res.title}</h3>
                                            <p>{res.desc}</p>
                                            <button className="btn btn-secondary btn-sm mt-3">
                                                <Download size={14} /> Descargar Guía
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="footer-notice mt-5 text-center text-muted">
                        <p className="text-xs">© Aprender en la Web – Juan Codina Barranco. Material para uso docente y profesional autorizado.</p>
                    </div>
                </div>
            </section>

            <style jsx>{`
        .bg-darker { background: var(--color-bg-primary); }
        .section-subtitle {
          display: flex;
          align-items: center;
          gap: 15px;
          font-family: var(--font-display);
          font-size: 1.5rem;
          padding-bottom: 12px;
          border-bottom: 2px solid var(--color-border);
          font-weight: 600;
        }

        .section-subtitle.pro { color: var(--color-primary); }
        .section-subtitle.home { color: var(--color-accent); }

        .resource-card {
          flex-direction: row;
          gap: 20px;
          display: flex;
          align-items: flex-start;
          padding: 20px;
          border-radius: var(--radius-lg);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .resource-card:hover {
          border-color: var(--color-primary);
          transform: translateY(-4px);
          box-shadow: var(--glass-shadow);
        }

        .resource-icon {
          width: 55px;
          height: 55px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: var(--color-bg-secondary);
          border-radius: var(--radius-md);
        }

        .resource-icon.pro { color: var(--color-primary); }
        .resource-icon.home { color: var(--color-accent); }

        .resource-info h3 {
          font-size: 1.1rem;
          margin: 5px 0;
          color: var(--color-text-primary);
          font-weight: 600;
        }

        .resource-type {
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--color-text-muted);
        }

        .resource-info p {
          font-size: 0.9rem;
          color: var(--color-text-secondary);
          margin-bottom: 5px;
          line-height: 1.5;
        }

        @media (max-width: 900px) {
          .grid-cols-2 { grid-template-columns: 1fr; }
          .resource-card { flex-direction: column; align-items: center; text-align: center; }
          .resource-icon { margin-bottom: 15px; }
        }
      `}</style>
        </div>
    );
}
