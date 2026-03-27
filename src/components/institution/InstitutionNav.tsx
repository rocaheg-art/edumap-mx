import React from 'react';
import { ArrowLeft, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

interface InstitutionNavProps {
  id: string;
  isAdmin: boolean;
  activeSection: string;
  scrollTo: (id: string) => void;
  counts: {
    campus: number;
    oferta: number;
    reseñas: number;
    convocatorias: number;
  };
}

const InstitutionNav: React.FC<InstitutionNavProps> = ({ id, isAdmin, activeSection, scrollTo, counts }) => {
  const navItems = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'campus', label: 'Campus', count: counts.campus },
    { id: 'oferta', label: 'Oferta', count: counts.oferta },
    { id: 'estadisticas', label: 'Estadísticas' },
    { id: 'reseñas', label: 'Reseñas', count: counts.reseñas },
    { id: 'convocatorias', label: 'Convocatorias', count: counts.convocatorias }
  ];

  return (
    <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8 overflow-x-auto no-scrollbar">
          {navItems.map(nav => (
            (nav.count === undefined || nav.count > 0) && (
              <button
                key={nav.id}
                onClick={() => scrollTo(nav.id)}
                className={`relative h-16 flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${activeSection === nav.id ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-900'}`}
              >
                {nav.label}
                {nav.count !== undefined && (
                  <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] font-black text-slate-500">
                    {nav.count}
                  </span>
                )}
                {activeSection === nav.id && (
                  <motion.div layoutId="nav-active" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />
                )}
              </button>
            )
          ))}
        </div>
        <div className="hidden lg:flex items-center gap-4">
           <Link to="/instituciones" className="text-slate-400 hover:text-slate-900 transition-colors">
              <ArrowLeft size={20} />
           </Link>
           {isAdmin && (
             <Link to={`/admin/edit/${id}`} className="p-2 bg-slate-900 text-white rounded-xl hover:scale-105 transition-all">
                <Settings size={20} />
             </Link>
           )}
        </div>
      </div>
    </div>
  );
};

export default InstitutionNav;
