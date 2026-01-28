import React from 'react';
import { ChefHat, GraduationCap, Home, BookOpen, Calendar, ArrowRight, Play, CheckCircle, Zap, Shield, Target } from 'lucide-react';

export function HomeView({ onNavigate }) {
  return (
    <div className="home-view animate-fade-in">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-overlay"></div>
        <div className="container hero-content">
          <div className="hero-text">
            <div className="hero-branding mb-5 animate-slide-up">
              <img src="/logo.png" alt="Organization Logo" className="hero-logo" />
            </div>
            <div className="status-badge mb-3">
              <span className="dot"></span> CONTENIDO TÉCNICO ACTUALIZADO
            </div>
            <h1 className="hero-title">Dibuja tu futuro en la cocina</h1>
            <p className="hero-subtitle">
              Formación técnica avanzada con el rigor de la alta cocina. Domina el método, controla el resultado.
            </p>
            <div className="hero-actions">
              <button className="btn btn-primary btn-lg" onClick={() => onNavigate('microvideos')}>
                <Play size={18} /> Explorar Cursos
              </button>
              <button className="btn btn-outline btn-lg" onClick={() => onNavigate('about')}>
                Enfoque Metodológico
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Bar */}
      <section className="feature-bar glass-card">
        <div className="container flex-between py-4">
          <div className="bar-item"><Shield size={20} className="text-primary" /> <span>ESTÁNDARES PROFESIONALES</span></div>
          <div className="bar-item"><Zap size={20} className="text-accent" /> <span>MÁXIMA EFICIENCIA</span></div>
          <div className="bar-item"><Target size={20} className="text-primary" /> <span>RESULTADOS TÉCNICOS</span></div>
        </div>
      </section>

      {/* Access Paths */}
      <section className="access-paths section-padding">
        <div className="container">
          <h2 className="section-title text-center mb-5">Elige tu itinerario de formación</h2>
          <div className="grid grid-cols-2 gap-5">
            {/* Professional Path */}
            <div className="path-card pro-card glass-card" onClick={() => onNavigate('microvideos', { filter: 'pro' })}>
              <div className="card-header">
                <div className="icon-box pro">
                  <GraduationCap size={40} className="text-primary" />
                </div>
                <div className="header-text">
                  <h3>Nivel Profesional</h3>
                  <span className="text-muted">Hostelería y formación técnica superior</span>
                </div>
              </div>
              <ul className="path-list">
                <li><ArrowRight size={14} className="text-primary" /> Gestión de mermas y rendimiento</li>
                <li><ArrowRight size={14} className="text-primary" /> Organización de partidas profesionales</li>
                <li><ArrowRight size={14} className="text-primary" /> Escandallos y control de costes</li>
              </ul>
              <div className="btn btn-primary w-100 mt-5">Acceder al área profesional</div>
            </div>

            {/* Domestic Path */}
            <div className="path-card home-card glass-card" onClick={() => onNavigate('microvideos', { filter: 'home' })}>
              <div className="card-header">
                <div className="icon-box home">
                  <Home size={40} className="text-accent" />
                </div>
                <div className="header-text">
                  <h3>Nivel Doméstico</h3>
                  <span className="text-muted">Optimización para entusiastas en el hogar</span>
                </div>
              </div>
              <ul className="path-list">
                <li><ArrowRight size={14} className="text-accent" /> Técnicas avanzadas adaptadas al hogar</li>
                <li><ArrowRight size={14} className="text-accent" /> Planificación semanal eficiente</li>
                <li><ArrowRight size={14} className="text-accent" /> Ciencia aplicada a la cocina diaria</li>
              </ul>
              <div className="btn btn-secondary w-100 mt-5">Ver cursos domésticos</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Content Area */}
      <section className="featured-section section-padding bg-darker">
        <div className="container">
          <div className="flex justify-between items-end mb-5">
            <div>
              <h2 className="section-title mb-2">Módulos Destacados</h2>
              <p className="text-secondary">Contenidos más valorados por nuestra comunidad</p>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => onNavigate('microvideos')}>Ver todos</button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="featured-card card">
              <div className="card-img-placeholder pro">
                <Play size={40} />
              </div>
              <div className="card-body p-3">
                <span className="badge badge-primary mb-2">MASTERCLASS</span>
                <h4>Mise en Place Profesional</h4>
                <p className="text-muted text-sm mt-1">Organización inteligente de flujos de trabajo.</p>
              </div>
            </div>
            <div className="featured-card card">
              <div className="card-img-placeholder resources">
                <BookOpen size={40} />
              </div>
              <div className="card-body p-3">
                <span className="badge badge-secondary mb-2">RECURSO TÉCNICO</span>
                <h4>Manual de Temperaturas</h4>
                <p className="text-muted text-sm mt-1">Guía indispensable de seguridad alimentaria.</p>
              </div>
            </div>
            <div className="featured-card card">
              <div className="card-img-placeholder calendar">
                <Calendar size={40} />
              </div>
              <div className="card-body p-3">
                <span className="badge badge-primary mb-2">GESTIÓN</span>
                <h4>Calendario Estacional</h4>
                <p className="text-muted text-sm mt-1">Optimización de materias primas por temporada.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
                .home-view { background: var(--color-bg-primary); }

                .hero {
                    position: relative;
                    height: 80vh;
                    background: url('/futuristic_culinary_hero_1766929273666.png') no-repeat center center;
                    background-size: cover;
                    display: flex;
                    align-items: center;
                    overflow: hidden;
                }

                .hero-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(90deg, #f8fafc 30%, transparent 70%),
                                linear-gradient(0deg, #f8fafc 0%, transparent 40%);
                    z-index: 1;
                }

                .hero-content { position: relative; z-index: 2; }
                .hero-text { max-width: 650px; padding-left: var(--spacing-xl); }
                .hero-logo { 
                    height: 90px; 
                    width: auto; 
                    object-fit: contain;
                    filter: drop-shadow(0 0 20px rgba(59, 130, 246, 0.2));
                }

                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(16, 185, 129, 0.1);
                    color: var(--color-primary);
                    padding: 6px 16px;
                    border-radius: var(--radius-full);
                    font-size: 0.75rem;
                    font-weight: 700;
                    letter-spacing: 0.5px;
                    border: 1px solid rgba(16, 185, 129, 0.2);
                }

                .dot {
                    width: 10px; height: 10px;
                    background: var(--color-primary);
                    border-radius: 50%;
                    box-shadow: var(--soft-glow);
                }

                .hero-title {
                    font-size: 3.5rem;
                    margin-bottom: var(--spacing-md);
                    line-height: 1.1;
                }

                .hero-subtitle {
                    font-size: 1.25rem;
                    color: var(--color-text-secondary);
                    margin-bottom: var(--spacing-xl);
                    line-height: 1.6;
                }

                .hero-actions { display: flex; gap: var(--spacing-md); }

                .feature-bar { margin-top: 0; position: relative; z-index: 10; border-radius: 0; border-left: none; border-right: none; }
                .flex-between { display: flex; justify-content: space-between; align-items: center; }

                .bar-item {
                    display: flex; align-items: center; gap: var(--spacing-sm);
                    font-size: 0.85rem; font-weight: 600; color: var(--color-text-primary);
                }

                .path-card {
                    padding: var(--spacing-xl);
                    cursor: pointer;
                    min-height: 380px;
                    display: flex;
                    flex-direction: column;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .path-card:hover { transform: translateY(-8px); border-color: var(--color-primary); box-shadow: var(--glass-shadow); }

                .icon-box {
                    width: 80px; height: 80px;
                    display: flex; align-items: center; justify-content: center;
                    background: var(--color-bg-secondary);
                    border-radius: var(--radius-lg);
                    margin-right: var(--spacing-lg);
                }
                .icon-box.pro { color: var(--color-primary); }
                .icon-box.home { color: var(--color-accent); }

                .path-list { list-style: none; padding: 0; margin: 0; flex: 1; }
                .path-list li {
                    display: flex; align-items: center; gap: 12px;
                    font-size: 0.95rem; color: var(--color-text-secondary);
                    margin-bottom: 12px;
                }

                .card-header h3 { font-size: 1.5rem; margin-bottom: 4px; }

                .card-img-placeholder {
                    height: 160px; display: flex; align-items: center; justify-content: center;
                    background: var(--color-bg-secondary); border-radius: var(--radius-md);
                    color: var(--color-text-muted); transition: all 0.3s;
                }
                .featured-card:hover .card-img-placeholder { background: var(--color-bg-tertiary); color: var(--color-primary); }

                .bg-darker { background: var(--color-bg-secondary); }
                .w-100 { width: 100%; }

                /* Dark Mode - Hero Section */
                .dark-mode .hero {
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
                }

                .dark-mode .hero-overlay {
                    background: linear-gradient(90deg, #0f172a 30%, transparent 70%),
                                linear-gradient(0deg, #0f172a 0%, transparent 40%);
                }

                .dark-mode .status-badge {
                    background: rgba(16, 185, 129, 0.2);
                    border-color: rgba(16, 185, 129, 0.3);
                }

                @media (max-width: 900px) {
                    .grid-cols-2 { grid-template-columns: 1fr; }
                    .flex-between { flex-direction: column; gap: var(--spacing-lg); }
                    .hero-title { font-size: 2.5rem; }
                }
            `}</style>
    </div>
  );
}
