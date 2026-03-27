import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardCheck, Sparkles, ChevronRight, ChevronLeft, GraduationCap, Target, Brain, Lightbulb } from 'lucide-react';

const VocationalTest: React.FC = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  const questions = [
    { id: 1, text: '¿Te gusta resolver problemas matemáticos complejos?', icon: Brain },
    { id: 2, text: '¿Disfrutas diseñando o creando cosas nuevas?', icon: Lightbulb },
    { id: 3, text: '¿Te interesa ayudar a las personas en su bienestar?', icon: Target },
    { id: 4, text: '¿Te sientes cómodo liderando equipos de trabajo?', icon: GraduationCap },
  ];

  const handleAnswer = (value: number) => {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setIsFinished(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 animate-fade-in">
      {!isFinished ? (
        <div className="space-y-12">
          <div className="text-center space-y-4">
            <div className="inline-flex p-4 bg-indigo-600 text-white rounded-3xl shadow-xl shadow-indigo-100 mb-4">
              <ClipboardCheck size={32} />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Test Vocacional</h1>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">Descubre tu camino ideal respondiendo unas breves preguntas sobre tus intereses y habilidades.</p>
          </div>

          {/* Progress Bar */}
          <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${((step + 1) / questions.length) * 100}%` }}
              className="absolute inset-y-0 left-0 bg-indigo-600 rounded-full"
            />
          </div>

          {/* Question Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="glass-panel p-12 rounded-[40px] text-center space-y-8"
            >
              <div className="flex justify-center">
                <div className="p-6 bg-indigo-50 text-indigo-600 rounded-full">
                  {React.createElement(questions[step].icon, { size: 48 })}
                </div>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 leading-tight">{questions[step].text}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Mucho', value: 5, color: 'bg-indigo-600 text-white' },
                  { label: 'Algo', value: 4, color: 'bg-indigo-50 text-indigo-600' },
                  { label: 'Poco', value: 2, color: 'bg-indigo-50 text-indigo-600' },
                  { label: 'Nada', value: 1, color: 'bg-indigo-50 text-indigo-600' },
                ].map((option) => (
                  <button
                    key={option.label}
                    onClick={() => handleAnswer(option.value)}
                    className={`p-6 rounded-2xl font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${option.color}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between items-center text-slate-400 font-bold uppercase tracking-widest text-xs">
            <button 
              disabled={step === 0}
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-2 hover:text-indigo-600 disabled:opacity-30"
            >
              <ChevronLeft size={16} />
              Anterior
            </button>
            <span>Pregunta {step + 1} de {questions.length}</span>
          </div>
        </div>
      ) : (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-12 py-12"
        >
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 animate-pulse" />
            <div className="relative p-8 bg-white rounded-[40px] shadow-2xl border border-indigo-50">
              <Sparkles className="text-indigo-600 mx-auto mb-6" size={64} />
              <h2 className="text-4xl font-bold text-slate-900 mb-4">¡Resultados Listos!</h2>
              <p className="text-slate-500 text-lg mb-8">Tu perfil sugiere una fuerte inclinación hacia:</p>
              
              <div className="inline-flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-xl shadow-xl shadow-indigo-100">
                <GraduationCap size={28} />
                Ingeniería y Tecnología
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Compatibilidad', value: '94%', icon: Target },
              { title: 'Habilidades', value: 'Lógica', icon: Brain },
              { title: 'Intereses', value: 'Innovación', icon: Lightbulb },
            ].map((stat) => (
              <div key={stat.title} className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm">
                <stat.icon className="text-indigo-600 mx-auto mb-3" size={24} />
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">{stat.title}</div>
                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
              </div>
            ))}
          </div>

          <button className="inline-flex items-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl">
            Ver Carreras Recomendadas
            <ChevronRight size={20} />
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default VocationalTest;
