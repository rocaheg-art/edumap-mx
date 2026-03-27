import React, { useState } from 'react';
import { LayoutDashboard, Upload, FileJson, AlertCircle, CheckCircle2, Database, ShieldCheck, Info } from 'lucide-react';
import { motion } from 'motion/react';

const AdminImport: React.FC = () => {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleUpload = () => {
    setUploadStatus('idle');
    setTimeout(() => {
      setUploadStatus('success');
    }, 2000);
  };

  return (
    <div className="max-w-5xl mx-auto py-12 animate-fade-in space-y-12">
      <div className="flex items-center justify-between">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <LayoutDashboard className="text-indigo-600" size={36} />
            Panel de Administración
          </h1>
          <p className="text-slate-500 text-lg">Importación masiva de datos y gestión de la plataforma.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-100">
          <ShieldCheck size={16} />
          Acceso Autorizado
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Import Card */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-panel p-12 rounded-[40px] border-indigo-100 bg-white shadow-2xl shadow-indigo-50 text-center space-y-8">
            <div className="flex justify-center">
              <div className="p-8 bg-indigo-50 text-indigo-600 rounded-[32px] shadow-lg shadow-indigo-100">
                <FileJson size={64} strokeWidth={1.5} />
              </div>
            </div>
            
            <div className="max-w-md mx-auto space-y-4">
              <h2 className="text-3xl font-bold text-slate-900">Importar Instituciones</h2>
              <p className="text-slate-500">Sube un archivo JSON estructurado para actualizar la base de datos nacional.</p>
            </div>

            <div className="relative group">
              <input 
                type="file" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={handleUpload}
              />
              <div className="p-12 border-2 border-dashed border-slate-200 rounded-[32px] group-hover:border-indigo-400 group-hover:bg-indigo-50/30 transition-all">
                <Upload className="mx-auto mb-4 text-slate-300 group-hover:text-indigo-500 group-hover:scale-110 transition-all" size={48} />
                <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">Arrastra tu archivo aquí o haz clic</div>
              </div>
            </div>

            {uploadStatus === 'success' && (
              <motion.div 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center gap-3 font-bold"
              >
                <CheckCircle2 size={20} />
                ¡Datos importados correctamente!
              </motion.div>
            )}

            {uploadStatus === 'error' && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 flex items-center justify-center gap-3 font-bold">
                <AlertCircle size={20} />
                Error en el formato del archivo
              </div>
            )}

            <div className="flex items-center justify-center gap-6 pt-4">
              <button className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors">Descargar Plantilla</button>
              <div className="w-1 h-1 rounded-full bg-slate-300" />
              <button className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors">Ver Documentación</button>
            </div>
          </div>
        </div>

        {/* Sidebar Status */}
        <div className="space-y-6">
          <div className="glass-panel p-8 rounded-[32px] bg-slate-900 text-white border-none shadow-2xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-white/10 rounded-2xl">
                <Database size={24} />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Base de Datos</div>
                <div className="text-lg font-bold">Estado del Sistema</div>
              </div>
            </div>

            <div className="space-y-6">
              {[
                { label: 'Instituciones', value: '4,521', color: 'bg-indigo-500' },
                { label: 'Usuarios Activos', value: '12.4k', color: 'bg-emerald-500' },
                { label: 'Consultas Hoy', value: '8.2k', color: 'bg-amber-500' },
              ].map((stat) => (
                <div key={stat.label} className="space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-slate-400">{stat.label}</span>
                    <span>{stat.value}</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full ${stat.color} rounded-full`} style={{ width: '70%' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 rounded-[32px] bg-indigo-50 border border-indigo-100">
            <div className="flex items-start gap-3 text-indigo-600">
              <Info size={24} className="shrink-0" />
              <div className="space-y-2">
                <h4 className="font-bold text-sm uppercase tracking-wider">Nota de Seguridad</h4>
                <p className="text-xs text-indigo-800 leading-relaxed">
                  Todas las importaciones son auditadas y registradas. Asegúrate de verificar el esquema JSON antes de subir.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminImport;
