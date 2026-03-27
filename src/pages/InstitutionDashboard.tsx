import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { getInstitucionById, updateInstitucion, getGalleryByInstitucion, addGalleryImage, deleteGalleryImage, searchInstitucionesSuggest } from '../api';
import { Institucion, GaleriaImagen } from '../types';
import { Save, Image as ImageIcon, Trash2, Plus, AlertCircle, CheckCircle2, LayoutDashboard, Building2, Upload, Search, Users, ShieldCheck } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const InstitutionDashboard = () => {
  const { user } = useAuth();
  const [activeId, setActiveId] = useState<number | null>(null);
  const [institucion, setInstitucion] = useState<Institucion | null>(null);
  const [gallery, setGallery] = useState<GaleriaImagen[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState<Partial<Institucion>>({});
  const [isSavingInst, setIsSavingInst] = useState(false);
  const [instError, setInstError] = useState('');
  const [instSuccess, setInstSuccess] = useState(false);

  const [newImage, setNewImage] = useState({ url: '', desc: '' });
  const [isUploadingObj, setIsUploadingObj] = useState(false);

  // Admin search state
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Institucion[]>([]);

  // Initialize activeId
  useEffect(() => {
    if (user?.role === 'institution') {
      setActiveId(user.id);
    }
  }, [user]);

  // Load Data based on activeId
  useEffect(() => {
    if (!activeId) {
      if (user?.role === 'institution') return; // Wait for activeId to be set
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([
      getInstitucionById(activeId),
      getGalleryByInstitucion(activeId)
    ]).then(([inst, images]) => {
      if (inst) {
        setInstitucion(inst);
        setFormData({
          nombre: inst.nombre || '',
          descripcion: inst.descripcion || '',
          telefono: inst.telefono || '',
          sitio_web: inst.sitio_web || inst.www || '',
          banner_url: inst.banner_url || inst.bannerUrl || '',
          logo_url: inst.logo_url || inst.logoUrl || '',
          siglas: inst.siglas || '',
          id_sostenimiento: inst.id_sostenimiento || '',
          id_subsistema: inst.id_subsistema || ''
        });
      }
      setGallery(images || []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [activeId, user]);

  useEffect(() => {
    if (user?.role === 'admin' && searchTerm.length > 2) {
      searchInstitucionesSuggest(searchTerm).then(setSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [searchTerm, user]);

  if (!user) return <Navigate to="/" />;
  if (user.role !== 'institution' && user.role !== 'admin') return <Navigate to="/perfil" />;

  const handleSaveInstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!institucion?.id_institucion) return;
    
    setIsSavingInst(true);
    setInstError('');
    setInstSuccess(false);
    try {
      const updated = await updateInstitucion(institucion.id_institucion, formData);
      if (updated) setInstitucion(updated);
      setInstSuccess(true);
      setTimeout(() => setInstSuccess(false), 3000);
    } catch (err: any) {
      setInstError(err.message || 'Error al guardar los datos');
    } finally {
      setIsSavingInst(false);
    }
  };

  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!institucion?.id_institucion || !newImage.url) return;
    
    setIsUploadingObj(true);
    try {
      await addGalleryImage({
        id_institucion: institucion.id_institucion,
        imagenUrl: newImage.url,
        descripcion: newImage.desc
      });
      const updatedGallery = await getGalleryByInstitucion(institucion.id_institucion);
      setGallery(updatedGallery);
      setNewImage({ url: '', desc: '' });
    } catch (err) {
      console.error('Error adding image', err);
    } finally {
      setIsUploadingObj(false);
    }
  };

  const handleDeleteImage = async (imgId: number) => {
    if (!confirm('¿Estás seguro de eliminar esta imagen?')) return;
    try {
      await deleteGalleryImage(imgId);
      setGallery(prev => prev.filter(img => img.id_imagen !== imgId));
    } catch (err) {
      console.error('Error deleting image', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 bg-slate-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent flex items-center justify-center rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 bg-slate-50">
      <div className="max-w-7xl mx-auto px-8 space-y-8">
        
        {/* Admin Search Section */}
        {user.role === 'admin' && (
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <ShieldCheck size={120} />
            </div>
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
                  <Search size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Módulo Administrador</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Busca una institución para editar sus imágenes y datos</p>
                </div>
              </div>

              <div className="relative max-w-2xl">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-400">
                  <Search size={18} />
                </div>
                <input 
                  type="text" 
                  placeholder="Escribe el nombre de la institución..."
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-[28px] focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none transition-all font-bold text-slate-700 shadow-sm"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />

                <AnimatePresence>
                  {suggestions.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute left-0 right-0 top-full mt-3 bg-white border border-slate-100 rounded-[32px] shadow-2xl z-50 overflow-hidden divide-y divide-slate-50"
                    >
                      {suggestions.map(s => (
                        <button
                          key={s.id_institucion}
                          onClick={() => {
                            setActiveId(s.id_institucion);
                            setSearchTerm('');
                            setSuggestions([]);
                          }}
                          className="w-full px-8 py-5 flex items-center justify-between hover:bg-indigo-50 transition-colors group text-left"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-white transition-colors">
                              <Building2 size={24} />
                            </div>
                            <div>
                              <div className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{s.nombre}</div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.siglas || 'Institución'}</div>
                            </div>
                          </div>
                          <Plus size={18} className="text-slate-300 group-hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all" />
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}

        {/* Admin Dashboard Banner */}
        {user.role === 'admin' && institucion && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-indigo-600 p-6 rounded-[32px] text-white flex items-center justify-between shadow-xl shadow-indigo-100"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <ShieldCheck size={28} />
              </div>
              <div>
                <h3 className="font-black text-lg">Modo Administrador Activo</h3>
                <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest">Editando: {institucion.nombre}</p>
              </div>
            </div>
            <button 
              onClick={() => { setActiveId(null); setInstitucion(null); }}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
            >
              Cerrar Edición
            </button>
          </motion.div>
        )}

        {!institucion && user.role === 'admin' ? (
          <div className="bg-white p-20 rounded-[48px] border-2 border-dashed border-slate-200 text-center space-y-4">
             <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mx-auto">
                <Search size={40} />
             </div>
             <h3 className="text-xl font-black text-slate-400">Selecciona una institución para comenzar</h3>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4">
              <div className="space-y-2">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  <LayoutDashboard className="text-indigo-600" size={36} />
                  {user.role === 'admin' ? 'Editor Global' : 'Panel Institucional'}
                </h1>
                <p className="text-slate-500 font-bold ml-1">
                  {user.role === 'admin' ? `Gestión de archivos para ${institucion?.nombre}` : 'Administra la información pública de tu institución.'}
                </p>
              </div>
              <div className="px-6 py-3 bg-white rounded-full border border-slate-200 flex items-center gap-3 shadow-sm">
                <Building2 size={20} className="text-slate-400" />
                <span className="font-black text-slate-700 truncate max-w-[200px]">{institucion?.nombre || user.name}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Info Editor */}
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white p-8 md:p-10 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50">
                  <div className="flex items-center justify-between mb-8 pb-8 border-b border-slate-100">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900">Datos Principales</h2>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Información visible para los estudiantes</p>
                    </div>
                  </div>

                  {instError && (
                    <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 font-semibold text-sm">
                      <AlertCircle size={20} /> {instError}
                    </div>
                  )}
                  {instSuccess && (
                    <div className="mb-8 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-600 font-semibold text-sm">
                      <CheckCircle2 size={20} /> Perfil actualizado correctamente
                    </div>
                  )}

                  <form onSubmit={handleSaveInstitution} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Nombre Oficial</label>
                        <input 
                          type="text" 
                          required
                          className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all font-bold text-slate-700"
                          value={formData.nombre || ''}
                          onChange={e => setFormData({...formData, nombre: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Siglas / Acrónimo</label>
                        <input 
                          type="text" 
                          className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all font-bold text-slate-700 uppercase"
                          value={formData.siglas || ''}
                          onChange={e => setFormData({...formData, siglas: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Teléfono de Contacto</label>
                        <input 
                          type="text" 
                          className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all font-bold text-slate-700"
                          value={formData.telefono || ''}
                          onChange={e => setFormData({...formData, telefono: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Sitio Web</label>
                        <input 
                          type="url" 
                          className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all font-bold text-slate-700"
                          value={formData.sitio_web || ''}
                          onChange={e => setFormData({...formData, sitio_web: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resumen Institucional / Descripción</label>
                        <span className="text-[10px] font-bold text-slate-300">{(formData.descripcion?.length || 0)} caracteres</span>
                      </div>
                      <textarea 
                        className="w-full px-8 py-6 bg-slate-50 rounded-[32px] border border-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-medium text-slate-600 min-h-[220px] resize-none leading-relaxed"
                        placeholder="Describe la misión, visión y valores de tu institution..."
                        value={formData.descripcion || ''}
                        onChange={e => setFormData({...formData, descripcion: e.target.value})}
                      />
                      <p className="text-[10px] text-slate-400 font-medium px-4">Este texto aparecerá en la sección "Resumen" de tu perfil público.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">URL del Logo</label>
                        <input 
                          type="url" 
                          className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all font-bold text-slate-700 text-sm"
                          value={formData.logo_url || ''}
                          onChange={e => setFormData({...formData, logo_url: e.target.value})}
                        />
                        {formData.logo_url && (
                          <div className="mt-2 w-16 h-16 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 p-2">
                            <img src={formData.logo_url} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">URL del Banner Principal</label>
                        <input 
                          type="url" 
                          className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all font-bold text-slate-700 text-sm"
                          value={formData.banner_url || ''}
                          onChange={e => setFormData({...formData, banner_url: e.target.value})}
                        />
                        {formData.banner_url && (
                          <div className="mt-2 h-16 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                            <img src={formData.banner_url} alt="Banner" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex justify-end">
                      <button 
                        type="submit" 
                        disabled={isSavingInst}
                        className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center gap-3 disabled:opacity-50"
                      >
                        <Save size={18} />
                        {isSavingInst ? 'Guardando...' : 'Guardar Información'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Gallery Sidebar */}
              <div className="space-y-8">
                <div className="bg-slate-900 rounded-[40px] p-8 md:p-10 shadow-2xl text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-32 -mt-32" />
                  
                  <div className="relative z-10 space-y-8">
                    <div>
                      <h2 className="text-2xl font-black flex items-center gap-3">
                        <ImageIcon className="text-indigo-400" size={28} />
                        Galería Fotográfica
                      </h2>
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">Personaliza las imágenes de tu perfil</p>
                    </div>

                    <form onSubmit={handleAddImage} className="space-y-4 bg-white/5 p-6 rounded-[24px] border border-white/10 backdrop-blur-md">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/50 uppercase tracking-widest px-2">URL de la Imagen</label>
                        <input 
                          type="url" 
                          required
                          placeholder="https://..."
                          className="w-full px-5 py-3 bg-slate-900 border border-white/10 rounded-xl focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none transition-all font-medium text-sm text-slate-200"
                          value={newImage.url}
                          onChange={e => setNewImage({...newImage, url: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/50 uppercase tracking-widest px-2">Breve Descripción</label>
                        <input 
                          type="text" 
                          placeholder="Fachada principal, Laboratorio..."
                          className="w-full px-5 py-3 bg-slate-900 border border-white/10 rounded-xl focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none transition-all font-medium text-sm text-slate-200"
                          value={newImage.desc}
                          onChange={e => setNewImage({...newImage, desc: e.target.value})}
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={isUploadingObj || !newImage.url}
                        className="w-full py-4 mt-2 bg-indigo-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <Upload size={16} />
                        Agregar Imagen
                      </button>
                    </form>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="h-px flex-1 bg-white/10" />
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{gallery.length} Imágenes</span>
                        <span className="h-px flex-1 bg-white/10" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
                        {gallery.map(img => (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            key={img.id_imagen} 
                            className="relative aspect-square rounded-2xl overflow-hidden group border border-white/10"
                          >
                            <img src={img.imagenUrl} alt={img.descripcion} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                              <button 
                                onClick={() => handleDeleteImage(img.id_imagen)}
                                className="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                        {gallery.length === 0 && (
                          <div className="col-span-2 py-8 text-center text-slate-400">
                              <ImageIcon className="mx-auto mb-2 opacity-50" size={32} />
                              <p className="text-xs font-bold uppercase tracking-wider">No hay imágenes en la galería</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InstitutionDashboard;
