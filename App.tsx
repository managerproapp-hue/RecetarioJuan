import React, { useState, useEffect, useRef } from 'react';
import { Recipe, AppSettings, AppBackup, Product, MenuPlan, DEFAULT_CATEGORIES, DEFAULT_PRODUCT_FAMILIES, SubRecipe } from './types';
import { useCloudSync } from './hooks/useCloudSync';
import { useProducts } from './hooks/useProducts';
import { CookingMode } from './components/CookingMode';
import { Dashboard } from './components/Dashboard';
import { RecipeEditor } from './components/RecipeEditor';
import { RecipeView } from './components/RecipeView';
import { SettingsModal } from './components/SettingsModal';
import { MenuPlanner } from './components/MenuPlanner';
import { ProductDatabaseViewer } from './components/ProductDatabaseViewer';
import { LandingPage } from './components/LandingPage';
import { AIBridge } from './components/AIBridge';
import { Auth } from './components/Auth';
import { PendingApproval } from './components/PendingApproval';
import { AdminDashboard } from './components/AdminDashboard';
import { INITIAL_PRODUCT_DATABASE } from './data/products';
import { convertUnit } from './utils';
import { supabase } from './lib/supabase';
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { UserProfile } from './types';


const syncRecipesWithProducts = (recipes: Recipe[], products: Product[]): Recipe[] => {
  return recipes.map(recipe => {
    let recipeHasChanges = false;
    const updatedSubRecipes = (recipe.subRecipes || []).map(sub => {
      let subHasChanges = false;
      const updatedIngredients = sub.ingredients.map(ing => {
        const product = products.find(p => p.name.toUpperCase() === ing.name.toUpperCase());
        if (product) {
          const qtyNum = parseFloat(ing.quantity.replace(',', '.'));
          if (!isNaN(qtyNum)) {
            const factor = convertUnit(1, ing.unit, product.unit);
            const priceInRecipeUnit = product.pricePerUnit * factor;
            const newCost = qtyNum * priceInRecipeUnit;

            const allergensChanged = JSON.stringify(ing.allergens) !== JSON.stringify(product.allergens);
            if (ing.pricePerUnit !== priceInRecipeUnit || ing.cost !== newCost || allergensChanged) {
              subHasChanges = true;
              return {
                ...ing,
                pricePerUnit: priceInRecipeUnit,
                allergens: product.allergens,
                category: product.category,
                cost: newCost
              };
            }
          }
        }
        return ing;
      });

      if (subHasChanges) {
        recipeHasChanges = true;
        return { ...sub, ingredients: updatedIngredients };
      }
      return sub;
    });

    if (recipeHasChanges) {
      const totalCost = updatedSubRecipes.reduce((acc, sub) =>
        acc + sub.ingredients.reduce((sAcc, ing) => sAcc + (ing.cost || 0), 0), 0
      );
      return { ...recipe, subRecipes: updatedSubRecipes, totalCost };
    }
    return recipe;
  });
};

type ViewState = 'dashboard' | 'editor' | 'planner' | 'products' | 'ai-bridge' | 'view' | 'cooking' | 'admin';

