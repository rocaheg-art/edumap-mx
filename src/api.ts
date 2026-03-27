
import { 
  Oferta, 
  Institucion, 
  Review,
  User,
  UserRole,
  Convocatoria,
  Municipio,
  Nivel,
  CampoFormacion,
  Modalidad,
  Carrera,
  Escuela,
  DetalleOferta,
  GaleriaImagen,
  InfoCarrera,
  EstadisticasInclusion,
  EstadisticasEdad
} from './types';

const API_URL = '/api'; 

export interface ObservatorioKPIs {
  matricula_total: number;
  nuevo_ingreso: number;
  egresados: number;
  titulados: number;
  total_ofertas: number;
  total_instituciones: number;
  solicitudes: number;
  aspirantes_por_lugar: number;
  pct_mujeres: number;
  edad_media: number | null;
  eficiencia_global: number;
}

// Mock Data for fallback with VALID coordinates for map
export const MOCK_INSTITUCIONES: Institucion[] = [
  { 
    id_institucion: 1, 
    nombre: 'Universidad Autónoma de Querétaro', siglas: 'UAQ',
    latitud: 20.5922, longitud: -100.4124, 
    color_hex: 'bg-blue-600',
    descripcion: 'Máxima casa de estudios de Querétaro.',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Logo_UAQ.svg/1200px-Logo_UAQ.svg.png'
  },
  { 
    id_institucion: 2, 
    nombre: 'Tecnológico de Monterrey', siglas: 'ITESM',
    latitud: 20.6136, longitud: -100.4047, 
    color_hex: 'bg-red-600',
    descripcion: 'Innovación y emprendimiento.',
    logo_url: 'https://brandcenter.tec.mx/sites/default/files/Logotipo_Borregos_0.png'
  }
];

