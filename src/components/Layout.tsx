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

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { user, logout } = useAuth();

  const menu = [
    { name: 'Inicio', path: '/', icon: Home },
    { name: 'Oferta Educativa', path: '/oferta', icon: Search },
    { name: 'Instituciones', path: '/instituciones', icon: MapIcon },
    { name: 'Test Vocacional', path: '/test', icon: ClipboardCheck },
    { name: 'Comparador', path: '/comparador', icon: ArrowLeftRight },
    { name: 'Observatorio', path: '/observatorio', icon: BarChart2 },
    ...(user?.role === 'student' ? [{ name: 'Mi Perfil', path: '/perfil', icon: User }] : []),
    ...(user?.role === 'admin' ? [
      { name: 'Administración', path: '/admin', icon: LayoutDashboard },
      { name: 'Panel de Edición', path: '/dashboard', icon: LayoutDashboard }
    ] : []),
    ...(user?.role === 'institution' ? [{ name: 'Panel de Edición', path: '/dashboard', icon: LayoutDashboard }] : []),
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row">
      {/* Mobile Header - More compact and premium */}
      <div className="md:hidden bg-white/80 backdrop-blur-xl border-b border-slate-100 p-4 flex items-center justify-between sticky top-0 z-[1001]">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
            <BookOpen size={20} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-black text-slate-900 leading-none tracking-tight">EduMap</span>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">MÉXICO</span>
          </div>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2.5 text-slate-600 hover:bg-slate-50 rounded-xl transition-all active:scale-90"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar (Mobile Overlay + Desktop Side) */}
      <aside className={`
        fixed inset-y-0 left-0 z-[2000] w-72 bg-white border-r border-slate-100 transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1)
        md:relative md:translate-x-0 md:z-40
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col py-8 px-6">
          {/* Sidebar Header (Same for both) */}
          <div className="flex items-center gap-3 mb-12 px-2">
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100">
              <BookOpen size={24} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-slate-900 tracking-tight leading-none">EduMap</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">MÉXICO</span>
            </div>
          </div>

          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 px-4">EXPLORAR</div>
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
                      <div className={`
                        p-2 rounded-xl transition-all duration-300
                        ${isActive ? 'bg-white shadow-sm' : 'group-hover:bg-white'}
                      `}>
                        <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'scale-110' : ''} />
                      </div>
                      <span className="text-sm">{item.name}</span>
                    </div>
                    {isActive && (
                      <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.6)]" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="pt-8 mt-auto">
            {user ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                    {user.name?.charAt(0) || user.username?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-900 truncate">{user.name || user.username}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{user.role}</div>
                  </div>
                </div>
                <button 
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 font-bold hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all text-sm"
                >
                  <LogOut size={18} />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  setIsSidebarOpen(false);
                  setIsLoginModalOpen(true);
                }}
                className="w-full flex items-center justify-between px-6 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 text-sm group"
              >
                <div className="flex items-center gap-3">
                  <LogIn size={18} strokeWidth={2.5} />
                  <span>Iniciar sesión</span>
                </div>
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Sidebar Backdrop (Mobile only) */}
      {isSidebarOpen && window.innerWidth < 768 && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[1999] md:hidden animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto h-[calc(100vh-130px)] md:h-screen custom-scrollbar pb-[72px] md:pb-0">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav - Premium Floating Style */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 bg-white/90 backdrop-blur-xl border border-slate-100 px-6 py-4 flex items-center justify-between z-[1001] rounded-[28px] shadow-[0_12px_40px_-12px_rgba(0,0,0,0.15)] ring-1 ring-slate-900/5">
        {menu.slice(0, 4).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex flex-col items-center gap-1.5 transition-all duration-300 relative
              ${isActive ? 'text-indigo-600 scale-110' : 'text-slate-400 hover:text-slate-600'}
            `}
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} strokeWidth={2.5} />
                <span className="text-[9px] font-black uppercase tracking-tighter">{item.name.split(' ')[0]}</span>
                <div className={`
                  absolute -bottom-2 w-1 h-1 bg-indigo-600 rounded-full transition-all duration-300
                  ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}
                `} />
              </>
            )}
          </NavLink>
        ))}
        {/* Profile/Admin Quick Access */}
        <NavLink
            to={user ? (user.role === 'admin' ? '/admin' : '/perfil') : '/'}
            onClick={(e) => {
              if (!user) {
                e.preventDefault();
                setIsLoginModalOpen(true);
              }
            }}
            className={({ isActive }) => `
              flex flex-col items-center gap-1.5 transition-all duration-300
              ${isActive ? 'text-indigo-600 scale-110' : 'text-slate-400'}
            `}
          >
            {user ? <User size={20} strokeWidth={2.5} /> : <LogIn size={20} strokeWidth={2.5} />}
            <span className="text-[9px] font-black uppercase tracking-tighter">{user ? 'Perfil' : 'Login'}</span>
          </NavLink>
      </div>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  );
};

export default Layout;
