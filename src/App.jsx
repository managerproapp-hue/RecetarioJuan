import { useState, useEffect } from 'react'
import {
  ChefHat, Plus, Search, Settings, Download, Upload,
  Trash2, Edit, Eye, X, Save, ShoppingCart, Calculator,
  FileText, Image as ImageIcon, DollarSign, Users,
  Clock, Printer, Home, Book, Shield, Calendar, Menu,
  Video, BookOpen, GraduationCap, Map, Info, Mail, Lock,
  Sun, Moon, Filter, ShieldAlert, CheckCheck, LogOut, LogIn, Globe,
  Cloud, RefreshCw, AlertTriangle
} from 'lucide-react'
import { EditorView } from './components/EditorView'
import { DetailView } from './components/DetailView'
import { ProductsView } from './components/ProductsView'
import { SettingsView } from './components/SettingsView'
import { MenuPlannerView } from './components/MenuPlannerView'
import { HomeView } from './views/HomeView'
import { MicrovideosView } from './views/MicrovideosView'
import { ResourcesView } from './views/ResourcesView'
import { GlossaryView } from './views/GlossaryView'
import { CalendarView } from './views/CalendarView'
import { createRecipe, INITIAL_PRODUCTS, calculateRecipeAllergens, ALLERGENS } from './utils/dataModels'
import { AllergenBadges } from './components/AllergenModal'
import { getSupabase } from './utils/supabaseClient'

