import React, { useState } from 'react';
import { Video, Star, Clock, Shield, PlayCircle, Filter } from 'lucide-react';

export function MicrovideosView({ filter: initialFilter = 'all' }) {
  const [activeFilter, setActiveFilter] = useState(initialFilter);

  const videos = [
    {
      id: 1,
      title: 'Cortes uniformes para producción en volumen',
      category: 'pro',
      duration: '5:20 min',
      difficulty: 'Técnico',
      tags: ['Producción', 'Cuchillo'],
      pro: true
    },
    {
      id: 2,
      title: 'Salsas madre: corrección de errores en tiempo real',
      category: 'pro',
      duration: '6:45 min',
      difficulty: 'Avanzado',
      tags: ['Salsas', 'Técnica'],
      pro: true
    },
    {
      id: 3,
      title: 'Cómo hacer un fondo casero que dure 5 días',
      category: 'home',
      duration: '3:15 min',
      difficulty: 'Básico',
      tags: ['Bases', 'Aprovechamiento'],
      pro: false
    },
    {
      id: 4,
      title: 'Montaje en frío: control de temperatura y tiempos',
      category: 'pro',
      duration: '4:30 min',
      difficulty: 'Técnico',
      tags: ['APPCC', 'Montaje'],
      pro: true
    },
    {
      id: 5,
      title: '3 errores que arruinan tu masa de pizza',
      category: 'home',
      duration: '4:10 min',
      difficulty: 'Intermedio',
      tags: ['Masas', 'Hogar'],
      pro: false
    },
    {
      id: 6,
      title: 'Gestión de mermas en cocina profesional',
      category: 'pro',
      duration: '3:50 min',
      difficulty: 'Gestión',
      tags: ['Costes', 'Eficiencia'],
      pro: true
    }
  ];

  const filteredVideos = activeFilter === 'all'
    ? videos
    : videos.filter(v => v.category === activeFilter);

  return (
    <div className="microvideos-view animate-fade-in">
      <section className="section-padding bg-darker">
        <div className="container">
          <div className="section-header text-center mb-5">
            <h1 className="hero-title mb-2">Biblioteca de Técnicas</h1>
            <p className="text-secondary opacity-80">Lecciones prácticas de alta intensidad. Domina el método profesional paso a paso.</p>
          </div>

          <div className="filter-bar mb-5">
            <button
              className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              Todos los módulos
            </button>
            <button
              className={`filter-btn ${activeFilter === 'pro' ? 'active pro' : ''}`}
              onClick={() => setActiveFilter('pro')}
            >
              <Star size={16} /> Ámbito Profesional
            </button>
            <button
              className={`filter-btn ${activeFilter === 'home' ? 'active home' : ''}`}
              onClick={() => setActiveFilter('home')}
            >
              <Video size={16} /> Ámbito Doméstico
            </button>
          </div>

          <div className="video-grid grid grid-cols-3 gap-4">
            {filteredVideos.map(video => (
              <div key={video.id} className="video-item glass-card overflow-hidden">
                <div className="video-thumbnail">
                  <div className="play-overlay">
                    <PlayCircle size={48} />
                  </div>
                  {video.pro && <div className="pro-badge">PRO</div>}
                  <div className="duration-tag">{video.duration}</div>
                </div>
                <div className="video-content p-4">
                  <div className="video-meta mb-2">
                    <span className="difficulty-badge">{video.difficulty}</span>
                    <span className="tags-text">{video.tags.join(' • ')}</span>
                  </div>
                  <h3 className="video-title">{video.title}</h3>
                  <button className="btn btn-ghost btn-sm p-0 text-primary mt-3 font-semibold">
                    Iniciar lección <Clock size={14} className="ml-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style jsx>{`
        .bg-darker { background: var(--color-bg-primary); }
        .filter-bar {
          display: flex;
          justify-content: center;
          gap: var(--spacing-md);
          flex-wrap: wrap;
        }

        .filter-btn {
          background: white;
          border: 1px solid var(--color-border);
          padding: 0.75rem 1.75rem;
          border-radius: var(--radius-full);
          font-family: var(--font-body);
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--color-text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: all 0.3s;
        }

        .filter-btn:hover {
          border-color: var(--color-primary);
          color: var(--color-primary);
          background: white;
        }

        .filter-btn.active.pro {
          background: var(--color-primary);
          color: white;
          border-color: var(--color-primary);
        }

        .filter-btn.active.home {
          background: var(--color-accent);
          color: white;
          border-color: var(--color-accent);
        }

        .filter-btn.active:not(.pro):not(.home) {
          background: var(--color-secondary);
          color: white;
          border-color: var(--color-secondary);
        }

        .video-thumbnail {
          height: 180px;
          background: #1e293b;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .play-overlay {
          color: white;
          opacity: 0.5;
          transition: 0.3s;
          z-index: 2;
        }

        .video-item:hover .play-overlay {
          transform: scale(1.1);
          opacity: 1;
          color: var(--color-primary);
        }

        .pro-badge {
          position: absolute;
          top: 15px;
          left: 15px;
          background: var(--color-primary);
          color: white;
          font-weight: 700;
          font-size: 0.65rem;
          padding: 2px 8px;
          border-radius: var(--radius-sm);
          z-index: 3;
        }

        .duration-tag {
          position: absolute;
          bottom: 12px;
          right: 12px;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          color: white;
          font-size: 0.7rem;
          padding: 2px 8px;
          border-radius: var(--radius-sm);
          z-index: 3;
        }

        .difficulty-badge {
          background: var(--color-bg-secondary);
          color: var(--color-text-muted);
          font-size: 0.65rem;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
          font-weight: 700;
        }

        .tags-text {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          margin-left: 10px;
        }

        .video-title {
          font-size: 1.1rem;
          line-height: 1.4;
          color: var(--color-text-primary);
          font-weight: 600;
        }

        @media (max-width: 900px) {
          .grid-cols-3 { grid-template-columns: 1fr 1fr; }
        }

        @media (max-width: 600px) {
          .grid-cols-3 { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
