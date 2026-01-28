import { Settings as SettingsIcon, X, Download, Upload, Cloud, Key, Database, RefreshCw, CheckCircle, AlertTriangle, Lock } from 'lucide-react'

export function SettingsView({ settings, onUpdateSettings, onExport, onImport, onNavigate }) {
  const handleChange = (field, value) => {
    onUpdateSettings({ ...settings, [field]: value })
  }

  return (
    <div className="settings-view animate-fade-in">
      <div className="settings-header py-4 bg-white border-b border-gray-200">
        <div className="container">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg text-primary">
                <SettingsIcon size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-display text-text-primary">Configuración del Sistema</h1>
                <p className="text-secondary text-sm">Parámetros globales y gestión de datos</p>
              </div>
            </div>
            <button onClick={() => onNavigate('dashboard')} className="btn btn-outline btn-sm">
              <X size={18} /> Volver al Panel
            </button>
          </div>
        </div>
      </div>

      <div className="settings-main py-8">
        <div className="container">
          <div className="settings-grid max-w-4xl mx-auto space-y-6">
            {/* Configuración General */}
            <div className="glass-card p-6 border border-gray-200">
              <h2 className="text-lg font-bold mb-6 text-text-primary flex items-center gap-2">
                <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                Preferencias Generales
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="text-xs uppercase tracking-wider font-bold text-muted mb-2 block">Nombre del Centro / Negocio</label>
                  <input
                    type="text"
                    className="w-full bg-white border border-gray-200 rounded-md p-2.5 text-text-primary focus:border-primary transition-all outline-none"
                    value={settings.businessName}
                    onChange={(e) => handleChange('businessName', e.target.value)}
                    placeholder="Ej: Escuela de Hostelería"
                  />
                </div>

                <div className="form-group">
                  <label className="text-xs uppercase tracking-wider font-bold text-muted mb-2 block">Nombre del Docente / Responsable</label>
                  <input
                    type="text"
                    className="w-full bg-white border border-gray-200 rounded-md p-2.5 text-text-primary focus:border-primary transition-all outline-none"
                    value={settings.teacherName}
                    onChange={(e) => handleChange('teacherName', e.target.value)}
                    placeholder="Nombre para documentos..."
                  />
                </div>

                <div className="form-group">
                  <label className="text-xs uppercase tracking-wider font-bold text-muted mb-2 block">Divisa de Trabajo</label>
                  <select
                    className="w-full bg-white border border-gray-200 rounded-md p-2.5 text-text-primary focus:border-primary transition-all outline-none"
                    value={settings.currency}
                    onChange={(e) => handleChange('currency', e.target.value)}
                  >
                    <option value="€">€ (Euro)</option>
                    <option value="$">$ (Dólar)</option>
                    <option value="£">£ (Libra)</option>
                    <option value="¥">¥ (Yen)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="text-xs uppercase tracking-wider font-bold text-muted mb-2 block">Tasa Impuestos (IVA %)</label>
                  <input
                    type="number"
                    className="w-full bg-white border border-gray-200 rounded-md p-2.5 text-text-primary focus:border-primary transition-all outline-none"
                    value={settings.taxRate}
                    onChange={(e) => handleChange('taxRate', parseFloat(e.target.value) || 0)}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
              </div>
            </div>

            {/* Exportar/Importar */}
            <div className="glass-card p-6 border border-gray-200">
              <h2 className="text-lg font-bold mb-6 text-text-primary flex items-center gap-2">
                <span className="w-1.5 h-6 bg-accent rounded-full"></span>
                Copias de Seguridad y Migración
              </h2>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-text-primary mb-1">Exportar Base de Datos</h3>
                    <p className="text-sm text-secondary">Descarga un paquete JSON con todas las recetas, productos y configuraciones.</p>
                  </div>
                  <button onClick={onExport} className="btn btn-primary btn-sm flex-shrink-0">
                    <Download size={18} /> Exportar
                  </button>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-text-primary mb-1">Importar Base de Datos</h3>
                    <p className="text-sm text-secondary">Restaura la aplicación desde un archivo de copia de seguridad previo.</p>
                  </div>
                  <label className="btn btn-outline btn-sm flex-shrink-0 cursor-pointer border-white/20 hover:border-primary hover:text-primary">
                    <Upload size={18} /> Importar
                    <input
                      type="file"
                      accept=".json"
                      onChange={onImport}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Seguridad de Aplicación */}
            <div className="glass-card p-6 border border-error/20 bg-error/5">
              <h2 className="text-lg font-bold mb-6 text-text-primary flex items-center gap-2">
                <Lock className="text-error" size={24} />
                Seguridad de Aplicación
              </h2>

              <div className="alert-box mb-6 p-4 bg-white/50 border border-error/10 rounded-lg text-sm text-secondary leading-relaxed">
                <p>Protege la base de productos y la configuración crítica. Si estableces un PIN, el sistema lo solicitará antes de permitir cualquier modificación.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="text-xs uppercase tracking-wider font-bold text-muted mb-2 block flex items-center gap-2">
                    <Key size={14} />
                    PIN de Gestión (Numérico)
                  </label>
                  <input
                    type="password"
                    maxLength="6"
                    className="w-full bg-white border border-gray-200 rounded-md p-2.5 text-text-primary focus:border-primary transition-all outline-none font-mono text-center text-lg"
                    value={settings.adminPin || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '')
                      handleChange('adminPin', val)
                    }}
                    placeholder="Ej: 1234"
                  />
                </div>

                <div className="form-group flex items-end pb-2.5">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={!!settings.pinEnabled}
                        onChange={(e) => handleChange('pinEnabled', e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-error"></div>
                    </div>
                    <span className="text-sm font-bold text-text-primary group-hover:text-error transition-colors">Activar Protección PIN</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información */}
              <div className="glass-card p-6 border border-gray-200">
                <h2 className="text-lg font-bold mb-4 text-text-primary">App Info</h2>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                    <span className="text-secondary">Versión Core</span>
                    <span className="text-text-primary font-mono">v1.2.5 [PRO]</span>
                  </div>
                  <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                    <span className="text-secondary">Motor</span>
                    <span className="text-text-primary">React + Vite</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2">
                    <span className="text-secondary">Persistencia</span>
                    <span className="text-primary font-bold">Encrypted LocalStore</span>
                  </div>
                </div>
              </div>

              {/* Ayuda Rápida */}
              <div className="glass-card p-6 border border-primary/20 bg-primary/5">
                <h2 className="text-lg font-bold mb-4 text-text-primary">Ayuda Técnica</h2>
                <ul className="space-y-2">
                  <li className="text-sm text-secondary flex gap-2">
                    <span className="text-primary font-bold">01.</span>
                    Utiliza el "Panel" para crear nuevas fichas técnicas.
                  </li>
                  <li className="text-sm text-secondary flex gap-2">
                    <span className="text-primary font-bold">02.</span>
                    Mantén actualizada la sección "Productos" para costes precisos.
                  </li>
                  <li className="text-sm text-secondary flex gap-2">
                    <span className="text-primary font-bold">03.</span>
                    Exporta tus datos semanalmente como medida de seguridad.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .settings-view {
          min-height: 100vh;
          background: var(--color-bg-primary);
        }

        @media (max-width: 768px) {
          .p-4.bg-white/5 { flex-direction: column; text-align: center; }
          .p-4.bg-white/5 button, .p-4.bg-white/5 label { width: 100%; }
        }
      `}</style>
    </div>
  )
}