async function apiCall<T>(endpoint: string, method: string = 'GET', body?: unknown): Promise<T | null> {
    try {
        const options: RequestInit = { method, headers: { 'Content-Type': 'application/json' } };
        if (body) options.body = JSON.stringify(body);
        const response = await fetch(`${API_URL}${endpoint}`, options);
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `API Error: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.warn(`[API] Error en ${endpoint}`, error);
        return null;
    }
}

const fixInstData = (i: Institucion): Institucion => ({
    ...i,
    id_institucion: Number(i.id_institucion),
    logo: i.siglas || 'U',
    color: i.color_hex || 'bg-slate-600',
    www: i.sitio_web,
    bannerUrl: i.banner_url || i.bannerUrl,
    logoUrl: i.logo_url || i.logoUrl,
    total_campus: Number(i.total_campus || 0),
    total_carreras: Number(i.total_carreras || i.total_ofertas || 0),
    matricula_total: Number(i.matricula_total || 0),
    nuevo_ingreso_total: Number(i.nuevo_ingreso_total || 0),
    egresados_total: Number(i.egresados_total || 0),
    titulados_total: Number(i.titulados_total || 0),
    matricula_mujeres: Number(i.matricula_mujeres || 0),
    ici_promedio: Number(i.ici_promedio || 0),
    eficiencia_promedio: Number(i.eficiencia_promedio || 0),
    promedio_calificacion: Number(i.promedio_calificacion || 0),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fixOfertaData = (o: any): Oferta => ({
    ...o,
    id_oferta: Number(o.id_oferta),
    id_escuela: Number(o.id_escuela),
    id_institucion: Number(o.id_institucion),
    id_carrera: Number(o.id_carrera),
    id_nivel: Number(o.id_nivel),
    id_modalidad: Number(o.id_modalidad),
    matricula_total: Number(o.matricula_total || 0),
    nuevo_ingreso_total: Number(o.nuevo_ingreso_total || 0),
    egresados_total: Number(o.egresados_total || 0),
    titulados_total: Number(o.titulados_total || 0),
    lugares_ofertados: Number(o.lugares_ofertados || 0),
    solicitudes_total: Number(o.solicitudes_total || 0),
    ici: Number(o.ici || 0),
    competitividad: Number(o.competitividad || 0),
    eficiencia_terminal: Number(o.eficiencia_terminal || 0),
    tasa_egreso: Number(o.tasa_egreso || 0),
    escuela: o.escuela ? { 
        ...o.escuela, 
        id_escuela: Number(o.escuela.id_escuela),
        latitud: parseFloat(String(o.escuela.latitud || 0)),
        longitud: parseFloat(String(o.escuela.longitud || 0))
    } : undefined,
    institucion: o.institucion ? {
        ...o.institucion,
        id_institucion: Number(o.institucion.id_institucion),
        logoUrl: o.institucion.logo_url || o.institucion.logoUrl
    } : undefined
});

// --- FILTROS ---
export const getSubsistemas = () => apiCall<{ nombre: string }[]>('/subsistemas').then(list => (list || []).map(s => s.nombre));

// --- INSTITUCIONES ---
export const getInstituciones = (filters: { 
    q?: string, 
    estado?: number, 
    municipio?: number, 
    sostenimiento?: number, 
    subsistema?: string,
    min_matricula?: number,
    min_carreras?: number,
    min_campus?: number,
    min_ici?: number,
    min_eficiencia?: number,
    min_mujeres?: number,
    competitividad?: string,
    page?: number,
    limit?: number
} = {}) => {
    const params = new URLSearchParams();
    if (filters.q) params.append('q', filters.q);
    if (filters.estado) params.append('estado', filters.estado.toString());
    if (filters.municipio) params.append('municipio', filters.municipio.toString());
    if (filters.sostenimiento) params.append('sostenimiento', filters.sostenimiento.toString());
    if (filters.subsistema) params.append('subsistema', filters.subsistema);
    if (filters.min_matricula) params.append('min_matricula', filters.min_matricula.toString());
    if (filters.min_carreras) params.append('min_carreras', filters.min_carreras.toString());
    if (filters.min_campus) params.append('min_campus', filters.min_campus.toString());
    if (filters.min_ici) params.append('min_ici', filters.min_ici.toString());
    if (filters.min_eficiencia) params.append('min_eficiencia', filters.min_eficiencia.toString());
    if (filters.min_mujeres) params.append('min_mujeres', filters.min_mujeres.toString());
    if (filters.competitividad) params.append('competitividad', filters.competitividad);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    return apiCall<any>(`/instituciones?${params.toString()}`).then(res => {
        if (res && res.data) {
            return {
                ...res,
                data: Array.isArray(res.data) ? res.data.map(fixInstData) : []
            };
        }
        return Array.isArray(res) ? res.map(fixInstData) : [];
    });
};
export const getInstitucionById = async (id: number) => {
    const res = await apiCall<Institucion>(`/instituciones/${id}`);
    return res && !Array.isArray(res) ? fixInstData(res) : undefined;
};
export const searchInstitucionesSuggest = (q: string) => {
    return apiCall<Institucion[]>(`/instituciones?q=${encodeURIComponent(q)}&limit=5`).then(res => {
        const data = (res as any)?.data || res;
        return Array.isArray(data) ? data.map(fixInstData) : [];
    });
};
export const getInstitutionAgeStats = async (id: number): Promise<EstadisticasEdad[]> => {
    const res = await apiCall<EstadisticasEdad[]>(`/instituciones/${id}/edad`);
    return (res || []).map(s => ({
        ...s,
        matricula_mujeres: Number(s.matricula_mujeres || 0),
        matricula_hombres: Number(s.matricula_hombres || 0)
    }));
};
export const getCareerAgeStats = async (id_carrera: number): Promise<EstadisticasEdad[]> => {
    const res = await apiCall<EstadisticasEdad[]>(`/distribucion-edad/${id_carrera}`);
    return (res || []).map(s => ({
        ...s,
        matricula_mujeres: Number(s.matricula_mujeres || 0),
        matricula_hombres: Number(s.matricula_hombres || 0)
    }));
};
export const updateInstitucion = async (id: number, data: Partial<Institucion>) => {
    const payload = {
        nombre: data.nombre,
        descripcion: data.descripcion,
        telefono: data.telefono,
        sitio_web: data.sitio_web || data.www,
        banner_url: data.banner_url || data.bannerUrl,
        logo_url: data.logo_url || data.logoUrl,
        siglas: data.siglas,
        id_sostenimiento: data.id_sostenimiento,
        id_subsistema: data.id_subsistema
    };
    const res = await apiCall<Institucion>(`/instituciones/${id}`, 'PUT', payload);
    return res ? fixInstData(res) : undefined;
};

// --- OFERTAS ---
export const getOfertas = () => apiCall<Oferta[]>('/ofertas').then(list => 
    Array.isArray(list) ? list.map(fixOfertaData) : []
);

export const searchOfertas = (filters: { 
    q?: string, 
    nivel?: number | string, 
    modalidad?: number,
    estado?: number,
    municipio?: number,
    sostenimiento?: number,
    min_ici?: number,
    max_ici?: number,
    min_eficiencia?: number,
    min_tasa_egreso?: number,
    min_mujeres?: number,
    min_inclusion?: number,
    id_campo_detallado?: number,
    min_solicitudes?: number,
    min_lugares?: number,
    min_matricula?: number,
    page?: number,
    limit?: number,
    sort?: string
} = {}) => {
    const params = new URLSearchParams();
    if (filters.q) params.append('q', filters.q);
    if (filters.nivel) params.append('nivel', Array.isArray(filters.nivel) ? filters.nivel.join(',') : filters.nivel.toString());
    if (filters.modalidad) params.append('modalidad', filters.modalidad.toString());
    if (filters.estado) params.append('estado', filters.estado.toString());
    if (filters.municipio) params.append('municipio', filters.municipio.toString());
    if (filters.sostenimiento) params.append('sostenimiento', filters.sostenimiento.toString());
    if (filters.min_ici) params.append('min_ici', filters.min_ici.toString());
    if (filters.max_ici) params.append('max_ici', filters.max_ici.toString());
    if (filters.min_eficiencia) params.append('min_eficiencia', filters.min_eficiencia.toString());
    if (filters.min_tasa_egreso) params.append('min_tasa_egreso', filters.min_tasa_egreso.toString());
    if (filters.min_mujeres) params.append('min_mujeres', filters.min_mujeres.toString());
    if (filters.min_inclusion) params.append('min_inclusion', filters.min_inclusion.toString());
    if (filters.id_campo_detallado) params.append('id_campo_detallado', filters.id_campo_detallado.toString());
    if (filters.min_solicitudes) params.append('min_solicitudes', filters.min_solicitudes.toString());
    if (filters.min_lugares) params.append('min_lugares', filters.min_lugares.toString());
    if (filters.min_matricula) params.append('min_matricula', filters.min_matricula.toString());
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sort) params.append('sort', filters.sort);

    return apiCall<any>(`/ofertas/search?${params.toString()}`).then(res => {
        if (res && res.data) {
            return {
                ...res,
                data: Array.isArray(res.data) ? res.data.map(fixOfertaData) : []
            };
        }
        return Array.isArray(res) ? res.map(fixOfertaData) : [];
    });
};

export const getOfertasByInstitucion = (id: number) => 
    apiCall<Oferta[]>(`/ofertas?institucion=${id}`).then(list => 
        Array.isArray(list) ? list.map(fixOfertaData) : []
    );
export const addOferta = (data: Partial<Oferta>) => apiCall('/ofertas', 'POST', data);
export const deleteOferta = (id: number) => apiCall(`/ofertas/${id}`, 'DELETE');

// --- DETALLES OFERTA ---
export const getOfertaDetails = async (id: number): Promise<{ detalles: DetalleOferta | null, estadisticas: EstadisticasInclusion | null, estadisticasEdad: EstadisticasEdad[] }> => {
    const data = await apiCall<{ detalles: DetalleOferta | null, estadisticas: EstadisticasInclusion | null, estadisticasEdad: EstadisticasEdad[] }>(`/ofertas/${id}/detalles`);
    if (!data) return { detalles: null, estadisticas: null, estadisticasEdad: [] };
    
    const detalles: DetalleOferta | null = data.detalles ? {
        id_oferta: data.detalles.id_oferta,
        mapa_curricular_url: data.detalles.mapa_curricular_url,
        perfil_ingreso: data.detalles.perfil_ingreso,
        perfil_egreso: data.detalles.perfil_egreso,
        campo_laboral: data.detalles.campo_laboral,
        habilidades: data.detalles.habilidades,
        requisitos_inscripcion: data.detalles.requisitos_inscripcion,
        costos_estimados: data.detalles.costos_estimados,
        becas_disponibles: data.detalles.becas_disponibles
    } : null;

    const estadisticas: EstadisticasInclusion | null = data.estadisticas ? {
        ...data.estadisticas,
        id_oferta: Number(data.estadisticas.id_oferta),
        anio_ciclo: Number(data.estadisticas.anio_ciclo || 0),
        matricula_li_m: Number(data.estadisticas.matricula_li_m || 0),
        matricula_li_h: Number(data.estadisticas.matricula_li_h || 0),
        ni_li_total: Number(data.estadisticas.ni_li_total || 0),
        egresados_li: Number(data.estadisticas.egresados_li || 0),
        titulados_li: Number(data.estadisticas.titulados_li || 0),
        matricula_disc_m: Number(data.estadisticas.matricula_disc_m || 0),
        matricula_disc_h: Number(data.estadisticas.matricula_disc_h || 0),
        ni_disc_total: Number(data.estadisticas.ni_disc_total || 0),
        egresados_disc: Number(data.estadisticas.egresados_disc || 0),
        titulados_disc: Number(data.estadisticas.titulados_disc || 0),
        solicitudes_m: Number(data.estadisticas.solicitudes_m || 0),
        solicitudes_h: Number(data.estadisticas.solicitudes_h || 0),
        solicitudes_total: Number(data.estadisticas.solicitudes_total || 0),
        becas_total: Number(data.estadisticas.becas_total || 0)
    } : null;

    const estadisticasEdad: EstadisticasEdad[] = (data.estadisticasEdad || []).map(s => ({
        ...s,
        id_estadistica: Number(s.id_estadistica),
        id_oferta: Number(s.id_oferta),
        anio_ciclo: Number(s.anio_ciclo),
        matricula_mujeres: Number(s.matricula_mujeres || 0),
        matricula_hombres: Number(s.matricula_hombres || 0)
    }));

    return {
        detalles,
        estadisticas,
        estadisticasEdad
    };
};

export const updateOfertaDetails = (id: number, data: Partial<DetalleOferta>) => {
    return apiCall(`/ofertas/${id}/detalles`, 'PUT', data);
};

// --- INFO CARRERAS ---
export const getInfoCarreras = () => apiCall<InfoCarrera[]>('/info-carreras').then(list => 
    (list || []).map(i => ({
        ...i,
        imagenUrl: i.imagen_url || i.imagenUrl,
        tituloMarketing: i.titulo_marketing || i.tituloMarketing,
        descripcionBreve: i.descripcion_breve || i.descripcionBreve,
        palabraClave: i.palabra_clave || i.palabraClave
    }))
);

// --- REVIEWS & CONVOCATORIAS ---
export const getReviewsByInstitucion = (id: number) => apiCall<Review[]>(`/reviews?institucion=${id}`).then(list => list || []);
export const postReview = (review: Partial<Review>) => apiCall<Review>('/reviews', 'POST', review);

export const getConvocatoriasByInstitucion = (id: number) => 
    apiCall<Convocatoria[]>(`/convocatorias?institucion=${id}`).then(items => 
        (items || []).map(i => ({ ...i, imagenUrl: i.imagenUrl || i.imagen_url }))
    );

export const postConvocatoria = (data: Partial<Convocatoria>) => apiCall<Convocatoria>('/convocatorias', 'POST', data);
export const sendInterest = (userId: number, instId: number) => apiCall('/intereses', 'POST', { userId, instId });

// --- GALERIA ---
export const getGalleryByInstitucion = (id: number) => apiCall<GaleriaImagen[]>(`/galeria?institucion=${id}`).then(list => (list || []).map(i => ({
    id_imagen: i.id_imagen,
    id_institucion: i.id_institucion,
    imagenUrl: i.imagenUrl || i.imagen_url,
    descripcion: i.descripcion
})));

export const addGalleryImage = (data: Partial<GaleriaImagen>) => apiCall('/galeria', 'POST', data);

export const deleteGalleryImage = (id: number) => apiCall(`/galeria/${id}`, 'DELETE');

// --- AUTH ---
export const loginUser = (role: UserRole, identifier: string, password?: string) => 
    apiCall<User>('/login', 'POST', { role, identifier, password });

export const registerUser = (data: Partial<User>) => apiCall<User>('/register', 'POST', data);
export const updateStudent = (id: number, data: Partial<User>) => apiCall<User>(`/students/${id}`, 'PUT', data);

// --- UTILS & CATALOGS ---
export const importSQL = (sql: string) => apiCall<{message: string}>('/import', 'POST', { sql });
export const clearDatabase = () => apiCall('/admin/clear', 'POST'); 

export const getFilters = async () => {
    const [municipios, estados, niveles, campos, modalidades, sostenimientos, subsistemas] = await Promise.all([
        apiCall<Municipio[]>('/municipios').then(l => l || []),
        apiCall<{id_entidad: number, nombre: string}[]>('/estados').then(l => l || []),
        apiCall<Nivel[]>('/niveles').then(l => l || []),
        apiCall<CampoFormacion[]>('/campos').then(l => l || []),
        apiCall<Modalidad[]>('/modalidades').then(l => l || []),
        apiCall<{id_sostenimiento: number, nombre: string}[]>('/sostenimientos').then(l => l || []),
        apiCall<{id_subsistema: number, nombre: string}[]>('/subsistemas').then(l => l || [])
    ]);

    return {
        municipios,
        estados,
        niveles,
        campos,
        modalidades,
        sostenimientos,
        subsistemas
    };
};

export const getCarreras = () => apiCall<Carrera[]>('/carreras').then(l => l || []);
export const searchCarreras = (q: string) => apiCall<Carrera[]>(`/carreras/search?q=${encodeURIComponent(q)}`).then(l => l || []);
export const createCarrera = (data: Partial<Carrera>) => apiCall<Carrera>('/carreras', 'POST', data);

// MAP-READY SCHOOLS
export const getEscuelasByInstitucion = (id: number) => apiCall<Escuela[]>(`/escuelas?institucion=${id}`).then(list => (list || []).map(e => ({
    ...e,
    id_escuela: Number(e.id_escuela),
    latitud: parseFloat(String(e.latitud)) || 0,
    longitud: parseFloat(String(e.longitud)) || 0,
    promedio_calificacion: Number(e.promedio_calificacion) || 0
})));

export const getEscuelasMap = (filters: { q?: string, carrera?: number, estado?: number, municipio?: number, nivel?: number, sostenimiento?: number } = {}) => {
    const params = new URLSearchParams();
    if (filters.q) params.append('q', filters.q);
    if (filters.carrera) params.append('carrera', filters.carrera.toString());
    if (filters.estado) params.append('estado', filters.estado.toString());
    if (filters.municipio) params.append('municipio', filters.municipio.toString());
    if (filters.nivel) params.append('nivel', filters.nivel.toString());
    if (filters.sostenimiento) params.append('sostenimiento', filters.sostenimiento.toString());

    return apiCall<Escuela[]>(`/escuelas?${params.toString()}`).then(list => (list || []).map(e => ({
        ...e,
        id_escuela: Number(e.id_escuela),
        id_institucion: Number(e.id_institucion),
        latitud: parseFloat(String(e.latitud)) || 0,
        longitud: parseFloat(String(e.longitud)) || 0,
        logoUrl: e.logo_url,
        color: e.color_hex,
        bannerUrl: e.banner_url,
        municipio_nombre: e.municipio_nombre,
        promedio_calificacion: Number(e.promedio_calificacion) || 0
    })));
};

export const addEscuela = (data: Partial<Escuela>) => apiCall('/escuelas', 'POST', data);

export const getEscuelas = () => apiCall<Escuela[]>('/escuelas').then(list => (list || []).map(e => ({
    ...e,
    id_escuela: Number(e.id_escuela),
    latitud: parseFloat(String(e.latitud)) || 0,
    longitud: parseFloat(String(e.longitud)) || 0,
    promedio_calificacion: Number(e.promedio_calificacion) || 0
})));

export const getObservatorioKPIs = () => apiCall<ObservatorioKPIs>('/observatorio/kpis');

export const getStatsResumen = () => apiCall<{ estudiantes: string, instituciones: string, programas: string, ipd_nacional: string }>('/stats/resumen');

export const getTopCarrerasIPD = (limit = 5) => apiCall<{ carrera: string, institucion: string, ipd: string }[]>(`/carreras/top-ipd?limit=${limit}`);

export interface MapInstitution {
  id: number;
  nombre: string;
  siglas: string;
  sector: string;
  lat: number;
  lng: number;
  ciudad: string;
  matricula: number;
  num_programas: number;
  ipd: number;
  pct_mujeres: number;
}

export const getInstitucionesMapa = (filters: { sector?: string, campo?: string } = {}) => {
  const params = new URLSearchParams();
  if (filters.sector) params.append('sector', filters.sector);
  if (filters.campo) params.append('campo', filters.campo);
  return apiCall<MapInstitution[]>(`/instituciones/mapa?${params.toString()}`);
};
