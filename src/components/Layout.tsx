import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Search, 
  Map as MapIcon, 
  BookOpen, 
  User, 
  Menu, 
  X, 
  LogOut, 
  LogIn,
  LayoutDashboard,
  ArrowLeftRight,
  ClipboardCheck,
  ChevronRight,
  BarChart2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoginModal from './LoginModal';
import { useUI } from '../context/UIContext';
import { motion } from 'framer-motion';
import Logo from './Logo';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { user, logout } = useAuth();
  const { isSidebarHidden } = useUI();

  const menu = [
    { name: 'Inicio', path: '/', icon: Home },
    { name: 'Oferta', path: '/oferta', icon: Search },
    { name: 'Instituciones', path: '/instituciones', icon: MapIcon },
    { name: 'Observatorio', path: '/observatorio', icon: BarChart2 },
    { name: 'Comparador', path: '/comparador', icon: ArrowLeftRight },
  ];

  return (
    <div className={`min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row ${isSidebarHidden ? 'overflow-hidden' : ''}`}>
      {/* Mobile Header - Ultra-premium Glass Header */}
      {!isSidebarHidden && (
        <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/70 backdrop-blur-2xl border-b border-slate-100/50 flex items-center justify-between px-6 z-[1001]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100 p-1.5">
              <Logo size="100%" color="white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-slate-900 leading-none tracking-tight">EduMap</span>
              <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-0.5">MÉXICO</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
               <NavLink to="/perfil" className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 overflow-hidden">
                 {user.photoURL ? <img src={user.photoURL} alt="p" className="w-full h-full object-cover" /> : <User size={16} className="text-slate-600" />}
               </NavLink>
            ) : (
                <button 
                  onClick={() => setIsLoginModalOpen(true)}
                  className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
                >
                  <LogIn size={18} strokeWidth={2.5} />
                </button>
            )}
          </div>
        </div>
      )}

      {/* Sidebar (Mobile Overlay + Desktop Side) */}
      {!isSidebarHidden && (
        <aside className={`
          fixed inset-y-0 left-0 z-[2000] w-72 bg-white border-r border-slate-100 transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1)
          md:relative md:translate-x-0 md:z-40
          ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        `}>
          {/* ... sidebar content remains similar but ensuring it doesn't overlap header on desktop if needed ... */}
          {/* (I'll keep the sidebar content as is but it will be hidden/shown via toggle) */}
        <div className="h-full flex flex-col py-8 px-6">
          <div className="flex items-center gap-3 mb-10 px-2 outline-none">
            <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100 p-2">
              <Logo size="100%" color="white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-slate-900 tracking-tight leading-none">EduMap</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">MÉXICO</span>
            </div>
          </div>

          <nav className="flex-1 space-y-1.5">
            {menu.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                   if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}
                className={({ isActive }) => `
                  flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group
                  ${isActive 
                    ? 'bg-indigo-50 text-indigo-600 font-bold' 
                    : 'text-slate-500 hover:bg-slate-50 font-medium'}
                `}
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-4">
                      <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                      <span className="text-sm">{item.name}</span>
                    </div>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="pt-8">
             {user ? (
               <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 font-bold hover:text-red-500 rounded-2xl transition-all text-sm">
                 <LogOut size={18} />
                 <span>Cerrar Sesión</span>
               </button>
             ) : (
               <button onClick={() => { setIsSidebarOpen(false); setIsLoginModalOpen(true); }} className="btn-primary w-full text-sm">
                 Iniciar sesión
               </button>
             )}
          </div>
        </div>
      </aside>
      )}

      {/* Sidebar Backdrop (Mobile only) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[1999] md:hidden animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className={`
        flex-1 relative overflow-y-auto h-screen custom-scrollbar transition-all
        ${!isSidebarHidden ? 'pt-16 md:pt-0 pb-32 md:pb-0' : ''}
      `}>
        <div className="p-4 md:p-10 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation - Premium iOS Pill style */}
      {!isSidebarHidden && (
        <div className="md:hidden fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] z-[1001] animate-slide-up">
          <div className="relative bg-white/80 backdrop-blur-3xl border border-white/40 px-3 py-2.5 flex items-center justify-around rounded-[32px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] ring-1 ring-slate-900/5 overflow-hidden">
            {menu.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  relative flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-500
                  ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-110 -translate-y-1' : 'text-slate-400'}
                `}
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                    {isActive && (
                      <motion.div 
                        layoutId="pill-active"
                        className="absolute -bottom-1 w-1 h-1 bg-white rounded-full"
                        transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      )}

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  );
};

export default Layout;
