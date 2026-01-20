import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, Recipe } from '../types';
import { Users, Shield, CheckCircle, XCircle, Trash2, Eye, ArrowLeft, Loader2, Search, ChefHat, Database, ArrowRightCircle } from 'lucide-react';

interface AdminDashboardProps {
    onBack: () => void;
    onViewRecipe: (recipe: Recipe) => void;
    onMigrate?: () => Promise<void>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack, onViewRecipe, onMigrate }) => {
    const [profiles, setProfiles] = useState<UserProfile[]>([]);
    const [allRecipes, setAllRecipes] = useState<(Recipe & { ownerEmail?: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'users' | 'recipes' | 'database'>('users');
    const [searchTerm, setSearchTerm] = useState('');
    const [migrating, setMigrating] = useState(false);

    const handleMigrate = async () => {
        if (!confirm('Esto copiará tus ingredientes antiguos al nuevo sistema compartido. ¿Continuar?')) return;

        setMigrating(true);
        try {
            // This logic will be passed via props or implemented here using passed data
            if (onMigrate) {
                await onMigrate();
                alert('Migración completada con éxito.');
                fetchData();
            }
        } catch (err) {
            alert('Error durante la migración.');
        } finally {
            setMigrating(false);
        }
    };

    useEffect(() => {
        fetchData();

        // 🔄 REALTIME: Keep profiles synced across all admin sessions
        const channel = supabase
            .channel('admin-profiles-sync')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'profiles' },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setProfiles(prev => [payload.new as UserProfile, ...prev]);
                    } else if (payload.eventType === 'UPDATE') {
                        setProfiles(prev => prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p));
                    } else if (payload.eventType === 'DELETE') {
                        setProfiles(prev => prev.filter(p => p.id === payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data: profs, error: profError } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (profError) throw profError;
            setProfiles(profs || []);

            const { data: stores, error: storeError } = await supabase
                .from('store')
                .select('key, value')
                .like('key', 'recipes:%');

            if (storeError) throw storeError;

            const flattenedRecipes: (Recipe & { ownerEmail?: string })[] = [];
            stores?.forEach(item => {
                if (Array.isArray(item.value)) {
                    const ownerId = item.key.split(':')[1];
                    const owner = profs?.find(p => p.id === ownerId);
                    item.value.forEach((r: Recipe) => {
                        flattenedRecipes.push({ ...r, ownerEmail: owner?.email });
                    });
                }
            });
            setAllRecipes(flattenedRecipes);

        } catch (err) {
            console.error('Error fetching admin data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleApproval = async (profile: UserProfile) => {
        try {
            // Use the MOST RECENT state from the table to avoid toggle wars
            const newStatus = !profile.is_approved;
            const { error } = await supabase
                .from('profiles')
                .update({ is_approved: newStatus })
                .eq('id', profile.id);

            if (error) throw error;

            // 🔄 OPTIMISTIC UPDATE: Update local state immediately 
            // so the user sees the change even if Realtime takes a second.
            setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, is_approved: newStatus } : p));
        } catch (err) {
            alert('Error al actualizar estado del usuario');
        }
    };

    const filteredProfiles = profiles.filter(p => p.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredRecipes = allRecipes.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            <div className="bg-slate-900 text-white px-8 py-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><Shield size={120} /></div>
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                    <div className="flex items-center gap-6">
                        <button onClick={onBack} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"><ArrowLeft size={20} /></button>
                        <div>
                            <h1 className="text-4xl font-black uppercase tracking-tighter">Panel Maestro</h1>
                            <p className="text-amber-500 text-[10px] font-black uppercase tracking-[0.4em] mt-1">Administración y Control GastroProfesor</p>
                        </div>
                    </div>
                    <div className="flex bg-white/10 p-1.5 rounded-2xl backdrop-blur-md">
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-amber-500 text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            Usuarios ({profiles.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('recipes')}
                            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'recipes' ? 'bg-amber-500 text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            Auditoría Recetas ({allRecipes.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('database')}
                            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'database' ? 'bg-amber-500 text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            Gestión Base Datos
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 mt-10">
                {activeTab !== 'database' && (
                    <div className="mb-8 relative max-w-xl">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder={`Buscar ${activeTab === 'users' ? 'por correo' : 'por receta'}...`}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-amber-500/10 transition-all font-bold shadow-sm"
                        />
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40 text-slate-400 gap-4">
                        <Loader2 className="animate-spin" size={40} />
                        <p className="font-black uppercase text-[10px] tracking-widest">Cargando datos maestros...</p>
                    </div>
                ) : activeTab === 'users' ? (
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Usuario</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Rol</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Estado</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Registrado</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProfiles.map(p => (
                                    <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xs">
                                                    {p.email[0].toUpperCase()}
                                                </div>
                                                <span className="font-bold text-slate-700">{p.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${p.role === 'admin' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                                                {p.role}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                {p.is_approved ? (
                                                    <span className="flex items-center gap-1.5 text-emerald-600 font-black text-[9px] uppercase tracking-tighter">
                                                        <CheckCircle size={12} /> Activo
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 text-amber-500 font-black text-[9px] uppercase tracking-tighter">
                                                        <XCircle size={12} /> Pendiente
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-[10px] text-slate-400 font-mono">
                                            {new Date(p.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            {p.role !== 'admin' && (
                                                <button
                                                    onClick={() => handleToggleApproval(p)}
                                                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${p.is_approved ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                                                >
                                                    {p.is_approved ? 'Revocar' : 'Aprobar'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : activeTab === 'database' ? (
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-12 text-center">
                        <div className="bg-indigo-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8">
                            <Database size={40} className="text-indigo-600" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-4">Control Maestro de Datos</h2>
                        <p className="text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
                            Desde aquí puedes realizar operaciones críticas de mantenimiento. Usa el botón de migración si acabas de activar la base de datos compartida y quieres recuperar tus ingredientes individuales.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
                            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                                <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest mb-4 flex items-center gap-3">
                                    <ArrowRightCircle size={18} className="text-amber-500" /> Migración de Datos
                                </h3>
                                <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                                    Copia los ingredientes del antiguo sistema "Mis Ingredientes" a la base de datos central de GastroProfesor.
                                </p>
                                <button
                                    onClick={handleMigrate}
                                    disabled={migrating}
                                    className="w-full py-4 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-200 disabled:text-slate-400 text-slate-900 font-black rounded-2xl transition-all shadow-xl shadow-amber-500/20 uppercase text-[10px] tracking-widest flex items-center justify-center gap-3"
                                >
                                    {migrating ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
                                    {migrating ? 'Migrando...' : 'Migrar Ingredientes Antiguos'}
                                </button>
                            </div>

                            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                                <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest mb-4 flex items-center gap-3">
                                    <Trash2 size={18} className="text-rose-500" /> Limpieza de Duplicados
                                </h3>
                                <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                                    Si ves ingredientes repetidos, ejecuta el script de limpieza en el SQL Editor de Supabase (archivo <span className="font-bold">cleanup_duplicate_products.sql</span>).
                                </p>
                                <div className="p-4 bg-white border border-slate-200 rounded-xl text-[10px] font-mono text-slate-400">
                                    Mantiene solo 1 copia por nombre.
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredRecipes.map(recipe => (
                            <div key={recipe.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden group flex flex-col h-full">
                                <div className="aspect-video relative overflow-hidden bg-slate-100">
                                    {recipe.photo ? <img src={recipe.photo} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-slate-200"><ChefHat size={40} /></div>}
                                    <div className="absolute top-3 left-3">
                                        <span className={`px-2 py-1 rounded text-[8px] font-black uppercase shadow-lg ${recipe.isPublic ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'}`}>
                                            {recipe.isPublic ? 'Pública' : 'Privada'}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-6 flex-grow flex flex-col justify-between">
                                    <div>
                                        <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest truncate mb-1">Autor: {recipe.ownerEmail || 'Anónimo'}</p>
                                        <h3 className="font-black text-slate-800 uppercase leading-snug line-clamp-2">{recipe.name}</h3>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                                        <button onClick={() => onViewRecipe(recipe)} className="flex items-center gap-2 text-[9px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition-all">
                                            <Eye size={14} /> Inspeccionar
                                        </button>
                                        <span className="text-[9px] font-mono text-slate-300">ID: {recipe.id.substring(0, 6)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
