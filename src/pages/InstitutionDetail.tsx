import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Review, Institucion, Oferta, GaleriaImagen, Convocatoria, Escuela } from '../types';
import { 
  getInstitucionById, 
  getReviewsByInstitucion, 
  getOfertasByInstitucion, 
  getGalleryByInstitucion, 
  getConvocatoriasByInstitucion,
  getEscuelasByInstitucion,
  getInstitutionAgeStats,
  postReview
} from '../api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';
import { EstadisticasEdad } from '../types';

// Modular Components
import InstitutionHero from '../components/institution/InstitutionHero';
import InstitutionNav from '../components/institution/InstitutionNav';
import InstitutionSections from '../components/institution/InstitutionSections';
import OfferDetailModal from '../components/OfferDetailModal';
import InstitutionEditModal from '../components/institution/InstitutionEditModal';

const InstitutionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  
  // State
  const [institucion, setInstitucion] = useState<Institucion | null>(null);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [gallery, setGallery] = useState<GaleriaImagen[]>([]);
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);
  const [escuelas, setEscuelas] = useState<Escuela[]>([]);
  const [ageStats, setAgeStats] = useState<EstadisticasEdad[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedOferta, setSelectedOferta] = useState<Oferta | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newReview, setNewReview] = useState({ calificacion: 5, comentario: '' });
  const [activeLevel, setActiveLevel] = useState<string>('');
  
  const isAdmin = user?.role === 'institution' && user?.id === Number(id);

  // Nav Refs
  const sections = {
    resumen: useRef<HTMLElement>(null),
    campus: useRef<HTMLElement>(null),
    oferta: useRef<HTMLElement>(null),
    estadisticas: useRef<HTMLElement>(null),
    reseñas: useRef<HTMLElement>(null),
    convocatorias: useRef<HTMLElement>(null),
  };

  const [activeSection, setActiveSection] = useState('resumen');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.5, rootMargin: '-10% 0px -70% 0px' }
    );

    Object.values(sections).forEach((ref) => {
      if (ref.current) observer.observe(ref.current);
    });

    return () => observer.disconnect();
  }, [loading]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const instId = Number(id);
        
        // Phase 1: Core Data
        const instData = await getInstitucionById(instId);
        setInstitucion(instData);

        // Phase 2: Secondary Data
        const results = await Promise.allSettled([
          getReviewsByInstitucion(instId),
          getGalleryByInstitucion(instId),
          getConvocatoriasByInstitucion(instId),
          getEscuelasByInstitucion(instId),
          getOfertasByInstitucion(instId),
          getInstitutionAgeStats(instId)
        ]);
        
        if (results[0].status === 'fulfilled') setReviews(results[0].value || []);
        if (results[1].status === 'fulfilled') setGallery(results[1].value || []);
        if (results[2].status === 'fulfilled') setConvocatorias(results[2].value || []);
        if (results[3].status === 'fulfilled') setEscuelas(results[3].value || []);
        if (results[4].status === 'fulfilled') {
          const offers = results[4].value || [];
          setOfertas(offers);
          if (offers.length > 0) {
            const levels = Array.from(new Set(offers.map(o => o.nivel_nombre)));
            setActiveLevel(levels[0]);
          }
        }
        if (results[5].status === 'fulfilled') setAgeStats(results[5].value || []);

      } catch (error) {
        console.error('Error fetching institution data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const scrollTo = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const levels = useMemo(() => {
    return Array.from(new Set(ofertas.map(o => o.nivel_nombre))).sort();
  }, [ofertas]);

  const filteredOfertas = useMemo(() => {
    return ofertas.filter(o => o.nivel_nombre === activeLevel);
  }, [ofertas, activeLevel]);

  const ofertasByField = useMemo(() => {
    const grouped: Record<string, Oferta[]> = {};
    filteredOfertas.forEach(o => {
      const field = o.campo_nombre || 'General';
      if (!grouped[field]) grouped[field] = [];
      grouped[field].push(o);
    });
    return grouped;
  }, [filteredOfertas]);

  const handleSubmitReview = async () => {
    if (!id || !newReview.comentario) return;
    try {
      await postReview({ 
        id_institucion: Number(id), 
        nombre_usuario: user?.name || 'Usuario EduMap',
        ...newReview 
      });
      const updatedReviews = await getReviewsByInstitucion(Number(id));
      setReviews(updatedReviews);
      setShowReviewModal(false);
      setNewReview({ calificacion: 5, comentario: '' });
    } catch (error) {
      console.error('Error posting review:', error);
    }
  };

  if (loading && !institucion) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-indigo-100 rounded-full" />
          <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
        </div>
        <p className="text-slate-900 font-black text-xl tracking-tight">Cargando identidad institucional...</p>
      </div>
    </div>
  );

  if (!institucion && !loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-8 text-center">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-2xl space-y-8"
      >
        <div className="w-32 h-32 bg-indigo-100 rounded-[48px] flex items-center justify-center mx-auto text-indigo-600">
          <Star size={64} />
        </div>
        <div className="space-y-4">
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Identidad no encontrada</h2>
          <p className="text-slate-500 font-bold text-lg leading-relaxed">
            Parece que la institución con ID "{id}" no existe en nuestro registro central.
            <br />Te sugerimos explorar los planteles verificados.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Link to="/instituciones" className="px-10 py-5 bg-indigo-600 text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-200">
            Ver Directorio
          </Link>
          <Link to="/" className="px-10 py-5 bg-white text-slate-900 border border-slate-200 rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">
            Ir al Inicio
          </Link>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <InstitutionHero 
        institucion={institucion} 
        isAdmin={isAdmin}
        onEdit={() => setShowEditModal(true)}
        onScrollTo={scrollTo}
      />
      
      <InstitutionNav 
        id={id!} 
        isAdmin={isAdmin} 
        activeSection={activeSection} 
        scrollTo={scrollTo} 
        counts={{
          campus: escuelas.length,
          oferta: ofertas.length,
          reseñas: reviews.length,
          convocatorias: convocatorias.length
        }}
      />

      <InstitutionSections 
        institucion={institucion}
        sections={sections}
        gallery={gallery}
        escuelas={escuelas}
        levels={levels}
        activeLevel={activeLevel}
        setActiveLevel={setActiveLevel}
        filteredOfertas={filteredOfertas}
        setSelectedOferta={setSelectedOferta}
        reviews={reviews}
        setShowReviewModal={setShowReviewModal}
        convocatorias={convocatorias}
        ofertasByField={ofertasByField}
        ageStats={ageStats}
        allOfertas={ofertas}
      />

      <AnimatePresence>
        {selectedOferta && (
          <OfferDetailModal 
            oferta={selectedOferta} 
            onClose={() => setSelectedOferta(null)} 
          />
        )}

        {showReviewModal && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
            {/* ... Review Modal Content ... */}
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-white w-full max-w-lg rounded-[64px] p-12 shadow-2xl relative overflow-hidden"
            >
              <div className="relative">
                <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Tu Opinión Cuenta</h2>
                <p className="text-slate-500 font-bold mb-12">Cuéntanos sobre tu vida académica.</p>
                
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calificación</label>
                    <div className="flex gap-3">
                      {[1, 2, 3, 4, 5].map(num => (
                        <button 
                          key={num}
                          onClick={() => setNewReview({...newReview, calificacion: num})}
                          className={`w-12 h-12 rounded-2xl transition-all flex items-center justify-center ${newReview.calificacion >= num ? 'bg-amber-100 text-amber-500' : 'bg-slate-50 text-slate-300'}`}
                        >
                          <Star size={24} fill={newReview.calificacion >= num ? 'currentColor' : 'none'} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comentario</label>
                    <textarea 
                      className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[32px] outline-none h-40 resize-none font-bold text-slate-700"
                      placeholder="Escribe aquí tu reseña..."
                      value={newReview.comentario}
                      onChange={e => setNewReview({...newReview, comentario: e.target.value})}
                    />
                  </div>

                  <div className="flex gap-4">
                    <button onClick={() => setShowReviewModal(false)} className="flex-1 py-4 text-slate-400 font-black text-xs uppercase tracking-widest bg-slate-50 rounded-2xl">Cancelar</button>
                    <button onClick={handleSubmitReview} className="flex-1 py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-3xl">Publicar</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showEditModal && institucion && (
          <InstitutionEditModal 
            institucion={institucion}
            onClose={() => setShowEditModal(false)}
            onSave={(updated) => setInstitucion(updated)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default InstitutionDetail;