const defaultSettings: AppSettings = {
  teacherName: "Juan Codina Barranco",
  instituteName: "IES La Flota",
  teacherLogo: "",
  instituteLogo: "",
  categories: DEFAULT_CATEGORIES
};

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-slate-900 text-white min-h-screen">
          <h1 className="text-xl font-bold text-red-500 mb-4">Algo salió mal (Error Crítico)</h1>
          <pre className="bg-black/50 p-4 rounded text-xs font-mono overflow-auto max-w-full">
            {this.state.error?.toString()}
          </pre>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-blue-600 rounded">Recargar Página</button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [recipes, setRecipes, recipesLoading] = useCloudSync<Recipe[]>('recipes', [], user?.id);
  const [settings, setSettings, settingsLoading] = useCloudSync<AppSettings>('appSettings', defaultSettings, user?.id);

  // 🔄 SHARED DATABASE: New unified products table
  const {
    products: productDatabase,
    loading: productsLoading,
    addProduct: handleAddProduct,
    updateProduct: handleUpdateProduct,
    deleteProduct: handleDeleteProduct,
    refresh: refreshProducts
  } = useProducts(profile);

  // 📦 OLD DATABASE: Only for migration purposes
  const [oldProducts, setOldProducts, oldLoading] = useCloudSync<Product[]>('productDatabase', [], user?.id);

  const [savedMenus, setSavedMenus, menusLoading] = useCloudSync<MenuPlan[]>('savedMenus', [], user?.id);

  const [communityRecipes, setCommunityRecipes] = useState<Recipe[]>([]);
  const [communityLoading, setCommunityLoading] = useState(false);

  // 🚀 MIGRATION LOGIC REMOVED: To prevent duplicates and instability.
  // We will add a manual trigger button in the Admin Dashboard instead.

  useEffect(() => {
    if (!user) return;
    fetchCommunityRecipes();

    // 🔄 REALTIME: Listen for community recipes changes
    const recipesChannel = supabase
      .channel('community-recipes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'store',
          filter: 'key=like.recipes%'
        },
        () => {
          fetchCommunityRecipes();
        }
      )
      .subscribe();

    // 🔄 REALTIME: Listen for profile changes (approval)
    const profileChannel = supabase
      .channel(`profile:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new) {
            setProfile(payload.new as UserProfile);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(recipesChannel);
      supabase.removeChannel(profileChannel);
    };
  }, [user]);

  const fetchCommunityRecipes = async () => {
    try {
      setCommunityLoading(true);
      const { data, error } = await supabase
        .from('store')
        .select('key, value')
        .like('key', 'recipes%');

      if (error) throw error;

      const allRecipes: Recipe[] = [];
      data.forEach(item => {
        if (Array.isArray(item.value)) {
          // Extraer ID del dueño de la clave si existe (recipes:ID)
          const ownerIdFromKey = item.key.includes(':') ? item.key.split(':')[1] : null;
          item.value.forEach((r: Recipe) => {
            // Mostramos todas las públicas (incluidas las propias para verificar que están ahí)
            if (r.isPublic) {
              allRecipes.push({ ...r, ownerId: r.ownerId || ownerIdFromKey });
            }
          });
        }
      });
      setCommunityRecipes(allRecipes);
    } catch (err) {
      console.error('Error fetching community recipes:', err);
    } finally {
      setCommunityLoading(false);
    }
  };

  useEffect(() => {
    const initSession = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (code) {
        try {
          const { data } = await supabase.auth.exchangeCodeForSession(code);
          if (data.session) {
            setUser(data.session.user);
            fetchOrCreateProfile(data.session.user);
            window.history.replaceState({}, '', window.location.origin + window.location.pathname);
            return;
          }
        } catch (err: any) { }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        fetchOrCreateProfile(session.user);
        return;
      }

      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        const params = new URLSearchParams(hash.replace('#', ''));
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');

        if (access_token) {
          const { data } = await supabase.auth.setSession({
            access_token,
            refresh_token: refresh_token || ''
          });

          if (data.session) {
            setUser(data.session.user);
            fetchOrCreateProfile(data.session.user);
            return;
          }
        }
      }
      setAuthLoading(false);
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setUser(session?.user ?? null);
        if (session?.user) fetchOrCreateProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchOrCreateProfile = async (user: User) => {
    try {
      setAuthLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        const isAdmin = user.email === 'managerproapp@gmail.com';
        const newProfile: UserProfile = {
          id: user.id,
          email: user.email || '',
          is_approved: isAdmin,
          role: isAdmin ? 'admin' : 'user',
          created_at: new Date().toISOString(),
        };

        const { error: insertError } = await supabase.from('profiles').insert(newProfile);
        if (insertError) throw insertError;
        setProfile(newProfile);
      } else if (data) {
        setProfile(data);
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  const isDataLoading = recipesLoading || settingsLoading || productsLoading || menusLoading || authLoading;

  const [viewState, setViewState] = useState<ViewState>('dashboard');
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (!settings.categories || settings.categories.length === 0 || !settings.productFamilies || settings.productFamilies.length === 0) {
      const newSettings = {
        ...settings,
        categories: (!settings.categories || settings.categories.length === 0) ? DEFAULT_CATEGORIES : settings.categories,
        productFamilies: (!settings.productFamilies || settings.productFamilies.length === 0) ? DEFAULT_PRODUCT_FAMILIES : settings.productFamilies
      };
      if (JSON.stringify(newSettings) !== JSON.stringify(settings)) {
        setSettings(newSettings);
      }
    }
  }, [settings.categories, settings.productFamilies]);

  const handleEnterApp = () => setViewState('dashboard');
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setViewState('dashboard');
    setCurrentRecipe(null);
  };

  const handleCreateNew = () => { setCurrentRecipe(null); setViewState('editor'); };

  interface LegacySubRecipe extends Omit<SubRecipe, 'photos'> {
    photo?: string;
    photos?: string[];
  }

  interface LegacyRecipe extends Omit<Recipe, 'subRecipes'> {
    subRecipes?: LegacySubRecipe[];
    ingredients?: any[];
    instructions?: string;
  }

  const migrateRecipeIfNeeded = (r: Recipe): Recipe => {
    const legacy = r as unknown as LegacyRecipe;
    const updatedSubRecipes = (legacy.subRecipes || []).map((sr) => {
      if (sr.photo !== undefined && sr.photos === undefined) {
        return {
          ...sr,
          photos: sr.photo ? [sr.photo] : [],
          photo: undefined
        } as SubRecipe;
      }
      return sr as SubRecipe;
    });

    if (legacy.subRecipes && legacy.subRecipes.length > 0 && updatedSubRecipes === (legacy.subRecipes as unknown as SubRecipe[])) return r;

    return {
      ...r,
      category: Array.isArray(r.category) ? r.category : [r.category].filter(Boolean) as string[],
      creator: legacy.creator || settings.teacherName,
      subRecipes: updatedSubRecipes.length > 0 ? updatedSubRecipes : [{
        id: 'legacy-1',
        name: 'Elaboración Principal',
        ingredients: legacy.ingredients || [],
        instructions: legacy.instructions || '',
        photos: legacy.photo ? [legacy.photo] : []
      }],
      platingInstructions: legacy.platingInstructions || '',
      serviceDetails: legacy.serviceDetails || {
        presentation: '',
        servingTemp: '',
        cutlery: '',
        passTime: '',
        serviceType: 'Servicio a la Americana',
        clientDescription: ''
      }
    };
  };

  const handleEdit = (recipe: Recipe) => {
    setCurrentRecipe(migrateRecipeIfNeeded(recipe));
    setViewState('editor');
  };

  const handleView = (recipe: Recipe) => {
    setCurrentRecipe(migrateRecipeIfNeeded(recipe));
    setViewState('view');
  };

  const handleSave = (recipe: Recipe) => {
    const recipeWithOwner = { ...recipe, ownerId: user?.id };
    setRecipes(prev => {
      const exists = prev.find(r => r.id === recipe.id);
      return exists ? prev.map(r => r.id === recipe.id ? recipeWithOwner : r) : [recipeWithOwner, ...prev];
    });
    setViewState('dashboard');
    setCurrentRecipe(null);
  };

  const handleMigrate = async () => {
    if (!profile || profile.role !== 'admin') return;
    console.log('Manual migration started...');
    await refreshProducts();

    for (const p of oldProducts) {
      const alreadyExists = productDatabase.some(existing => existing.name.toLowerCase() === p.name.toLowerCase());
      if (!alreadyExists) {
        await handleAddProduct({
          ...p,
          is_approved: true,
          created_by: profile.id
        });
      }
    }
    await refreshProducts();

    // --- MIGRACIÓN DE RECETAS ---
    console.log('Migrating recipes from legacy store...');
    const { data: legacyData, error: legacyError } = await supabase
      .from('store')
      .select('value')
      .eq('key', 'recipes')
      .single();

    if (!legacyError && legacyData?.value && Array.isArray(legacyData.value)) {
      setRecipes(prev => {
        const merged = [...prev];
        legacyData.value.forEach((r: Recipe) => {
          if (!merged.some(existing => existing.id === r.id)) {
            merged.push({ ...r, ownerId: profile.id });
          }
        });
        return merged;
      });
      console.log(`Migrated ${legacyData.value.length} legacy recipes`);
    }

    await refreshProducts();
    console.log('Manual migration finished');
  };

  if (!user) {
    return <Auth onSession={(u) => setUser(u)} />;
  }

  if (!profile?.is_approved && profile?.role !== 'admin') {
    return <PendingApproval email={user.email || ''} onLogout={handleLogout} />;
  }

  return (
    <>
      {isDataLoading && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center text-white">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse text-amber-500">Sincronizando con la Nube...</p>
        </div>
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        recipes={recipes}
        productDatabase={productDatabase}
        onSave={setSettings}
        onRestore={(backup) => {
          setRecipes(backup.recipes);
          setSettings(backup.settings);
          if (backup.productDatabase && profile?.role === 'admin') {
            backup.productDatabase.forEach(p => handleAddProduct(p));
          }
          if (backup.savedMenus) setSavedMenus(backup.savedMenus);
          alert('Copia de seguridad restaurada correctamente.');
        }}
      />

      {viewState === 'view' && currentRecipe ? (
        <RecipeView
          recipe={currentRecipe}
          onBack={() => setViewState('dashboard')}
          settings={settings}
          onStartCooking={() => setViewState('cooking')}
        />
      ) : viewState === 'cooking' && currentRecipe ? (
        <CookingMode recipe={currentRecipe} onBack={() => setViewState('view')} />
      ) : viewState === 'editor' ? (
        <RecipeEditor
          initialRecipe={currentRecipe}
          productDatabase={productDatabase}
          settings={settings}
          onSave={handleSave}
          onCancel={() => setViewState('dashboard')}
          onAddProduct={handleAddProduct}
        />
      ) : viewState === 'ai-bridge' ? (
        <AIBridge
          settings={settings}
          onBack={() => setViewState('dashboard')}
          onImport={(recipe) => {
            handleSave(recipe);
            setViewState('dashboard');
          }}
        />
      ) : viewState === 'planner' ? (
        <MenuPlanner
          recipes={recipes}
          settings={settings}
          onBack={() => setViewState('dashboard')}
          productDatabase={productDatabase}
          savedMenus={savedMenus}
          onSaveMenu={(menu) => {
            setSavedMenus(prev => {
              const idx = prev.findIndex(m => m.id === menu.id);
              if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = menu;
                return updated;
              }
              return [menu, ...prev];
            });
          }}
          onDeleteMenu={(id) => setSavedMenus(prev => prev.filter(m => m.id !== id))}
        />
      ) : viewState === 'products' ? (
        <ProductDatabaseViewer
          products={productDatabase}
          onBack={() => setViewState('dashboard')}
          onAdd={handleAddProduct}
          onEdit={handleUpdateProduct}
          onDelete={handleDeleteProduct}
          onImport={async (list) => {
            // Bulk import for Admin only
            if (profile?.role === 'admin') {
              for (const p of list) {
                await handleAddProduct(p);
              }
            }
          }}
          settings={settings}
          onSettingsChange={setSettings}
          currentProfile={profile}
        />
      ) : viewState === 'admin' ? (
        <AdminDashboard
          onBack={() => setViewState('dashboard')}
          onViewRecipe={(recipe) => {
            setCurrentRecipe(migrateRecipeIfNeeded(recipe));
            setViewState('view');
          }}
          onMigrate={handleMigrate}
        />
      ) : (
        <Dashboard
          recipes={recipes}
          settings={settings}
          savedMenus={savedMenus}
          productDatabase={productDatabase}
          currentProfile={profile}
          communityRecipes={communityRecipes}
          onNew={handleCreateNew}
          onEdit={handleEdit}
          onView={handleView}
          onDelete={(id) => setRecipes(recipes.filter(r => r.id !== id))}
          onImport={(r) => setRecipes([r, ...recipes])}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenMenuPlanner={() => setViewState('planner')}
          onOpenProductDB={() => setViewState('products')}
          onOpenAIBridge={() => setViewState('ai-bridge')}
          onOpenAdmin={() => setViewState('admin')}
          onLogout={handleLogout}
          onUpdateRecipe={handleSave}
        />
      )}
    </>
  );
}

export default App;
