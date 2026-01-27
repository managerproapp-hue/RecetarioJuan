import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Recipe, AppSettings, AppBackup, Product, MenuPlan, DEFAULT_CATEGORIES, DEFAULT_PRODUCT_FAMILIES, SubRecipe } from './types';
import { useCloudSync } from './hooks/useCloudSync';
import { useProducts } from './hooks/useProducts';
import { useRecipes } from './hooks/useRecipes';
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
    const updatedSubRecipes = (recipe.subRecipes || []).map(sub => {
      const updatedIngredients = sub.ingredients.map(ing => {
        const product = products.find(p => p.name.toUpperCase() === ing.name.toUpperCase());
        if (product) {
          const qtyString = typeof ing.quantity === 'string' ? ing.quantity : String(ing.quantity);
          const qtyNum = parseFloat(qtyString.replace(',', '.'));

          if (!isNaN(qtyNum)) {
            const factor = convertUnit(1, ing.unit, product.unit);
            const priceInRecipeUnit = product.pricePerUnit * factor;
            const newCost = qtyNum * priceInRecipeUnit;

            return {
              ...ing,
              pricePerUnit: priceInRecipeUnit,
              allergens: product.allergens,
              category: product.category,
              cost: newCost
            };
          }
        }
        return ing;
      });

      return { ...sub, ingredients: updatedIngredients };
    });

    const totalCost = updatedSubRecipes.reduce((acc, sub) =>
      acc + sub.ingredients.reduce((sAcc, ing) => sAcc + (ing.cost || 0), 0), 0
    );

    return { ...recipe, subRecipes: updatedSubRecipes, totalCost };
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

  const {
    recipes,
    loading: recipesLoading,
    saveRecipe,
    deleteRecipe,
    fetchRecipeDetail,
    refresh: refreshRecipes
  } = useRecipes(user?.id);

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

    // DELAY community fetch to prioritize personal recipes
    const timer = setTimeout(() => {
      fetchCommunityRecipes();
    }, 2000);

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
      clearTimeout(timer);
    };
  }, [user]);

  const fetchCommunityRecipes = async () => {
    try {
      setCommunityLoading(true);
      console.log('[fetchCommunityRecipes] 🔍 Fetching public recipes from recipes table...');

      const { data, error } = await supabase
        .from('recipes')
        .select('all_content')
        .eq('is_public', true)
        .order('last_modified', { ascending: false })
        .limit(200);

      if (error) throw error;

      const publicRecipes: Recipe[] = (data || []).map(row => row.all_content as Recipe);
      console.log(`[fetchCommunityRecipes] ✅ Found ${publicRecipes.length} public recipes`);
      setCommunityRecipes(publicRecipes);
    } catch (error: any) {
      console.error('[fetchCommunityRecipes] ❌ Error:', error);
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

  const syncedRecipes = useMemo(() =>
    syncRecipesWithProducts(recipes, productDatabase),
    [recipes, productDatabase]
  );

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
    const legacy = r as any;

    // 1. Detect existing sub-recipes with different possible keys
    const rawSubRecipes = legacy.subRecipes || legacy.sub_recipes || legacy.subrecipes || legacy.elaborations || [];

    const updatedSubRecipes = rawSubRecipes.map((sr: any) => {
      // Migrate old photo format to array
      if (sr.photo !== undefined && sr.photos === undefined) {
        return {
          ...sr,
          photos: sr.photo ? [sr.photo] : [],
          photo: undefined
        } as SubRecipe;
      }
      return sr as SubRecipe;
    });

    // 2. Map snake_case to camelCase inside the object if needed
    const totalCost = legacy.totalCost ?? legacy.total_cost ?? 0;
    const isPublic = legacy.isPublic ?? legacy.is_public ?? false;

    return {
      ...r,
      totalCost,
      isPublic,
      category: Array.isArray(r.category) ? r.category : [r.category].filter(Boolean) as string[],
      creator: legacy.creator || settings.teacherName,
      subRecipes: updatedSubRecipes.length > 0 ? updatedSubRecipes : [{
        id: 'legacy-1',
        name: 'Elaboración Principal',
        ingredients: legacy.ingredients || legacy.ingredients_list || [],
        instructions: legacy.instructions || legacy.elaboracion || '',
        photos: (legacy.photo || legacy.image) ? [legacy.photo || legacy.image] : []
      }],
      platingInstructions: legacy.platingInstructions || legacy.emplatado || '',
      serviceDetails: legacy.serviceDetails || {
        presentation: legacy.presentation || '',
        servingTemp: legacy.servingTemp || '',
        cutlery: legacy.cutlery || '',
        passTime: legacy.passTime || '',
        serviceType: legacy.serviceType || 'Servicio a la Americana',
        clientDescription: legacy.clientDescription || ''
      }
    };
  };

  const handleEdit = async (recipe: Recipe) => {
    // Si la receta no tiene subRecipes, es que es la versión "light" del dashboard
    if (!recipe.subRecipes || recipe.subRecipes.length === 0) {
      const fullRecipe = await fetchRecipeDetail(recipe.id);
      if (fullRecipe) {
        setCurrentRecipe(migrateRecipeIfNeeded(fullRecipe));
      } else {
        setCurrentRecipe(migrateRecipeIfNeeded(recipe));
      }
    } else {
      setCurrentRecipe(migrateRecipeIfNeeded(recipe));
    }
    setViewState('editor');
  };

  const handleView = async (recipe: Recipe) => {
    if (!recipe.subRecipes || recipe.subRecipes.length === 0) {
      const fullRecipe = await fetchRecipeDetail(recipe.id);
      if (fullRecipe) {
        setCurrentRecipe(migrateRecipeIfNeeded(fullRecipe));
      } else {
        setCurrentRecipe(migrateRecipeIfNeeded(recipe));
      }
    } else {
      setCurrentRecipe(migrateRecipeIfNeeded(recipe));
    }
    setViewState('view');
  };

  const handleSave = async (recipe: Recipe) => {
    const recipeWithOwner = {
      ...recipe,
      ownerId: user?.id,
      lastModified: Date.now()
    };

    console.log('[handleSave] 💾 Saving recipe:', {
      id: recipeWithOwner.id,
      name: recipeWithOwner.name,
      ownerId: recipeWithOwner.ownerId,
      isPublic: recipeWithOwner.isPublic
    });

    try {
      await saveRecipe(recipeWithOwner);

      // Si la receta es pública, refrescar la vista de comunidad
      if (recipeWithOwner.isPublic) {
        console.log('[handleSave] 🌍 Recipe is public, refreshing community recipes...');
        fetchCommunityRecipes();
      }

      setViewState('dashboard');
      setCurrentRecipe(null);
    } catch (err: any) {
      alert('Error al guardar la receta: ' + err.message);
    }
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
      for (const r of legacyData.value) {
        await saveRecipe({ ...r, ownerId: profile.id });
      }
      console.log(`Migrated ${legacyData.value.length} legacy recipes`);
    }

    await refreshProducts();
    console.log('Manual migration finished');
  };

  const handleExportRecipe = (recipe: Recipe) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(recipe, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${recipe.name.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportFromFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedRecipe = JSON.parse(e.target?.result as string) as Recipe;
        // Limpiamos el ID para que se cree como nueva si es un import externo, 
        // o mantenemos si es backup propio.
        const cloned = {
          ...importedRecipe,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          ownerId: profile?.id,
          lastModified: Date.now()
        };
        await saveRecipe(cloned);
        alert(`¡Receta "${cloned.name}" importada correctamente!`);
      } catch (err) {
        alert('Error al importar el archivo: Formato no válido.');
      }
    };
    reader.readAsText(file);
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
        onRestore={async (backup) => {
          if (backup.recipes) {
            for (const r of backup.recipes) {
              await saveRecipe(r);
            }
          }
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
          onExport={handleExportRecipe}
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
          onImport={async (recipe) => {
            const cloned = {
              ...recipe,
              id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
              ownerId: profile?.id,
              isPublic: false,
              lastModified: Date.now()
            };
            await saveRecipe(cloned);
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
          onImport={async (list: any[]) => {
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
          onMigrate={profile?.role === 'admin' ? handleMigrate : undefined}
          currentProfile={profile}
          settings={settings}
          onSettingsChange={setSettings}
        />
      ) : (
        <Dashboard
          recipes={syncedRecipes}
          settings={settings}
          savedMenus={savedMenus}
          productDatabase={productDatabase}
          currentProfile={profile}
          communityRecipes={communityRecipes}
          onNew={handleCreateNew}
          onEdit={handleEdit}
          onView={handleView}
          onDelete={async (id) => {
            if (confirm('¿Estás seguro de que deseas eliminar esta receta?')) {
              await deleteRecipe(id);
            }
          }}
          onImport={async (r) => {
            const cloned = {
              ...r,
              id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
              ownerId: profile?.id,
              isPublic: false,
              lastModified: Date.now()
            };
            await saveRecipe(cloned);
            alert('¡Receta añadida a tu recetario personal!');
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenMenuPlanner={() => setViewState('planner')}
          onOpenProductDB={() => setViewState('products')}
          onOpenAIBridge={() => setViewState('ai-bridge')}
          onOpenAdmin={() => setViewState('admin')}
          onLogout={handleLogout}
          onUpdateRecipe={handleSave}
          onExport={handleExportRecipe}
          onImportFromFile={handleImportFromFile}
        />
      )}
    </>
  );
}

export default App;
