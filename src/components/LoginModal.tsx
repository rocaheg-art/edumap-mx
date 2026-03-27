import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Mail, Lock, User, UserCircle, GraduationCap, Building2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'student' | 'institution'>('student');
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    email: '',
    password: '',
    identifier: '' // For institution username
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        const identifier = role === 'student' ? formData.email : formData.identifier;
        await login(identifier, formData.password, role);
      } else {
        await register({
          ...formData,
          role: role
        });
      }
      onClose();
      navigate(role === 'student' ? '/perfil' : '/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ocurrió un error al procesar tu solicitud';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="relative p-8 bg-indigo-600 text-white">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
          
          <h2 className="text-3xl font-bold mb-2">
            {isLogin ? '¡Bienvenido de nuevo!' : 'Crea tu cuenta'}
          </h2>
          <p className="text-indigo-100">
            {isLogin ? 'Accede a tu panel personalizado' : 'Únete a la comunidad educativa'}
          </p>
        </div>

        {/* Role Selector */}
        <div className="flex p-2 bg-slate-50 border-b border-slate-100">
          <button
            onClick={() => setRole('student')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
              role === 'student' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <GraduationCap size={20} />
            Estudiante
          </button>
          <button
            onClick={() => setRole('institution')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
              role === 'institution' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Building2 size={20} />
            Institución
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-3">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {!isLogin && role === 'student' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase px-1">Nombre</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    placeholder="Juan"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase px-1">Apellidos</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="Pérez"
                  value={formData.lastName}
                  onChange={e => setFormData({...formData, lastName: e.target.value})}
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase px-1">
              {role === 'student' ? 'Correo Electrónico' : 'Nombre de Usuario'}
            </label>
            <div className="relative">
              {role === 'student' ? (
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              ) : (
                <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              )}
              <input
                type={role === 'student' ? 'email' : 'text'}
                required
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder={role === 'student' ? 'juan@ejemplo.com' : 'admin_unam'}
                value={role === 'student' ? formData.email : formData.identifier}
                onChange={e => setFormData({
                  ...formData, 
                  [role === 'student' ? 'email' : 'identifier']: e.target.value
                })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase px-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                required
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Procesando...' : (isLogin ? 'Entrar' : 'Registrarse')}
          </button>

          <div className="text-center pt-4">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
            >
              {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default LoginModal;
