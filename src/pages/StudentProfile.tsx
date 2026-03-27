import React from 'react';
import { Mail, GraduationCap, MapPin, Star, Clock, ChevronRight, Settings, Bell, Shield, Heart, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../hooks/useFavorites';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

const StudentProfile: React.FC = () => {
  const { user } = useAuth();
  const { favorites, removeFavorite } = useFavorites();

  if (!user) return <div className="p-8 text-center">Inicia sesión para ver tu perfil.</div>;

  return (
    <div className="max-w-6xl mx-auto py-12 animate-fade-in space-y-12 pb-24">
      {/* Profile Header */}
      <div className="relative h-64 rounded-[40px] bg-gradient-to-r from-indigo-600 to-violet-600 overflow-hidden shadow-2xl">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]" />
        <div className="absolute bottom-0 left-0 right-0 p-12 flex flex-col md:flex-row items-end justify-between gap-8">
          <div className="flex items-center gap-8">
            <div className="relative group">
              <div className="w-32 h-32 rounded-[40px] bg-white p-1 shadow-2xl">
                <div className="w-full h-full rounded-[36px] bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-4xl">
                  {user.name?.charAt(0) || user.email.charAt(0)}
                </div>
              </div>
              <button className="absolute -bottom-2 -right-2 p-3 bg-white text-indigo-600 rounded-2xl shadow-xl hover:scale-110 transition-all">
                <Settings size={20} />
              </button>
            </div>
            <div className="text-white space-y-2">
              <h1 className="text-4xl font-bold tracking-tight">{user.name} {user.lastName}</h1>
              <div className="flex flex-wrap items-center gap-6 text-white/80 font-medium">
                <div className="flex items-center gap-2">
                  <Mail size={18} className="text-indigo-300" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap size={18} className="text-indigo-300" />
                  <span>Estudiante</span>
                </div>
              </div>
            </div>
          </div>
          <button className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold rounded-2xl hover:bg-white/20 transition-all flex items-center gap-2">
            Editar Perfil
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-12">
          {/* Favorites/Saved */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <Heart className="text-red-500" size={28} />
                Mis Favoritos
              </h2>
              <Link to="/comparador" className="text-indigo-600 font-bold text-sm hover:underline">Comparar favoritos</Link>
            </div>
            
            {favorites.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence mode="popLayout">
                  {favorites.map((item) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      key={item.id_institucion} 
                      className="glass-card p-6 rounded-[40px] group relative"
                    >
                      <Link to={`/institucion/${item.id_institucion}`} className="block">
                        <div className="relative h-48 rounded-[32px] overflow-hidden mb-6">
                          <img 
                            src={item.imagen_url || `https://picsum.photos/seed/${item.id_institucion}/600/400`} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                            referrerPolicy="no-referrer" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <h3 className="font-bold text-slate-900 text-lg mb-2 group-hover:text-indigo-600 transition-colors">{item.nombre}</h3>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-amber-500 text-sm font-bold">
                            <Star size={14} fill="currentColor" />
                            {item.promedio_calificacion || '4.5'}
                          </div>
                          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                            {item.sostenimiento}
                          </div>
                        </div>
                      </Link>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          removeFavorite(item.id_institucion);
                        }}
                        className="absolute top-8 right-8 p-3 bg-white/90 backdrop-blur-sm rounded-2xl text-slate-400 hover:text-red-500 hover:bg-white shadow-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="py-20 text-center bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                <Heart size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500 font-bold mb-6">Aún no tienes instituciones favoritas.</p>
                <Link to="/" className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all inline-block">
                  Explorar Instituciones
                </Link>
              </div>
            )}
          </section>

          {/* Activity/History */}
          <section>
            <h2 className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-3">
              <Clock className="text-indigo-600" size={28} />
              Actividad Reciente
            </h2>
            <div className="space-y-4">
              {[
                { action: 'Realizaste el Test Vocacional', date: 'Hace 2 días', icon: GraduationCap },
                { action: 'Comparaste UNAM vs IPN', date: 'Hace 5 días', icon: Star },
                { action: 'Viste detalles de Tec de Monterrey', date: 'Hace 1 semana', icon: MapPin },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-6 p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
                  <div className="p-4 bg-white text-indigo-600 rounded-2xl shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <item.icon size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-slate-900">{item.action}</div>
                    <div className="text-sm text-slate-400">{item.date}</div>
                  </div>
                  <ChevronRight size={20} className="text-slate-300" />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-8">
          <div className="glass-panel p-8 rounded-[40px] space-y-8 shadow-2xl shadow-indigo-50">
            <h3 className="text-xl font-bold text-slate-900">Configuración</h3>
            <div className="space-y-2">
              {[
                { label: 'Notificaciones', icon: Bell, color: 'text-amber-500', bg: 'bg-amber-50' },
                { label: 'Privacidad', icon: Shield, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                { label: 'Seguridad', icon: Lock, color: 'text-indigo-500', bg: 'bg-indigo-50' },
              ].map((item) => (
                <button key={item.label} className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 ${item.bg} ${item.color} rounded-xl`}>
                      <item.icon size={20} />
                    </div>
                    <span className="font-bold text-slate-700">{item.label}</span>
                  </div>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
                </button>
              ))}
            </div>
            
            <div className="pt-8 border-t border-slate-100">
              <div className="p-6 rounded-3xl bg-slate-900 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <GraduationCap size={80} />
                </div>
                <h4 className="font-bold mb-2 relative z-10">Plan Premium</h4>
                <p className="text-xs text-slate-400 mb-4 relative z-10">Accede a asesorías personalizadas y datos exclusivos.</p>
                <button className="w-full py-3 bg-white text-slate-900 text-xs font-bold rounded-xl hover:bg-indigo-50 transition-colors relative z-10">
                  Mejorar Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Lock = ({ className, size }: { className?: string, size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

export default StudentProfile;
