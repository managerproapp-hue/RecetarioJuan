import React, { useState } from 'react';
import { Recipe, AppSettings, Product, MenuPlan, MenuRecipeReference } from '../types';
import {
  ArrowLeft, Plus, Trash2, Calendar, Users, Save,
  ChefHat, Search, BookOpen, Clock, FileText, Download, Check, ShoppingCart, X, Printer,
  ClipboardList, AlertTriangle, Info, Edit2, Archive, EyeOff
} from 'lucide-react';
import { parseQuantity, normalizeToBasics, formatNormalized } from '../utils';

interface MenuPlannerProps {
  recipes: Recipe[];
  settings: AppSettings;
  onBack: () => void;
  productDatabase: Product[];
  savedMenus: MenuPlan[];
  onSaveMenu: (menu: MenuPlan) => void;
  onDeleteMenu: (id: string) => void;
}

export const MenuPlanner: React.FC<MenuPlannerProps> = ({
  recipes, settings, onBack, productDatabase, savedMenus, onSaveMenu, onDeleteMenu
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuPlan | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeStep, setActiveStep] = useState<'config' | 'verification'>('config');

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [pax, setPax] = useState(1);
  const [selectedRecipes, setSelectedRecipes] = useState<MenuRecipeReference[]>([]);
  const [showShoppingList, setShowShoppingList] = useState(false);

  const filteredRecipes = recipes.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartNew = () => {
    setTitle('');
    setDate(new Date().toISOString().split('T')[0]);
    setPax(1);
    setSelectedRecipes([]);
    setEditingMenu(null);
    setIsCreating(true);
    setActiveStep('config');
  };

  const handleEdit = (menu: MenuPlan) => {
    setEditingMenu(menu);
    setTitle(menu.title);
    setDate(menu.date);
    setPax(menu.pax);
    setSelectedRecipes(menu.recipes || []);
    setIsCreating(true);
    setActiveStep('config');
  };

  const handleSave = () => {
    if (!title.trim() || !date || pax <= 0 || selectedRecipes.length === 0) {
      alert('Error: Nombre, Fecha, PAX y al menos una receta son obligatorios.');
      return;
    }

    const menu: MenuPlan = {
      id: editingMenu?.id || Date.now().toString(),
      title,
      date,
      pax,
      recipes: selectedRecipes,
      lastModified: Date.now(),
      extraOrderItems: extraOrderItems,
      excludedOrderItems: excludedOrderItems
    };

    onSaveMenu(menu);
    setIsCreating(false);
  };

  const toggleRecipe = (recipe: Recipe) => {
    setSelectedRecipes(prev => {
      const exists = prev.find(r => r.recipeId === recipe.id);
      if (exists) {
        return prev.filter(r => r.recipeId !== recipe.id);
      } else {
        const newRef: MenuRecipeReference = {
          recipeId: recipe.id,
          pax: pax, // Initialize with menu PAX
          isVerified: false,
          serviceMemory: '',
          checklist: (recipe.subRecipes || []).map(sub => ({ id: sub.id, name: sub.name, completed: false })),
          ingredientOverrides: {},
          subRecipeModifications: {},
          manualChecklist: []
        };
        return [...prev, newRef];
      }
    });
  };

  const [extraOrderItems, setExtraOrderItems] = useState<{ name: string, quantity: number, unit: string, family: string }[]>([]);
  const [excludedOrderItems, setExcludedOrderItems] = useState<string[]>([]);

  // Load extras/excluded when editing a menu
  React.useEffect(() => {
    if (editingMenu) {
      setExtraOrderItems(editingMenu.extraOrderItems || []);
      setExcludedOrderItems(editingMenu.excludedOrderItems || []);
    } else {
      setExtraOrderItems([]);
      setExcludedOrderItems([]);
    }
  }, [editingMenu]);

  const calculateShoppingList = () => {
    // 1. Calculate Base Ingredients from Recipes
    const groupedList: Record<string, Record<string, { total: number, base: 'g' | 'ml' | 'ud' }>> = {};
    const excludedList: Record<string, { total: number, base: 'g' | 'ml' | 'ud' }> = {};

    selectedRecipes.forEach(ref => {
      const recipe = recipes.find(r => r.id === ref.recipeId);
      if (!recipe) return;

      const ratio = ref.pax / recipe.yieldQuantity;

      recipe.subRecipes?.forEach(sub => {
        sub.ingredients?.forEach(ing => {
          let qty = parseQuantity(ing.quantity) * ratio;
          // Check for overrides
          if (ref.ingredientOverrides && ref.ingredientOverrides[ing.name]) {
            qty = parseQuantity(ref.ingredientOverrides[ing.name].quantity);
          }

          const normalized = normalizeToBasics(qty, ing.unit);
          const key = ing.name.toUpperCase();

          // Check if excluded
          if (excludedOrderItems.includes(key)) {
            if (!excludedList[key]) {
              excludedList[key] = { total: normalized.value, base: normalized.base };
            } else {
              excludedList[key].total += normalized.value;
            }
            return; // Skip adding to main list
          }

          const family = (ing.category || 'VARIOS').toUpperCase();

          if (!groupedList[family]) groupedList[family] = {};
          if (!groupedList[family][key]) {
            groupedList[family][key] = { total: normalized.value, base: normalized.base };
          } else {
            groupedList[family][key].total += normalized.value;
          }
        });
      });
    });

    // 2. Add Extra Manual Items
    extraOrderItems.forEach(item => {
      const key = item.name.toUpperCase();
      // If it's excluded, strictly speaking we could put it in excluded, but usually manual adds are meant to be ordered. 
      // We'll assume manual adds override exclusion or are distinct.

      const family = (item.family || 'VARIOS').toUpperCase();
      const normalized = normalizeToBasics(item.quantity, item.unit);

      if (!groupedList[family]) groupedList[family] = {};
      if (!groupedList[family][key]) {
        groupedList[family][key] = { total: normalized.value, base: normalized.base };
      } else {
        groupedList[family][key].total += normalized.value;
      }
    });

    // Sort families
    const sortedFamilies = Object.entries(groupedList).sort((a, b) => a[0].localeCompare(b[0]));

    return {
      active: sortedFamilies,
      excluded: Object.entries(excludedList).sort((a, b) => a[0].localeCompare(b[0]))
    };
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      <div className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-40 shadow-sm flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-slate-600" />
          </button>
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
              <Calendar className="text-indigo-500" /> Planificador de Menús
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gestión de servicios y planificación</p>
          </div>
        </div>
        {!isCreating && (
          <button
            onClick={handleStartNew}
            className="px-6 py-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 flex items-center gap-2 shadow-xl font-black uppercase text-xs tracking-widest transition-all"
          >
            <Plus size={18} /> Nuevo Menú
          </button>
        )}
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {isCreating ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Formulario Izquierda */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8 space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Título del Menú / Evento <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-lg font-black uppercase focus:ring-2 focus:ring-indigo-100 transition-all"
                    placeholder="EJ: SERVICIO DE COMIDA..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Fecha <span className="text-rose-500">*</span></label>
                    <input
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">PAX (Base) <span className="text-rose-500">*</span></label>
                    <input
                      type="number"
                      value={pax}
                      onChange={e => setPax(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-black outline-none"
                    />
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button
                    onClick={() => setIsCreating(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 transition-all"
                  >
                    Guardar Plan
                  </button>
                </div>
              </div>

              <div className="bg-indigo-900 rounded-[2rem] p-6 text-white overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform"><ChefHat size={80} /></div>
                <h4 className="text-lg font-black uppercase tracking-tight mb-2">Recetas Seleccionadas</h4>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-4">Total: {selectedRecipes.length} platos</p>
                <div className="space-y-2">
                  {selectedRecipes.map((ref, sIdx) => {
                    const r = recipes.find(x => x.id === ref.recipeId);
                    return r ? (
                      <div key={ref.recipeId} className="flex justify-between items-center bg-white/10 p-3 rounded-xl border border-white/5 backdrop-blur-sm">
                        <span className="text-[10px] font-black uppercase truncate max-w-[80%]">
                          <span className="text-indigo-400 mr-2">{sIdx + 1}.</span>
                          {r.name}
                        </span>
                        <button onClick={() => toggleRecipe(r)} className="text-white/40 hover:text-white"><Trash2 size={12} /></button>
                      </div>
                    ) : null;
                  })}
                  {selectedRecipes.length === 0 && (
                    <p className="text-white/30 text-[10px] font-bold uppercase py-10 text-center border-2 border-dashed border-white/10 rounded-2xl">Selecciona platos de la lista</p>
                  )}
                </div>
              </div>
            </div>

            {/* Selector Derecha */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl">
                    <button
                      onClick={() => setActiveStep('config')}
                      className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeStep === 'config' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      1. Selección
                    </button>
                    <button
                      onClick={() => selectedRecipes.length > 0 && setActiveStep('verification')}
                      disabled={selectedRecipes.length === 0}
                      className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeStep === 'verification' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'} disabled:opacity-30`}
                    >
                      2. Verificación
                    </button>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input
                      type="text"
                      placeholder="Buscar receta..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                  </div>
                </div>

                {activeStep === 'config' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredRecipes.map(recipe => {
                      const isSelected = selectedRecipes.some(r => r.recipeId === recipe.id);
                      return (
                        <button
                          key={recipe.id}
                          onClick={() => toggleRecipe(recipe)}
                          className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left group ${isSelected
                            ? 'border-indigo-500 bg-indigo-50/50 shadow-md'
                            : 'border-slate-100 hover:border-slate-300 bg-white'
                            }`}
                        >
                          <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                            {recipe.photo ? <img src={recipe.photo} className="w-full h-full object-cover" alt="" /> : <ChefHat className="w-full h-full p-4 text-slate-200" />}
                          </div>
                          <div className="flex-grow">
                            <h4 className="text-[11px] font-black uppercase text-slate-800 leading-tight mb-1">{recipe.name}</h4>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{recipe.category?.[0] || 'Otros'}</span>
                          </div>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-transparent'}`}>
                            <Check size={14} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-8">
                    {selectedRecipes.map((ref, idx) => {
                      const recipe = recipes.find(r => r.id === ref.recipeId);
                      if (!recipe) return null;

                      return (
                        <div key={ref.recipeId} className="bg-slate-50 rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                          <div className="bg-white p-6 border-b border-slate-200 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                              <span className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-black text-xs">{idx + 1}</span>
                              <div>
                                <h4 className="font-black uppercase text-slate-800 leading-none">{recipe.name}</h4>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ratio: {(ref.pax / recipe.yieldQuantity).toFixed(2)}x</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                <Users size={12} className="text-slate-400" />
                                <span className="text-[10px] font-black text-slate-400 uppercase">Pax:</span>
                                <input
                                  type="number"
                                  value={ref.pax}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setSelectedRecipes(prev => prev.map(p => p.recipeId === ref.recipeId ? { ...p, pax: val } : p));
                                  }}
                                  className="w-12 bg-transparent outline-none font-black text-xs text-indigo-600 text-center"
                                />
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedRecipes(prev => prev.map(p => p.recipeId === ref.recipeId ? { ...p, isVerified: !p.isVerified } : p));
                                }}
                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${ref.isVerified ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200'}`}
                              >
                                {ref.isVerified ? <Check size={12} /> : null} {ref.isVerified ? 'VERIFICADA' : 'VERIFICAR'}
                              </button>
                            </div>
                          </div>

                          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                              <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <ShoppingCart size={14} className="text-indigo-500" /> Ajuste de Cantidades
                              </h5>
                              <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50 overflow-hidden">
                                {recipe.subRecipes.flatMap(sub => sub.ingredients).map((ing, iIdx) => {
                                  const ratio = ref.pax / recipe.yieldQuantity;
                                  const originalQty = parseQuantity(ing.quantity) * ratio;
                                  const override = ref.ingredientOverrides[ing.name];

                                  return (
                                    <div key={iIdx} className="p-3 flex items-center justify-between group hover:bg-slate-50 transition-colors">
                                      <span className="text-[10px] font-bold text-slate-600 uppercase truncate max-w-[50%]">{ing.name}</span>
                                      <div className="flex items-center gap-2">
                                        {override && (
                                          <button
                                            onClick={() => {
                                              const next = { ...ref.ingredientOverrides };
                                              delete next[ing.name];
                                              setSelectedRecipes(prev => prev.map(p => p.recipeId === ref.recipeId ? { ...p, ingredientOverrides: next } : p));
                                            }}
                                            className="text-rose-400 hover:text-rose-600 p-1" title="Restaurar original"
                                          >
                                            <X size={10} />
                                          </button>
                                        )}
                                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg border transition-all ${override ? 'bg-amber-50 border-amber-200 shadow-sm' : 'border-slate-100 group-hover:border-slate-200'}`}>
                                          <input
                                            type="text"
                                            value={override ? override.quantity : originalQty.toFixed(2)}
                                            onChange={(e) => {
                                              const next = { ...ref.ingredientOverrides, [ing.name]: { quantity: e.target.value, unit: ing.unit } };
                                              setSelectedRecipes(prev => prev.map(p => p.recipeId === ref.recipeId ? { ...p, ingredientOverrides: next } : p));
                                            }}
                                            className={`w-14 bg-transparent outline-none text-right font-black text-xs ${override ? 'text-amber-600' : 'text-slate-400'}`}
                                          />
                                          <span className="text-[9px] font-bold text-slate-400">{ing.unit}</span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="space-y-6">
                              <div>
                                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                                  <ClipboardList size={14} className="text-indigo-500" /> Checklist de Elaboraciones
                                </h5>

                                {/* Sub-Recipe Instructions Edit & Checklist */}
                                <div className="space-y-4 mb-6">
                                  {recipe.subRecipes.map(sub => {
                                    const modInstructions = ref.subRecipeModifications?.[sub.id]?.instructions;
                                    const displayText = modInstructions !== undefined ? modInstructions : sub.instructions;
                                    const isEditing = modInstructions !== undefined;
                                    const checklistItem = ref.checklist.find(c => c.id === sub.id);

                                    return (
                                      <div key={sub.id} className="bg-white p-4 rounded-xl border border-slate-100">
                                        <div className="flex justify-between items-start mb-2">
                                          <h6 className="font-bold text-xs uppercase text-slate-700">{sub.name}</h6>
                                          <div className="flex gap-2">
                                            <button
                                              onClick={() => {
                                                if (isEditing && confirm("¿Revertir cambios a original?")) {
                                                  const nextMods = { ...ref.subRecipeModifications };
                                                  delete nextMods[sub.id];
                                                  setSelectedRecipes(prev => prev.map(p => p.recipeId === ref.recipeId ? { ...p, subRecipeModifications: nextMods } : p));
                                                } else if (!isEditing) {
                                                  const nextMods = { ...ref.subRecipeModifications, [sub.id]: { instructions: sub.instructions } };
                                                  setSelectedRecipes(prev => prev.map(p => p.recipeId === ref.recipeId ? { ...p, subRecipeModifications: nextMods } : p));
                                                }
                                              }}
                                              className={`p-1 rounded hover:bg-slate-100 ${isEditing ? 'text-amber-500' : 'text-slate-400'}`}
                                              title={isEditing ? "Revertir a original" : "Editar instrucciones para este menú"}
                                            >
                                              <Edit2 size={12} />
                                            </button>
                                          </div>
                                        </div>

                                        {isEditing ? (
                                          <textarea
                                            value={displayText}
                                            onChange={(e) => {
                                              const nextMods = { ...ref.subRecipeModifications, [sub.id]: { instructions: e.target.value } };
                                              setSelectedRecipes(prev => prev.map(p => p.recipeId === ref.recipeId ? { ...p, subRecipeModifications: nextMods } : p));
                                            }}
                                            className="w-full text-[10px] p-2 bg-amber-50 border border-amber-200 rounded-lg text-slate-700 font-medium h-24 focus:ring-2 focus:ring-amber-200 outline-none"
                                          />
                                        ) : (
                                          <p className="text-[10px] text-slate-500 line-clamp-3 mb-2">{displayText}</p>
                                        )}

                                        {/* Built-in Checklist Item */}
                                        {checklistItem && (
                                          <button
                                            onClick={() => {
                                              const next = ref.checklist.map(c => c.id === sub.id ? { ...c, completed: !c.completed } : c);
                                              setSelectedRecipes(prev => prev.map(p => p.recipeId === ref.recipeId ? { ...p, checklist: next } : p));
                                            }}
                                            className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all ${checklistItem.completed ? 'bg-indigo-50 text-indigo-900' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                                          >
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${checklistItem.completed ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'}`}>
                                              {checklistItem.completed && <Check size={10} strokeWidth={4} />}
                                            </div>
                                            <span className={`text-[10px] font-black uppercase ${checklistItem.completed ? 'opacity-50 line-through' : ''}`}>Completado</span>
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Manual Checklist Items */}
                                <div className="space-y-2 mb-6">
                                  <h6 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Controles Adicionales</h6>
                                  {ref.manualChecklist?.map((item, mIdx) => (
                                    <div key={mIdx} className="flex items-center gap-2 group">
                                      <button
                                        onClick={() => {
                                          const next = [...(ref.manualChecklist || [])];
                                          next[mIdx].completed = !next[mIdx].completed;
                                          setSelectedRecipes(prev => prev.map(p => p.recipeId === ref.recipeId ? { ...p, manualChecklist: next } : p));
                                        }}
                                        className="flex-grow flex items-center gap-3 p-2 bg-white border border-slate-100 rounded-lg"
                                      >
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${item.completed ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 bg-slate-50'}`}>
                                          {item.completed && <Check size={10} strokeWidth={4} />}
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase ${item.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{item.name}</span>
                                      </button>
                                      <button
                                        onClick={() => {
                                          const next = (ref.manualChecklist || []).filter((_, i) => i !== mIdx);
                                          setSelectedRecipes(prev => prev.map(p => p.recipeId === ref.recipeId ? { ...p, manualChecklist: next } : p));
                                        }}
                                        className="p-2 text-rose-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  ))}

                                  <div className="flex gap-2">
                                    <input
                                      id={`new-checklist-${ref.recipeId}`}
                                      type="text"
                                      placeholder="Nuevo punto de control..."
                                      className="flex-grow px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-300"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          const val = e.currentTarget.value.trim();
                                          if (val) {
                                            const next = [...(ref.manualChecklist || []), { id: Date.now().toString(), name: val, completed: false }];
                                            setSelectedRecipes(prev => prev.map(p => p.recipeId === ref.recipeId ? { ...p, manualChecklist: next } : p));
                                            e.currentTarget.value = '';
                                          }
                                        }
                                      }}
                                    />
                                    <button
                                      onClick={() => {
                                        const input = document.getElementById(`new-checklist-${ref.recipeId}`) as HTMLInputElement;
                                        const val = input.value.trim();
                                        if (val) {
                                          const next = [...(ref.manualChecklist || []), { id: Date.now().toString(), name: val, completed: false }];
                                          setSelectedRecipes(prev => prev.map(p => p.recipeId === ref.recipeId ? { ...p, manualChecklist: next } : p));
                                          input.value = '';
                                        }
                                      }}
                                      className="px-3 bg-indigo-50 text-indigo-600 rounded-lg"
                                    >
                                      <Plus size={14} />
                                    </button>
                                  </div>
                                </div>

                                <div>
                                  <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-3">
                                    <FileText size={14} className="text-indigo-500" /> Memoria del Servicio
                                  </h5>
                                  <textarea
                                    value={ref.serviceMemory}
                                    onChange={(e) => {
                                      setSelectedRecipes(prev => prev.map(p => p.recipeId === ref.recipeId ? { ...p, serviceMemory: e.target.value } : p));
                                    }}
                                    placeholder="Observaciones, reparos o notas del servicio..."
                                    className="w-full h-24 p-4 bg-white border border-slate-100 rounded-2xl outline-none text-[11px] font-medium font-serif italic text-slate-600 focus:ring-4 focus:ring-indigo-50 transition-all shadow-inner"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
              <div className="flex gap-4">
                <div className="text-center p-4 bg-indigo-50 rounded-2xl">
                  <p className="text-[10px] font-black uppercase text-indigo-400">Total Menús</p>
                  <p className="text-2xl font-black text-indigo-900">{savedMenus.length}</p>
                </div>
              </div>
              <button
                onClick={handleStartNew}
                className="px-8 py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-500 flex items-center gap-3 shadow-xl shadow-indigo-500/20 font-black uppercase text-[11px] tracking-widest transition-all active:scale-95"
              >
                <Plus size={20} /> Crear Nuevo Servicio
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedMenus.map(menu => (
                <div key={menu.id} className="bg-white rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-500 border border-slate-100 p-6 space-y-6 group">
                  <div className="flex justify-between items-start">
                    <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:scale-110 transition-transform">
                      <Calendar size={24} />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(menu)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><FileText size={18} /></button>
                      <button onClick={() => confirm('¿Eliminar este menú?') && onDeleteMenu(menu.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-slate-800 leading-none mb-2">{menu.title}</h3>
                    <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><Clock size={12} /> {new Date(menu.date).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1.5"><Users size={12} /> {menu.pax} PAX</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex gap-2">
                      <button
                        onClick={() => { handleEdit(menu); setShowShoppingList(true); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-tight hover:bg-emerald-100 transition-colors"
                      >
                        <ShoppingCart size={12} /> Compras
                      </button>
                    </div>
                    <button onClick={() => handleEdit(menu)} className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition-colors">Ver Detalles →</button>
                  </div>
                </div>
              ))}

              <button
                onClick={handleStartNew}
                className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-10 flex flex-col items-center justify-center gap-4 hover:border-indigo-400 hover:bg-white transition-all group"
              >
                <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-300 group-hover:text-indigo-500 transition-colors">
                  <Plus size={32} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-slate-600 transition-colors">Nuevo Plan de Menú</p>
              </button>
            </div>

            {savedMenus.length === 0 && (
              <div className="py-20 text-center">
                <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BookOpen size={40} className="text-slate-300" strokeWidth={1} />
                </div>
                <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">No hay menús guardados</p>
                <p className="text-slate-300 text-xs mt-2 italic">Comienza planificando tu primer servicio técnico.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showShoppingList && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8 no-print">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowShoppingList(false)}></div>
          <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl relative z-10 flex flex-col max-h-[95vh] overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/20">
                  <ShoppingCart size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">PEDIDO DE ECONOMATO</h3>
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">{title || 'Menú Seleccionado'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="px-6 py-3 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-600/20 font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 flex items-center gap-2">
                  <Printer size={16} /> Imprimir Pedido
                </button>
                <button onClick={() => setShowShoppingList(false)} className="p-3 hover:bg-white rounded-xl transition-colors"><X size={24} className="text-slate-400" /></button>
              </div>
            </div>

            <div className="overflow-y-auto flex-grow print:p-0 print:overflow-visible bg-white">
              <div className="mb-8 border-b-2 border-slate-900 pb-4 hidden print:block">
                <div className="flex justify-between items-end">
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 uppercase">PEDIDO DE MATERIA PRIMA</h1>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{settings.instituteName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black uppercase">{title}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(date).toLocaleDateString()} | {pax} PAX</p>
                  </div>
                </div>
              </div>

              {/* Add Manual Item UI */}
              <div className="bg-indigo-50/50 p-6 border-b border-indigo-100 no-print">
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Añadir Extra al Pedido</h4>
                <div className="flex gap-2 items-center">
                  <input type="text" id="manual-item-name" placeholder="Producto..." className="flex-[2] px-4 py-2 rounded-xl border border-indigo-100 text-sm outline-none" />
                  <input type="number" id="manual-item-qty" placeholder="Cant." className="w-20 px-4 py-2 rounded-xl border border-indigo-100 text-sm outline-none" />
                  <select id="manual-item-unit" className="w-24 px-4 py-2 rounded-xl border border-indigo-100 text-sm outline-none bg-white">
                    <option value="ud">Ud</option>
                    <option value="kg">Kg</option>
                    <option value="g">g</option>
                    <option value="l">L</option>
                    <option value="ml">ml</option>
                  </select>
                  <select id="manual-item-family" className="w-32 px-4 py-2 rounded-xl border border-indigo-100 text-sm outline-none bg-white">
                    {settings.productFamilies?.map(f => <option key={f} value={f}>{f}</option>) || <option value="VARIOS">VARIOS</option>}
                  </select>
                  <button
                    onClick={() => {
                      const nameEl = document.getElementById('manual-item-name') as HTMLInputElement;
                      const qtyEl = document.getElementById('manual-item-qty') as HTMLInputElement;
                      const unitEl = document.getElementById('manual-item-unit') as HTMLSelectElement;
                      const familyEl = document.getElementById('manual-item-family') as HTMLSelectElement;

                      if (nameEl.value && qtyEl.value) {
                        setExtraOrderItems(prev => [...prev, {
                          name: nameEl.value,
                          quantity: Number(qtyEl.value),
                          unit: unitEl.value,
                          family: familyEl.value
                        }]);
                        nameEl.value = '';
                        qtyEl.value = '';
                      }
                    }}
                    className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              <div className="p-10 print:p-0 print:overflow-visible bg-white">
                {/* Print Optimization: CSS Columns */}
                <div className="hidden print:block" style={{ columnCount: 3, columnGap: '2rem' }}>
                  {calculateShoppingList().active.map(([family, items]) => (
                    <div key={family} className="break-inside-avoid mb-4">
                      <h4 className="text-[9px] font-black text-slate-900 border-b border-slate-900 mb-1 uppercase tracking-tighter inline-block w-full">
                        {family}
                      </h4>
                      <div className="space-y-0.5">
                        {Object.entries(items).sort((a, b) => a[0].localeCompare(b[0])).map(([name, data]) => (
                          <div key={name} className="flex justify-between items-baseline gap-1 text-[8px]">
                            <span className="font-bold text-slate-700 uppercase truncate">{name}</span>
                            <span className="font-black text-slate-900 whitespace-nowrap tabular-nums">
                              {formatNormalized(data.total, data.base)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Screen View */}
                <div className="print:hidden">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 items-start">
                    {calculateShoppingList().active.map(([family, items]) => (
                      <div key={family} className="break-inside-avoid mb-2 border border-slate-50 p-3 rounded-xl">
                        <h4 className="text-[9px] font-black text-white bg-slate-900 px-2 py-1 rounded mb-2 uppercase tracking-tighter inline-block">
                          {family}
                        </h4>
                        <div className="space-y-0.5">
                          {Object.entries(items).sort((a, b) => a[0].localeCompare(b[0])).map(([name, data]) => (
                            <div key={name} className="flex justify-between items-center gap-1 group border-b border-slate-50 pb-0.5">
                              <span className="text-[8px] font-bold text-slate-700 uppercase leading-none truncate flex-grow flex items-center gap-2">
                                {name}
                                <button
                                  onClick={() => setExcludedOrderItems(prev => [...prev, name])}
                                  className="text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" title="Excluir del pedido"
                                >
                                  <EyeOff size={10} />
                                </button>
                              </span>
                              <span className="text-[10px] font-black text-slate-900 whitespace-nowrap tabular-nums tracking-tighter">
                                {formatNormalized(data.total, data.base)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Excluded Section */}
                  {calculateShoppingList().excluded.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-dashed border-slate-200 opacity-60">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Archive size={14} /> Excluidos de Compras
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 items-start">
                        {calculateShoppingList().excluded.map(([name, data]) => (
                          <div key={name} className="flex justify-between items-center bg-slate-50 p-2 rounded">
                            <span className="text-[9px] font-bold text-slate-500 uppercase decoration-slate-300">{name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-slate-400">{formatNormalized(data.total, data.base)}</span>
                              <button
                                onClick={() => setExcludedOrderItems(prev => prev.filter(i => i !== name))}
                                className="text-emerald-500 hover:text-emerald-700" title="Volver a incluir"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {calculateShoppingList().active.length === 0 && calculateShoppingList().excluded.length === 0 && (
                  <div className="text-center py-20">
                    <AlertTriangle size={48} className="text-amber-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No hay ingredientes validados para este servicio</p>
                  </div>
                )}
                <div className="p-8 border-t border-slate-100 flex justify-between items-center bg-slate-50 no-print">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Info size={14} className="text-amber-500" /> Diseño extra-compacto optimizado para ahorro de papel (Multi-columna)
                  </p>
                  <button
                    onClick={() => setShowShoppingList(false)}
                    className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-slate-800 shadow-xl transition-all active:scale-95"
                  >
                    Cerrar Pedido
                  </button>
                </div>
              </div>
            </div>
      )}
          </div>
          );
};
