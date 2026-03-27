import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface EducationalInfo {
  id: number;
  label: string;
  value: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

const MexicoMapVisual: React.FC = () => {
  const [activeInfo, setActiveInfo] = useState<EducationalInfo[]>([]);
  const [dots, setDots] = useState<{ x: number; y: number }[]>([]);
  const dotsRef = useRef<{ x: number; y: number }[]>([]);
  
  const educationalData = [
    { label: 'Matrícula Superior', value: '5,225,100' },
    { label: 'Egresados ANUIES', value: '890,400' },
    { label: 'Instituciones', value: '3,865' },
    { label: 'Carreras STEM', value: '32.4%' },
    { label: 'Programas Académicos', value: '14,243' },
    { label: 'Matrícula Mujeres', value: '52.4%' },
    { label: 'Eficiencia Terminal', value: '82.1%' },
    { label: 'Probabilidad Ingreso', value: '68.5%' }
  ];

  const mexicoPath = "M506.752,291.992h-28.989c-0.73,0-1.457,0.157-2.126,0.448l-25.459,11.32 c-1.895,0.841-3.114,2.722-3.114,4.788v17.583c0,0.791-0.178,1.574-0.524,2.286l-11.805,24.394h-12.946 c-0.68,0-1.353,0.135-1.98,0.392l-32.463,13.28c-1.706,0.698-3.65,0.449-5.126-0.662l-9.479-7.103 c-0.844-0.635-1.863-0.998-2.918-1.048l-14.583-0.627c-1.693-0.079-3.249-0.97-4.168-2.387l-35.184-54.302 c-0.74-1.148-1.004-2.536-0.74-3.876l13.522-67.596c0.495-2.486-0.855-4.966-3.213-5.899l-33.517-13.273 c-1.204-0.47-2.187-1.374-2.76-2.528l-27.407-54.815c-0.802-1.603-2.369-2.686-4.15-2.864l-17.608-1.824 c-2.048-0.214-4.032,0.798-5.069,2.572l-7.074,12.118c-0.713,1.232-1.895,2.116-3.277,2.45c-1.379,0.342-2.839,0.107-4.039-0.655 l-15.695-9.882c-1.218-0.762-2.07-1.994-2.352-3.405l-3.33-16.657c-0.218-1.09-0.784-2.087-1.61-2.843l-25.171-22.954 c-0.965-0.877-2.226-1.368-3.534-1.368h-22.317c-2.893,0-5.24,2.344-5.24,5.243v2.978h-34.87c-0.851,0-1.692-0.206-2.444-0.606 L43.826,83.006C43.07,82.607,42.23,82.4,41.378,82.4H5.244c-1.646,0-3.199,0.769-4.185,2.087c-0.991,1.311-1.311,3.014-0.855,4.596 l14.167,49.592c0.235,0.826,0.673,1.582,1.272,2.202l18.719,19.392c1.909,1.974,1.966,5.087,0.135,7.131l-7.042,7.872 c-0.958,1.069-1.436,2.487-1.318,3.919c0.118,1.438,0.819,2.757,1.941,3.662l28.081,22.599c0.851,0.691,1.47,1.631,1.763,2.678 l7.477,26.924c0.193,0.691,0.524,1.332,0.972,1.888l30.069,37.232c0.95,1.183,2.365,1.888,3.879,1.945 c1.51,0.057,2.974-0.542,4.015-1.639l6.946-7.36c1.696-1.795,1.909-4.531,0.516-6.561l-18.887-27.607 c-0.064-0.092-0.125-0.185-0.182-0.285L75.074,202.98c-0.228-0.384-0.406-0.798-0.531-1.226l-8.595-29.708 c-0.172-0.577-0.442-1.126-0.798-1.624l-25.152-34.575c-0.399-0.555-0.692-1.183-0.855-1.845l-7.15-29.409l26.624,12.168 c1.361,0.628,2.394,1.803,2.832,3.235l11.299,36.912c0.225,0.734,0.606,1.403,1.118,1.974l41.607,46.23 c1.24,1.382,1.66,3.306,1.107,5.072l-2.322,7.438c-0.556,1.774-0.128,3.705,1.118,5.087l68.953,76.003 c0.877,0.969,1.361,2.223,1.361,3.527v19.342l-4.909,1.511c-1.454,0.449-2.64,1.503-3.252,2.892 c-0.613,1.39-0.595,2.978,0.05,4.353l9.775,20.768c0.517,1.104,1.408,1.994,2.518,2.515l152.764,71.608 c1.999,0.94,4.371,0.526,5.935-1.04l17.234-17.226c0.98-0.984,2.316-1.54,3.705-1.54h12.582c1.094,0,2.166,0.342,3.057,0.984 l30.969,22.214c1.315,0.948,2.993,1.226,4.538,0.77c1.553-0.449,2.804-1.604,3.398-3.106l6.957-17.668 c0.766-1.938,2.604-3.242,4.688-3.32l13.714-0.506c2.818-0.106,5.051-2.422,5.051-5.236v-4.538c0-1.718-0.845-3.328-2.262-4.311 l-6.166-4.267c-1.415-0.976-2.259-2.586-2.259-4.31v-12.048h28.326c1.81,0,3.488-0.933,4.446-2.465l34.653-55.442 c0.52-0.827,0.798-1.796,0.798-2.779v-12.154C512,294.336,509.649,291.992,506.752,291.992z";

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const path = new Path2D(mexicoPath);
    const generatedDots: { x: number; y: number }[] = [];
    const step = 14; 

    for (let x = 0; x <= 512; x += step) {
      for (let y = 0; y <= 512; y += step) {
        if (ctx.isPointInPath(path, x, y)) {
          generatedDots.push({ x, y });
        }
      }
    }
    setDots(generatedDots);
    dotsRef.current = generatedDots;
  }, []);

  const spawnInfo = () => {
    if (dotsRef.current.length === 0) return;
    
    const randomData = educationalData[Math.floor(Math.random() * educationalData.length)];
    const startDot = dotsRef.current[Math.floor(Math.random() * dotsRef.current.length)];
    
    const outerPositions = [
      { x: 40, y: 120 }, { x: 470, y: 120 },
      { x: 40, y: 380 }, { x: 470, y: 380 },
      { x: 256, y: 30 }, { x: 256, y: 480 }
    ];
    
    const target = outerPositions[Math.floor(Math.random() * outerPositions.length)];
    
    const newInfo: EducationalInfo = {
      id: Date.now(),
      label: randomData.label,
      value: randomData.value,
      startX: startDot.x,
      startY: startDot.y,
      endX: target.x + (Math.random() * 60 - 30),
      endY: target.y + (Math.random() * 60 - 30),
    };

    setActiveInfo(prev => [...prev, newInfo].slice(-2));
  };

  useEffect(() => {
    const interval = setInterval(spawnInfo, 6000);
    spawnInfo();
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex items-center justify-center w-full max-w-5xl mx-auto h-[600px] lg:h-[700px] overflow-hidden">
      <div className="absolute w-[800px] h-[800px] bg-indigo-500/5 blur-[180px] rounded-full pointer-events-none"></div>
      
      <div className="relative w-full h-full flex items-center justify-center scale-75 md:scale-90 lg:scale-100">
        <svg 
          viewBox="0 0 512 512" 
          className="w-full h-full overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            
            <linearGradient id="thinScan" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0" />
              <stop offset="50%" stopColor="#818cf8" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
            </linearGradient>
          </defs>

          <style>
            {`
              @keyframes emergence {
                0% { 
                  opacity: 0; 
                  transform: translate(var(--startX), var(--startY)) scale(0.2);
                  filter: blur(4px);
                }
                15% { 
                  opacity: 1; 
                  transform: translate(var(--endX), var(--endY)) scale(1);
                  filter: blur(0px);
                }
                92% { 
                  opacity: 1; 
                  transform: translate(var(--endX), var(--endY)) scale(1);
                  filter: blur(0px);
                }
                100% { 
                  opacity: 0; 
                  transform: translate(var(--endX), calc(var(--endY) - 20px)) scale(0.95);
                  filter: blur(2px);
                }
              }
              .emerging-tag {
                animation: emergence 7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
              }
              .dot-organic {
                animation: organic-pulse 5s infinite alternate ease-in-out;
              }
              @keyframes organic-pulse {
                0% { fill-opacity: 0.2; transform: scale(0.85); }
                100% { fill-opacity: 0.8; transform: scale(1.05); }
              }
            `}
          </style>

          {/* Escaneo vertical sutil */}
          <rect x="0" y="0" width="512" height="40" fill="url(#thinScan)" opacity="0.1">
            <animate attributeName="y" values="-60;520" dur="10s" repeatCount="indefinite" />
          </rect>

          {/* MAPA DE PUNTOS */}
          <g filter="url(#softGlow)">
            {dots.map((dot, i) => (
              <circle 
                key={i} 
                cx={dot.x} 
                cy={dot.y} 
                r="2.8" 
                className="fill-indigo-400/60 dot-organic" 
                style={{ 
                  animationDelay: `${Math.random() * 5}s`,
                  transformOrigin: `${dot.x}px ${dot.y}px`
                }} 
              />
            ))}
          </g>

          {/* ETIQUETAS QUE EMERGEN DEL MAPA */}
          <AnimatePresence>
          {activeInfo.map(info => (
            <g 
              key={info.id} 
              className="emerging-tag pointer-events-none"
              style={{ 
                '--startX': `${info.startX}px`, 
                '--startY': `${info.startY}px`,
                '--endX': `${info.endX}px`,
                '--endY': `${info.endY}px`
              } as any}
            >
              {/* Línea de conexión minimalista */}
              <circle cx={info.startX - info.endX} cy={info.startY - info.endY} r="1.5" className="fill-indigo-400/40" />
              
              {/* Tag Minimalista: Glassmorphism Pill */}
              <rect 
                x="-75" 
                y="-24" 
                width="150" 
                height="48" 
                rx="24" 
                fill="rgba(15, 23, 42, 0.6)" 
                className="backdrop-blur-md"
              />
              
              {/* Contenido Limpio */}
              <text textAnchor="middle" y="-6" className="fill-indigo-200/70 font-bold text-[7px] uppercase tracking-[0.2em]">
                {info.label}
              </text>
              <text textAnchor="middle" y="14" className="fill-white font-black text-[16px] tracking-tight">
                {info.value}
              </text>
            </g>
          ))}
          </AnimatePresence>
        </svg>
      </div>

      {/* Footer minimalista */}
      <div className="absolute bottom-6 flex flex-col items-center space-y-2 opacity-20 pointer-events-none">
        <div className="flex items-center space-x-3">
           <div className="w-8 h-[1px] bg-indigo-500/50"></div>
           <p className="text-[9px] font-black uppercase tracking-[0.8em] text-indigo-400">EduMap MX Analytics</p>
           <div className="w-8 h-[1px] bg-indigo-500/50"></div>
        </div>
      </div>
    </div>
  );
};

export default MexicoMapVisual;
