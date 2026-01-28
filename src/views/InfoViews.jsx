import React from 'react';
import { ChefHat, Mail, Send, MapPin, Phone, GraduationCap, Users, School } from 'lucide-react';

export function AboutView() {
    return (
        <div className="about-view animate-fade-in">
            <section className="section-padding bg-darker">
                <div className="container grid grid-cols-2 gap-5 items-center">
                    <div className="about-image">
                        <div className="image-placeholder card h-100">
                            <ChefHat size={100} className="text-primary opacity-10" />
                            <p className="mt-2 text-muted text-xs">Juan Codina Barranco – Perfil Académico</p>
                        </div>
                    </div>
                    <div className="about-text">
                        <h1 className="hero-title mb-3">Formo profesionales, no influencers</h1>
                        <p className="lead-text mb-4">
                            Llevo más de 25 años enseñando a quienes quieren vivir de la cocina. No busco la fama efímera, busco la excelencia técnica.
                        </p>
                        <p className="text-secondary mb-5">
                            Mis alumnos trabajan en cocinas de todo el mundo. Porque aquí se aprende a producir bajo presión, con método y criterio.
                            Esta plataforma es la extensión digital de mi taller: rigor, orden y técnica pura.
                        </p>
                        <div className="stats-grid">
                            <div className="stat-item">
                                <strong className="text-primary">25+</strong>
                                <span>Años enseñando</span>
                            </div>
                            <div className="stat-item">
                                <strong className="text-accent">1000+</strong>
                                <span>Futuros cocineros</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <style jsx>{`
        .bg-darker { background: var(--color-bg-primary); }
        .lead-text { 
            font-size: 1.25rem; 
            font-family: var(--font-body); 
            line-height: 1.6; 
            color: var(--color-text-primary); 
            border-left: 3px solid var(--color-primary);
            padding-left: var(--spacing-md);
        }
        .image-placeholder { 
            background: var(--color-bg-secondary); 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: center; 
            min-height: 450px; 
            border: 1px solid var(--color-border);
            border-radius: var(--radius-lg);
        }
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-lg); }
        .stat-item { 
            background: white;
            padding: var(--spacing-lg);
            border-radius: var(--radius-md);
            border: 1px solid var(--color-border);
            text-align: center;
        }
        .stat-item strong { 
            display: block; 
            font-size: 2.5rem; 
            font-family: var(--font-display); 
            line-height: 1;
            margin-bottom: 8px;
        }
        .stat-item span { 
            font-size: 0.75rem; 
            text-transform: uppercase; 
            color: var(--color-text-muted); 
            font-weight: 600;
            letter-spacing: 1px;
        }
      `}</style>
        </div>
    );
}

export function ContactView() {
    return (
        <div className="contact-view animate-fade-in">
            <section className="section-padding">
                <div className="container">
                    <div className="section-header text-center mb-5">
                        <h1 className="hero-title mb-2">Contacto Directo</h1>
                        <p className="text-secondary opacity-80">Asesoramiento técnico, orientación académica o consultas profesionales.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-5 items-start">
                        {/* Contact Form */}
                        <div className="contact-form glass-card p-4">
                            <form onSubmit={e => e.preventDefault()}>
                                <div className="form-group">
                                    <label className="form-label">Interés Particular</label>
                                    <select className="form-select">
                                        <option>FORMACIÓN PROFESIONAL (Hostelería)</option>
                                        <option>COCINA DOMÉSTICA / AFICIONADO</option>
                                        <option>CONTACTO INSTITUCIONAL / EMPRESA</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="form-group">
                                        <label className="form-label">Tu Nombre</label>
                                        <input type="text" className="form-input" placeholder="Nombre completo" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Tu Email</label>
                                        <input type="email" className="form-input" placeholder="correo@ejemplo.com" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Asunto de la consulta</label>
                                    <input type="text" className="form-input" placeholder="Resumen del motivo" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Detalles del mensaje</label>
                                    <textarea className="form-textarea" rows="4" placeholder="¿En qué puedo ayudarte?"></textarea>
                                </div>
                                <button className="btn btn-primary btn-lg w-100 mt-3">
                                    Enviar Mensaje <Send size={18} className="ml-2" />
                                </button>
                            </form>
                        </div>

                        {/* Info Column */}
                        <div className="contact-info flex flex-col gap-4">
                            <div className="info-block glass-card p-4">
                                <div className="flex items-start gap-4">
                                    <div className="icon-box pro"><GraduationCap size={28} /></div>
                                    <div className="flex-1">
                                        <h3 className="text-text-primary font-display text-lg mb-1">Área Alumnos</h3>
                                        <p className="text-sm text-secondary">Acceso a fichas técnicas, protocolos y seguimiento académico personalizado.</p>
                                        <button className="btn btn-outline btn-sm mt-4">Acceder ahora</button>
                                    </div>
                                </div>
                            </div>

                            <div className="info-block glass-card p-4">
                                <div className="flex items-start gap-4">
                                    <div className="icon-box home"><Users size={28} /></div>
                                    <div className="flex-1">
                                        <h3 className="text-text-primary font-display text-lg mb-1">Colaboraciones</h3>
                                        <p className="text-sm text-secondary">Asesoría para centros educativos y auditoría técnica de procesos culinarios.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="info-block glass-card p-4 border-emerald-500">
                                <div className="flex items-start gap-4">
                                    <div className="icon-box info"><Mail size={28} /></div>
                                    <div className="flex-1">
                                        <h3 className="text-text-primary font-display text-lg mb-1">Email Directo</h3>
                                        <p className="text-primary font-medium">juan.codina@aprenderenlaweb.com</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <style jsx>{`
        .icon-box { 
            width: 60px; height: 60px; 
            display: flex; align-items: center; justify-content: center; 
            background: var(--color-bg-secondary);
            border-radius: var(--radius-md);
            flex-shrink: 0;
        }
        .icon-box.pro { color: var(--color-primary); }
        .icon-box.home { color: var(--color-accent); }
        .icon-box.info { color: var(--color-primary); background: rgba(16, 185, 129, 0.1); }
        .w-100 { width: 100%; }
        .border-emerald-500 { border-color: var(--color-primary); }
      `}</style>
        </div>
    );
}