function App() {
  // Estado principal
  const [currentView, setCurrentView] = useState('home')
  const [viewParams, setViewParams] = useState({})
  const [recipes, setRecipes] = useState([])
  const [productDatabase, setProductDatabase] = useState(INITIAL_PRODUCTS)
  const [currentRecipe, setCurrentRecipe] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [settings, setSettings] = useState({
    businessName: 'Aprender en la Web',
    currency: '€',
    taxRate: 21,
    teacherName: 'Juan Codina Barranco',
    supabaseUrl: '',
    supabaseKey: '',
    darkMode: false,
    excludedAllergens: [],
    adminPin: '',
    pinEnabled: false
  })
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [viewedContent, setViewedContent] = useState([])
  const [syncStatus, setSyncStatus] = useState('idle') // idle, syncing, success, error

  // Cargar datos del localStorage
  useEffect(() => {
    const savedRecipes = localStorage.getItem('recipes')
    const savedProducts = localStorage.getItem('productDatabase')
    const savedSettings = localStorage.getItem('settings')

    if (savedRecipes) setRecipes(JSON.parse(savedRecipes))
    if (savedProducts) {
      setProductDatabase(JSON.parse(savedProducts))
    } else {
      import('./data/products-database.json')
        .then(module => {
          const initialProducts = module.default || module
          setProductDatabase(initialProducts)
        })
        .catch(() => {
          setProductDatabase(INITIAL_PRODUCTS)
        })
    }
    if (savedSettings) setSettings(JSON.parse(savedSettings))

    // Escuchar cambios de autenticación
    const sb = getSupabase(settings.supabaseUrl, settings.supabaseKey)
    if (sb) {
      sb.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null)
      })

      const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null)
      })

      return () => subscription.unsubscribe()
    }
  }, [settings.supabaseUrl, settings.supabaseKey])

  // Guardar datos en localStorage
  useEffect(() => {
    localStorage.setItem('recipes', JSON.stringify(recipes))
  }, [recipes])

  useEffect(() => {
    localStorage.setItem('productDatabase', JSON.stringify(productDatabase))
  }, [productDatabase])

  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify(settings))

    // Aplicar Modo Oscuro
    if (settings.darkMode) {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }

    // Cada vez que cambian los ajustes de Supabase, intentamos sincronizar
    if (settings.supabaseUrl && settings.supabaseKey) {
      handleSync()
    }
  }, [settings])

  const toggleDarkMode = () => {
    setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }))
  }

  const toggleAllergenFilter = (allergen) => {
    setSettings(prev => {
      const current = prev.excludedAllergens || []
      const updated = current.includes(allergen)
        ? current.filter(a => a !== allergen)
        : [...current, allergen]
      return { ...prev, excludedAllergens: updated }
    })
  }

  // LÓGICA DE SINCRONIZACIÓN SUPABASE
  const handleSync = async () => {
    const sb = getSupabase(settings.supabaseUrl, settings.supabaseKey)
    if (!sb) return

    setSyncStatus('syncing')
    try {
      // Intentar cargar recetas (Mías y Públicas)
      const { data: cloudRecipes, error: rError } = await sb
        .from('recipes')
        .select('*')

      if (rError) throw rError
      if (cloudRecipes && cloudRecipes.length > 0) {
        // En un entorno multi-usuario, esto se filtraría más adelante
        setRecipes(cloudRecipes.map(r => r.data))
      }

      // Intentar cargar productos
      const { data: cloudProducts, error: pError } = await sb.from('products').select('*')
      if (pError) throw pError
      if (cloudProducts && cloudProducts.length > 0) {
        setProductDatabase(cloudProducts.map(p => p.data))
      }

      setSyncStatus('success')
    } catch (err) {
      console.error('Error de sincronización:', err)
      setSyncStatus('error')
    }
  }

  const handleLogin = async () => {
    const sb = getSupabase(settings.supabaseUrl, settings.supabaseKey)
    if (!sb) {
      alert('⚠️ Configura Supabase en Ajustes primero')
      navigate('settings')
      return
    }
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    })
    if (error) alert('Error al iniciar sesión: ' + error.message)
  }

  const handleLogout = async () => {
    const sb = getSupabase(settings.supabaseUrl, settings.supabaseKey)
    if (sb) await sb.auth.signOut()
    setUser(null)
  }

  const markAsViewed = (contentId) => {
    if (!viewedContent.includes(contentId)) {
      const updated = [...viewedContent, contentId]
      setViewedContent(updated)
      localStorage.setItem('viewedContent', JSON.stringify(updated))
    }
  }

  // Cargar progreso guardado
  useEffect(() => {
    const saved = localStorage.getItem('viewedContent')
    if (saved) setViewedContent(JSON.parse(saved))
  }, [])

  const pushToCloud = async (table, id, data) => {
    const sb = getSupabase(settings.supabaseUrl, settings.supabaseKey)
    if (!sb) return

    try {
      const { error } = await sb
        .from(table)
        .upsert({ id, data, updated_at: new Date().toISOString() })
      if (error) throw error
    } catch (err) {
      console.error(`Error al subir a ${table}:`, err)
    }
  }

  const removeFromCloud = async (table, id) => {
    const sb = getSupabase(settings.supabaseUrl, settings.supabaseKey)
    if (!sb) return

    try {
      const { error } = await sb.from(table).delete().eq('id', id)
      if (error) throw error
    } catch (err) {
      console.error(`Error al eliminar de ${table}:`, err)
    }
  }

  // Navegación con parámetros
  const navigate = (view, params = {}) => {
    setCurrentView(view)
    setViewParams(params)
    window.scrollTo(0, 0)
  }

  // Funciones CRUD para recetas
  const handleCreateRecipe = () => {
    const newRecipe = createRecipe()
    setCurrentRecipe(newRecipe)
    navigate('editor')
  }

  const saveRecipe = (recipe) => {
    if (recipes.find(r => r.id === recipe.id)) {
      setRecipes(recipes.map(r => r.id === recipe.id ? recipe : r))
    } else {
      setRecipes([...recipes, recipe])
    }

    // Cloud Sync
    pushToCloud('recipes', recipe.id, recipe)

    navigate('student-area')
    setCurrentRecipe(null)
  }

  const editRecipe = (recipe) => {
    setCurrentRecipe(recipe)
    navigate('editor')
  }

  const deleteRecipe = (id) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta receta?')) {
      setRecipes(recipes.filter(r => r.id !== id))
      // Cloud Sync
      removeFromCloud('recipes', id)
    }
  }

  const viewRecipe = (recipe) => {
    setCurrentRecipe(recipe)
    navigate('detail')
  }

  // Funciones para productos
  const updateProductDatabase = (newDatabase) => {
    setProductDatabase(newDatabase)
  }

  const handleAddProduct = (product) => {
    const newProduct = { ...product, id: `prod_${Date.now()}` }
    const newDb = [...productDatabase, newProduct]
    setProductDatabase(newDb)

    // Cloud Sync: En productos subimos la base de datos completa o por ID
    // Para simplificar y mantener integridad, subimos el producto individual
    pushToCloud('products', newProduct.id, newProduct)
  }

  const handleUpdateProduct = (id, updatedProduct) => {
    const newDb = productDatabase.map(p => p.id === id ? { ...p, ...updatedProduct } : p)
    setProductDatabase(newDb)

    const product = newDb.find(p => p.id === id)
    if (product) pushToCloud('products', id, product)
  }

  const handleDeleteProduct = (id) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      setProductDatabase(productDatabase.filter(p => p.id !== id))
      // Cloud Sync
      removeFromCloud('products', id)
    }
  }

  // Exportar/Importar datos
  const exportData = () => {
    const data = {
      recipes,
      productDatabase,
      settings,
      exportDate: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `aprender-web-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importData = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result)
          if (data.recipes) setRecipes(data.recipes)
          if (data.productDatabase) setProductDatabase(data.productDatabase)
          if (data.settings) setSettings(data.settings)
          alert('Datos importados correctamente')
        } catch (error) {
          alert('Error al importar los datos')
        }
      }
      reader.readAsText(file)
    }
  }

  // Filtrar recetas por nombre, categoría, ingredientes, ALÉRGENOS EXCLUIDOS y VISIBILIDAD SOCIAL
  const filteredRecipes = recipes.filter(recipe => {
    // 0. Filtro de Visibilidad Social (si hay usuario logueado)
    if (user) {
      const isMine = recipe.authorId === user.id
      const isPublished = recipe.isPublished === true
      if (!isMine && !isPublished) return false // Ocultar recetas privadas de otros
    }

    // 1. Filtro de Alérgenos Global
    const hasExcludedAllergen = recipe.elaborations?.some(elab =>
      elab.ingredients.some(ing => {
        const product = productDatabase.find(p => p.name === ing.product)
        const allergens = product?.allergens || []
        return allergens.some(a => settings.excludedAllergens?.includes(a))
      })
    )
    if (hasExcludedAllergen) return false

    // 2. Búsqueda por texto
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = recipe.name.toLowerCase().includes(searchLower);
    const categoryMatch = recipe.category?.toLowerCase().includes(searchLower);
    const ingredientsMatch = recipe.elaborations?.some(elab =>
      elab.ingredients.some(ing => ing.product.toLowerCase().includes(searchLower))
    );
    return nameMatch || categoryMatch || ingredientsMatch;
  })

  return (
    <div className="app">
      <Navbar
        currentView={currentView}
        onNavigate={navigate}
        syncStatus={syncStatus}
        onToggleDark={toggleDarkMode}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      <main className="main-content" style={{ paddingTop: '80px' }}>
        {currentView === 'home' && <HomeView onNavigate={navigate} />}

        {currentView === 'microvideos' && <MicrovideosView filter={viewParams.filter} />}

        {currentView === 'resources' && <ResourcesView onNavigate={navigate} />}

        {currentView === 'routes' && <PlaceholderView title="Rutas de Aprendizaje" icon={<Map size={48} />} />}

        {currentView === 'glossary' && <GlossaryView />}

        {currentView === 'calendar' && <CalendarView />}

        {currentView === 'about' && <AboutView />}

        {currentView === 'contact' && <ContactView />}

        {(currentView === 'student-area' || currentView === 'dashboard') && (
          <>
            <AllergenFilterBar
              excluded={settings.excludedAllergens}
              onToggle={toggleAllergenFilter}
            />
            <DashboardView
              recipes={filteredRecipes}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onCreateRecipe={handleCreateRecipe}
              onEditRecipe={editRecipe}
              onDeleteRecipe={deleteRecipe}
              onViewRecipe={viewRecipe}
              onNavigate={navigate}
              settings={settings}
              user={user}
              viewedContent={viewedContent}
              onMarkAsViewed={markAsViewed}
            />
          </>
        )}

        {currentView === 'editor' && (
          <EditorView
            recipe={currentRecipe}
            productDatabase={productDatabase}
            onSave={saveRecipe}
            onCancel={() => navigate('student-area')}
            onUpdateProductDatabase={updateProductDatabase}
            settings={settings}
            user={user}
          />
        )}

        {currentView === 'detail' && (
          <DetailView
            recipe={currentRecipe}
            productDatabase={productDatabase}
            onEdit={() => editRecipe(currentRecipe)}
            onClose={() => navigate('student-area')}
            settings={settings}
          />
        )}

        {currentView === 'products' && (
          <ProductsView
            products={productDatabase}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onImportProducts={updateProductDatabase}
            onNavigate={navigate}
            settings={settings}
            isAdminAuthenticated={isAdminAuthenticated}
            setIsAdminAuthenticated={setIsAdminAuthenticated}
          />
        )}

        {currentView === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={setSettings}
            onExport={exportData}
            onImport={importData}
            onNavigate={navigate}
          />
        )}

        {currentView === 'menu-planner' && (
          <MenuPlannerView
            recipes={recipes}
            onNavigate={navigate}
            settings={settings}
          />
        )}
      </main>

      <Footer onNavigate={navigate} />

      <style jsx>{`
        .app {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        .main-content {
          flex: 1;
        }
      `}</style>
    </div>
  )
}

// ============================================
// NAVBAR COMPONENT
// ============================================
function Navbar({ currentView, onNavigate, syncStatus, darkMode, onToggleDark, user, onLogin, onLogout }) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { id: 'home', label: 'Inicio', icon: <Home size={18} /> },
    { id: 'microvideos', label: 'Microvídeos', icon: <Video size={18} /> },
    { id: 'resources', label: 'Recursos', icon: <BookOpen size={18} /> },
    { id: 'routes', label: 'Rutas', icon: <Map size={18} /> },
    { id: 'glossary', label: 'Glosario', icon: <Book size={18} /> },
    { id: 'calendar', label: 'Calendario', icon: <Calendar size={18} /> },
  ]

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container nav-content">
        <div className="nav-logo" onClick={() => onNavigate('home')}>
          <img src="/logo.png" alt="JCB Logo" className="logo-img" />
          <div className="logo-text">
            <span className="site-name">Aprender en la Web</span>
            <span className="site-author">Juan Codina Barranco</span>
          </div>
        </div>

        <div className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-link ${currentView === item.id ? 'active' : ''}`}
              onClick={() => { onNavigate(item.id); setIsMenuOpen(false); }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
          <button
            className="btn btn-primary btn-sm btn-student"
            onClick={() => { onNavigate('student-area'); setIsMenuOpen(false); }}
          >
            <ChefHat size={16} />
            Recetario
          </button>

          <div className="nav-actions-group">
            <div className="nav-actions">
              <button
                className="theme-toggle"
                onClick={onToggleDark}
                title={darkMode ? "Cambiar a Modo Claro" : "Cambiar a Modo Noche"}
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <div className="sync-indicator-wrapper">
                {syncStatus === 'syncing' && (
                  <div className="sync-badge syncing" title="Sincronizando con la nube...">
                    <RefreshCw size={14} className="animate-spin" />
                  </div>
                )}
                {syncStatus === 'success' && (
                  <div className="sync-badge success" title="Sincronizado">
                    <Cloud size={14} />
                  </div>
                )}
                {syncStatus === 'error' && (
                  <div className="sync-badge error" title="Error de conexión">
                    <AlertTriangle size={14} />
                  </div>
                )}
              </div>
            </div>

            <div className="user-profile-nav">
              {user ? (
                <div className="user-dropdown">
                  <img
                    src={user.user_metadata.avatar_url}
                    alt={user.user_metadata.full_name}
                    className="user-avatar"
                  />
                  <button onClick={onLogout} className="btn-logout" title="Cerrar sesión">
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <button onClick={onLogin} className="btn-login-google" title="Entrar con Google">
                  <LogIn size={18} />
                  <span>Entrar</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <button className="menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <Menu size={24} />
        </button>
      </div>

      <style jsx>{`
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--color-border);
          padding: var(--spacing-md) 0;
          transition: all var(--transition-base);
        }
        
        .navbar.scrolled {
          background: rgba(255, 255, 255, 0.95);
          padding: var(--spacing-sm) 0;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        }

        .nav-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .nav-logo {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          cursor: pointer;
          color: var(--color-primary);
        }

        .logo-img {
          height: 42px;
          width: auto;
          object-fit: contain;
          filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.3));
        }

        .nav-actions-group {
          display: flex;
          align-items: center;
          gap: var(--spacing-lg);
          margin-left: var(--spacing-md);
          padding-left: var(--spacing-md);
          border-left: 1px solid var(--color-border);
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .user-profile-nav {
          display: flex;
          align-items: center;
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid var(--color-primary);
          cursor: pointer;
          transition: transform 0.2s;
        }

        .user-avatar:hover {
          transform: scale(1.1);
        }

        .user-dropdown {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .btn-logout, .btn-login-google {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: var(--radius-md);
          font-size: 0.8rem;
          font-weight: 600;
          transition: all 0.2s;
        }

        .btn-logout {
          background: var(--color-bg-secondary);
          color: var(--color-text-secondary);
          border: 1px solid var(--color-border);
        }

        .btn-logout:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.2);
        }

        .btn-login-google {
          background: var(--color-primary);
          color: white;
          border: none;
        }

        .btn-login-google:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .sync-indicator-wrapper {
          display: flex;
          align-items: center;
        }

        .sync-badge {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
        }

        .sync-badge.syncing {
          color: var(--color-primary);
          background: var(--color-bg-tertiary);
        }

        .sync-badge.success {
          color: var(--color-primary);
          opacity: 0.7;
        }

        .sync-badge.error {
          color: var(--color-warning);
          background: rgba(245, 158, 11, 0.1);
        }

        .theme-toggle {
          background: none;
          border: none;
          color: var(--color-text-secondary);
          cursor: pointer;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
        }

        .theme-toggle:hover {
          background: var(--color-bg-tertiary);
          color: var(--color-primary);
        }

        .logo-text {
          display: flex;
          flex-direction: column;
        }

        .site-name {
          font-family: var(--font-display);
          font-size: 1.1rem;
          font-weight: 700;
          line-height: 1.1;
          color: var(--color-text-primary);
          letter-spacing: 0.5px;
        }

        .site-author {
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: var(--color-primary);
          font-weight: 600;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: var(--spacing-lg);
        }

        .nav-link {
          background: none;
          border: none;
          font-family: var(--font-body);
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--color-text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          transition: all 0.3s;
          padding: var(--spacing-xs) 0;
        }

        .nav-link:hover, .nav-link.active {
          color: var(--color-primary);
        }

        .btn-student {
          border-radius: var(--radius-md);
          font-weight: 600;
        }

        .menu-toggle {
          display: none;
          background: none;
          border: none;
          color: var(--color-text-primary);
          cursor: pointer;
        }

        @media (max-width: 1024px) {
          .nav-links { display: none; }
          .menu-toggle { display: block; }
          
          .nav-links.open {
            display: flex;
            flex-direction: column;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: var(--color-bg-primary);
            padding: var(--spacing-lg);
            border-bottom: 1px solid var(--color-border);
            box-shadow: var(--shadow-lg);
          }

          .nav-actions-group {
            margin-left: 0;
            padding-left: 0;
            border-left: none;
            flex-direction: row;
            justify-content: center;
            padding-top: var(--spacing-sm);
            border-top: 1px solid var(--color-border);
          }
        }
      `}</style>
    </nav>
  )
}

// ============================================
// FOOTER COMPONENT
// ============================================
function Footer({ onNavigate }) {
  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-intro">
          <div className="nav-logo mb-2">
            <img src="/logo.png" alt="Logo" className="logo-img-footer" />
            <span className="site-name">Aprender en la Web</span>
          </div>
          <p className="footer-desc">
            Formación técnica culinaria rigurosa bajo los estándares de la cocina profesional.
            Sin atajos, con método.
          </p>
        </div>

        <div className="footer-links">
          <h4>Explorar</h4>
          <button onClick={() => onNavigate('microvideos')}>Microvídeos</button>
          <button onClick={() => onNavigate('resources')}>Recursos</button>
          <button onClick={() => onNavigate('routes')}>Rutas</button>
          <button onClick={() => onNavigate('glossary')}>Glosario</button>
        </div>

        <div className="footer-info">
          <h4>Juan Codina Barranco</h4>
          <button onClick={() => onNavigate('about')}>Sobre mí</button>
          <button onClick={() => onNavigate('contact')}>Contacto / Orientación</button>
          <p className="footer-address mt-2">Profesor de Cocina y Pastelería desde 1999</p>
        </div>
      </div>

      <div className="footer-bottom mt-4">
        <div className="container">
          <p>© {new Date().getFullYear()} Aprender en la Web – Juan Codina Barranco. Todos los derechos reservados.</p>
        </div>
      </div>

      <style jsx>{`
        .footer {
          background: var(--color-secondary);
          color: white;
          padding: var(--spacing-2xl) 0 var(--spacing-lg);
          margin-top: auto;
          border-top: 1px solid var(--color-border);
        }

        .footer-content {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: var(--spacing-2xl);
        }

        .footer-intro .nav-logo {
          color: var(--color-primary);
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .logo-img-footer {
          height: 32px;
          width: auto;
          object-fit: contain;
        }

        .footer-intro .site-name {
          color: white;
          font-family: var(--font-display);
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .footer-desc {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          max-width: 400px;
          margin-top: var(--spacing-md);
          line-height: 1.8;
        }

        .footer h4 {
          font-family: var(--font-display);
          font-size: 0.9rem;
          margin-bottom: var(--spacing-lg);
          color: var(--color-accent);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .footer button {
          display: block;
          background: none;
          border: none;
          color: var(--color-text-secondary);
          font-size: 0.9rem;
          margin-bottom: var(--spacing-sm);
          cursor: pointer;
          transition: 0.3s;
          padding: 0;
          font-family: var(--font-body);
        }

        .footer button:hover {
          color: var(--color-primary);
          padding-left: 4px;
        }

        .footer-address {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          margin-top: var(--spacing-md);
        }

        .footer-bottom {
          padding-top: var(--spacing-lg);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          text-align: center;
          font-size: 0.75rem;
          color: var(--color-text-muted);
          letter-spacing: 0.5px;
        }

        @media (max-width: 768px) {
          .footer-content { grid-template-columns: 1fr; gap: var(--spacing-xl); }
        }
      `}</style>
    </footer>
  )
}

// ============================================
// ALLERGEN FILTER BAR
// ============================================
function AllergenFilterBar({ excluded, onToggle }) {
  return (
    <div className="allergen-filter-bar">
      <div className="container">
        <div className="filter-content">
          <div className="filter-header">
            <ShieldAlert size={18} className="text-primary" />
            <span className="filter-title">Filtro de Seguridad Alimentaria</span>
            {excluded.length > 0 && (
              <span className="filter-count">{excluded.length} alérgenos evitados</span>
            )}
          </div>
          <div className="allergen-pills">
            {ALLERGENS.map(allergen => (
              <button
                key={allergen.id}
                className={`allergen-pill ${excluded.includes(allergen.id) ? 'active' : ''}`}
                onClick={() => onToggle(allergen.id)}
              >
                <Shield size={12} className="inline-block mr-1 opacity-70" />
                {allergen.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .allergen-filter-bar {
          background: var(--color-bg-card);
          border-bottom: 1px solid var(--color-border);
          padding: var(--spacing-sm) 0;
          margin-bottom: var(--spacing-md);
        }
        .filter-content {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }
        .filter-header {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
        }
        .filter-title {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--color-text-secondary);
        }
        .filter-count {
          font-size: 0.7rem;
          background: var(--color-warning);
          color: white;
          padding: 2px 8px;
          border-radius: var(--radius-full);
          font-weight: 600;
        }
        .allergen-pills {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-xs);
        }
        .allergen-pill {
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border);
          color: var(--color-text-secondary);
          padding: 4px 12px;
          border-radius: var(--radius-full);
          font-size: 0.7rem;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
        }
        .allergen-pill:hover {
          border-color: var(--color-primary);
          color: var(--color-primary);
        }
        .allergen-pill.active {
          background: var(--color-error);
          border-color: var(--color-error);
          color: white;
        }
      `}</style>
    </div>
  )
}

// ============================================
// PLACEHOLDER VIEW
// ============================================
function PlaceholderView({ title, icon }) {
  return (
    <div className="placeholder-view section-padding text-center">
      <div className="container">
        <div className="placeholder-icon mb-4">{icon}</div>
        <h2 className="section-title mb-3">{title}</h2>
        <p className="text-secondary max-width-md mx-auto">Esta sección está actualmente en desarrollo. Estamos preparando los mejores contenidos técnicos para tu formación.</p>
        <button className="btn btn-outline mt-5" onClick={() => window.history.back()}>
          Volver al Inicio
        </button>
      </div>
      <style jsx>{`
        .placeholder-view {
          padding: var(--spacing-2xl) 0;
          min-height: 60vh;
          display: flex;
          align-items: center;
        }
        .placeholder-icon {
          color: var(--color-primary);
          display: inline-block;
          animation: pulse-glow 2s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// ============================================
// LOGIN VIEW
// ============================================
function LoginView({ onLogin, settings }) {
  return (
    <div className="login-container">
      <div className="login-card glass-card">
        <div className="login-header">
          <div className="login-icon-box mb-4">
            <GraduationCap size={48} className="text-primary" />
          </div>
          <h1 className="font-display text-2xl mb-2">Aula Virtual</h1>
          <p className="text-secondary text-sm">Escuela de Formación Técnica – Juan Codina Barranco</p>
        </div>

        <button onClick={onLogin} className="btn btn-primary btn-lg mt-5 w-100">
          Iniciar sesión de alumno
        </button>

        <div className="login-features">
          <div className="feature-item">
            <BookOpen size={24} className="text-primary" />
            <span>Mis Recetas</span>
          </div>
          <div className="feature-item">
            <Calculator size={24} className="text-accent" />
            <span>Escandallos</span>
          </div>
          <div className="feature-item">
            <Shield size={24} className="text-primary" />
            <span>APPCC Taller</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 80vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-lg);
        }
        
        .login-card {
            max-width: 450px;
            width: 100%;
            padding: var(--spacing-2xl);
            text-align: center;
            border-radius: var(--radius-lg);
        }
        
        .login-icon-box {
            display: inline-flex;
            width: 80px; height: 80px;
            align-items: center; justify-content: center;
            background: var(--color-bg-secondary);
            border-radius: var(--radius-full);
            color: var(--color-primary);
        }

        .login-features {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--spacing-lg);
          margin-top: var(--spacing-2xl);
          padding-top: var(--spacing-xl);
          border-top: 1px solid var(--color-border-light);
        }
        
        .feature-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: var(--color-text-secondary);
          font-size: 0.75rem;
          font-weight: 500;
        }
        .w-100 { width: 100%; }
      `}</style>
    </div>
  )
}

// ============================================
// DASHBOARD VIEW
// ============================================
function DashboardView({ recipes, searchTerm, setSearchTerm, onCreateRecipe, onEditRecipe, onDeleteRecipe, onViewRecipe, onNavigate, settings, user, viewedContent, onMarkAsViewed }) {
  return (
    <div className="dashboard section-padding">
      <div className="container">
        <header className="dashboard-header-simple mb-5">
          <div className="header-left">
            <h1 className="hero-title mb-1">Panel de Control</h1>
            <p className="text-secondary opacity-70">Biblioteca Personal de Fichas Técnicas</p>
          </div>

          <div className="header-actions">
            <button onClick={() => onNavigate('products')} className="btn btn-outline btn-sm">
              <ShoppingCart size={16} /> Productos
            </button>
            <button onClick={() => onNavigate('menu-planner')} className="btn btn-outline btn-sm">
              <Calendar size={16} /> Planificador
            </button>
            <button onClick={() => onNavigate('settings')} className="btn btn-outline btn-sm">
              <Settings size={16} /> Ajustes
            </button>
          </div>
        </header>

        <div className="dashboard-toolbar mb-5">
          <div className="search-box-modern">
            <Search size={20} className="text-muted" />
            <input
              type="text"
              placeholder="Buscar receta por nombre o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input-modern"
            />
          </div>

          <button onClick={onCreateRecipe} className="btn btn-primary">
            <Plus size={20} /> Crear Nueva Ficha
          </button>
        </div>

        <div className="recipes-stats mb-5">
          <div className="stat-card glass-card">
            <BookOpen size={24} className="text-primary" />
            <div>
              <div className="stat-value">{recipes.length}</div>
              <div className="stat-label">Recetas guardadas</div>
            </div>
          </div>
          <div className="stat-card glass-card">
            <ShoppingCart size={24} className="text-accent" />
            <div>
              <div className="stat-value">
                {JSON.parse(localStorage.getItem('productDatabase') || '[]').length}
              </div>
              <div className="stat-label">Base de productos</div>
            </div>
          </div>
          <div className="stat-card glass-card">
            <Calculator size={24} className="text-primary" />
            <div>
              <div className="stat-value">{recipes.reduce((sum, r) => sum + (r.yield?.amount || 0), 0)}</div>
              <div className="stat-label">Producción total (Racs)</div>
            </div>
          </div>
        </div>

        {recipes.length === 0 ? (
          <div className="empty-state glass-card text-center p-5">
            <ChefHat size={64} className="text-primary mb-4 mx-auto opacity-20" />
            <h3 className="font-display text-xl text-text-primary">No hay recetas guardadas</h3>
            <p className="text-secondary text-sm mb-5 mt-2">Comienza creando tu primera ficha técnica profesional.</p>
            <button onClick={onCreateRecipe} className="btn btn-primary">
              <Plus size={20} /> Crear mi primera ficha
            </button>
          </div>
        ) : (
          <div className="recipes-grid">
            {recipes.map(recipe => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onView={() => {
                  onMarkAsViewed?.(recipe.id)
                  onViewRecipe(recipe)
                }}
                onEdit={() => onEditRecipe(recipe)}
                onDelete={() => onDeleteRecipe(recipe.id)}
                settings={settings}
                isViewed={viewedContent?.includes(recipe.id)}
                user={user}
              />
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .dashboard-header-simple {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: var(--spacing-lg);
          padding-bottom: var(--spacing-xl);
          border-bottom: 1px solid var(--color-border);
        }

        .header-actions {
          display: flex;
          gap: var(--spacing-sm);
        }

        .dashboard-toolbar {
          display: flex;
          gap: var(--spacing-lg);
          align-items: center;
        }

        .search-box-modern {
          flex: 1;
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          background: white;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 0 var(--spacing-lg);
          transition: all 0.3s;
        }
        .search-box-modern:focus-within {
          border-color: var(--color-primary);
          background: white;
          box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
        }

        .search-input-modern {
          flex: 1;
          border: none;
          background: transparent;
          padding: 0.85rem 0;
          color: var(--color-text-primary);
          outline: none;
          font-size: 0.95rem;
        }

        .recipes-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--spacing-lg);
        }

        .stat-card {
          padding: var(--spacing-lg) var(--spacing-xl);
          display: flex;
          align-items: center;
          gap: var(--spacing-lg);
          border-radius: var(--radius-lg);
        }

        .stat-value {
          font-family: var(--font-display);
          font-size: 2rem;
          font-weight: 700;
          line-height: 1;
          color: var(--color-text-primary);
        }

        .stat-label {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          font-weight: 500;
          margin-top: 4px;
        }
        
        .empty-state {
            border-radius: var(--radius-xl);
        }

        .recipes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: var(--spacing-xl);
        }

        @media (max-width: 900px) {
            .recipes-stats { grid-template-columns: 1fr; }
            .dashboard-header-simple { flex-direction: column; align-items: flex-start; }
            .dashboard-toolbar { flex-direction: column; }
            .search-box-modern { width: 100%; }
        }
      `}</style>
    </div>
  )
}

// ============================================
// RECIPE CARD COMPONENT
// ============================================
function RecipeCard({ recipe, onView, onEdit, onDelete, settings, isViewed, user }) {
  const allergens = calculateRecipeAllergens(recipe)

  return (
    <div className="recipe-card glass-card">
      <div className="recipe-image">
        {recipe.finalImage ? (
          <img src={recipe.finalImage} alt={recipe.name} />
        ) : (
          <div className="recipe-image-placeholder">
            <ImageIcon size={48} className="opacity-20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display text-xs tracking-widest opacity-40 uppercase">NO_SIGNAL</span>
            </div>
          </div>
        )}
        <div className="recipe-overlay">
          <button onClick={onView} className="btn-action primary">
            <Eye size={18} />
          </button>
          <button onClick={onEdit} className="btn-action secondary">
            <Edit size={18} />
          </button>
          <button onClick={onDelete} className="btn-action danger">
            <Trash2 size={18} />
          </button>
        </div>
        {isViewed && (
          <div className="viewed-badge">
            <CheckCheck size={16} />
          </div>
        )}
        {recipe.isPublished && recipe.authorName && (
          <div className="author-badge">
            <Globe size={12} />
            <span>{recipe.authorName}</span>
          </div>
        )}
      </div>

      <div className="recipe-content p-4">
        <h3 className="recipe-title-modern mb-2">{recipe.name || 'Sin título'}</h3>
        <div className="recipe-tags mb-4">
          {recipe.category && <span className="badge-modern">{recipe.category}</span>}
          <AllergenBadges allergens={allergens} />
        </div>

        <div className="recipe-meta-modern">
          {recipe.yield && (
            <div className="meta-item-modern">
              <Users size={14} />
              <span>{recipe.yield.amount} {recipe.yield.unit}</span>
            </div>
          )}
          {recipe.elaborations && (
            <div className="meta-item-modern">
              <Book size={14} />
              <span>{recipe.elaborations.length} Elab.</span>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .recipe-card {
           position: relative;
           overflow: hidden;
           border-radius: var(--radius-lg);
           transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .recipe-card:hover {
            border-color: var(--color-primary);
            transform: translateY(-4px);
            box-shadow: var(--glass-shadow);
        }

        .recipe-image {
          position: relative;
          width: 100%;
          height: 180px;
          background: var(--color-bg-secondary);
        }
        
        .recipe-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 1;
        }
        
        .recipe-image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-bg-tertiary);
          color: var(--color-text-muted);
        }

        .recipe-overlay {
          position: absolute;
          inset: 0;
          background: rgba(15, 23, 42, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          opacity: 0;
          transition: 0.3s;
          backdrop-filter: blur(4px);
        }

        .recipe-card:hover .recipe-overlay { opacity: 1; }

        .btn-action {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: var(--radius-md);
            border: 1px solid rgba(255,255,255,0.2);
            background: rgba(15, 23, 42, 0.6);
            color: white;
            cursor: pointer;
            transition: 0.2s;
        }

        .btn-action.primary:hover { background: var(--color-primary); border-color: var(--color-primary); }
        .btn-action.secondary:hover { background: var(--color-accent); border-color: var(--color-accent); }
        .btn-action.danger:hover { background: var(--color-error); border-color: var(--color-error); }

        .recipe-title-modern {
            font-family: var(--font-display);
            font-size: 1.15rem;
            font-weight: 600;
            color: var(--color-text-primary);
        }

        .badge-modern {
            font-size: 0.7rem;
            color: var(--color-accent);
            background: rgba(59, 130, 246, 0.1);
            padding: 2px 8px;
            border-radius: var(--radius-sm);
            font-weight: 600;
        }

        .recipe-meta-modern {
          display: flex;
          gap: 15px;
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid var(--color-border-light);
        }

        .meta-item-modern {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: var(--color-text-secondary);
          font-weight: 500;
        }

        .viewed-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(5, 150, 105, 0.95);
          color: white;
          padding: 6px 10px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.7rem;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          z-index: 10;
        }

        .author-badge {
          position: absolute;
          bottom: 12px;
          left: 12px;
          background: rgba(59, 130, 246, 0.95);
          color: white;
          padding: 4px 10px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.65rem;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          z-index: 10;
        }
      `}</style>
    </div>
  )
}

export default App
