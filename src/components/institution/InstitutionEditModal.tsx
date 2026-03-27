import React, { useState } from 'react';
import { X, Save, Image as ImageIcon, Globe, Phone, FileText, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Institucion } from '../../types';
import { updateInstitucion } from '../../api';

interface InstitutionEditModalProps {
  institucion: Institucion;
  onClose: () => void;
  onSave: (updated: Institucion) => void;
}

const InstitutionEditModal: React.FC<InstitutionEditModalProps> = ({ institucion, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Institucion>>({
    nombre: institucion.nombre,
    siglas: institucion.siglas || '',
    descripcion: institucion.descripcion || '',
    sitio_web: institucion.sitio_web || institucion.www || '',
    telefono: institucion.telefono || '',
    logo_url: institucion.logo_url || institucion.logoUrl || '',
    banner_url: institucion.banner_url || institucion.bannerUrl || '',
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updated = await updateInstitucion(institucion.id_institucion, formData);
      if (updated) {
        onSave(updated);
        onClose();
      }
    } catch (error) {
      console.error('Error updating institution:', error);
      alert('Error al actualizar los datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Editar Perfil</h2>
            <p className="text-slate-500 font-bold text-sm">Actualiza la identidad de tu institución</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-50 rounded-2xl transition-colors text-slate-400">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <FileText size={12} /> Nombre de la Institución
              </label>
              <input 
                type="text"
                value={formData.nombre}
                onChange={e => setFormData({...formData, nombre: e.target.value})}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Hash size={12} /> Siglas / Acrónimo
              </label>
              <input 
                type="text"
                value={formData.siglas}
                onChange={e => setFormData({...formData, siglas: e.target.value})}
                placeholder="Ej. UNAM, ITESM"
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <ImageIcon size={12} /> Descripción Institucional
            </label>
            <textarea 
              value={formData.descripcion}
              onChange={e => setFormData({...formData, descripcion: e.target.value})}
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all h-32 resize-none"
              placeholder="Habla sobre la historia y visión de la institución..."
            />
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Globe size={12} /> Sitio Web
              </label>
              <input 
                type="url"
                value={formData.sitio_web}
                onChange={e => setFormData({...formData, sitio_web: e.target.value})}
                placeholder="https://www.ejemplo.edu.mx"
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Phone size={12} /> Teléfono de Contacto
              </label>
              <input 
                type="tel"
                value={formData.telefono}
                onChange={e => setFormData({...formData, telefono: e.target.value})}
                placeholder="55 1234 5678"
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all"
              />
            </div>
          </div>

          {/* Visual Assets */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <ImageIcon size={12} /> URL del Logo
              </label>
              <input 
                type="url"
                value={formData.logo_url}
                onChange={e => setFormData({...formData, logo_url: e.target.value})}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all"
              />
              {formData.logo_url && (
                <div className="mt-2 w-16 h-16 bg-slate-50 rounded-xl p-2 border border-slate-100">
                  <img src={formData.logo_url} alt="Preview Logo" className="w-full h-full object-contain" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <ImageIcon size={12} /> URL del Banner
              </label>
              <input 
                type="url"
                value={formData.banner_url}
                onChange={e => setFormData({...formData, banner_url: e.target.value})}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all"
              />
              {formData.banner_url && (
                <div className="mt-2 h-24 w-full bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
                  <img src={formData.banner_url} alt="Preview Banner" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>
        </form>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 py-4 bg-white border border-slate-200 text-slate-500 font-black text-xs uppercase tracking-widest rounded-3xl hover:bg-slate-50 transition-all"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-3xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Guardar Cambios
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default InstitutionEditModal;
