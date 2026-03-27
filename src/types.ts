export type UserRole = 'student' | 'institution' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  telefono?: string;
}

export interface Institucion {
  id_institucion: number;
  nombre: string;
  siglas?: string;
  id_sostenimiento?: number;
  id_subsistema?: number;
  id_municipio?: number;
  sitio_web?: string;
  telefono?: string;
  correo?: string;
  logo_url?: string;
  banner_url?: string;
  descripcion?: string;
  color_hex?: string;
  // Summary fields
  total_campus?: number;
  total_carreras?: number;
  total_ofertas?: number;
  matricula_total?: number;
  nuevo_ingreso_total?: number;
  egresados_total?: number;
  titulados_total?: number;
  matricula_mujeres?: number;
  ici_promedio?: number;
  eficiencia_promedio?: number;
  // UI helpers
  tipo?: string;
  sostenimiento?: string;
  subsistema?: string;
  promedio_calificacion?: number;
  total_reviews?: number;
  // Legacy mappings
  logo?: string;
  color?: string;
  www?: string;
  bannerUrl?: string;
  logoUrl?: string;
  latitud?: number;
  longitud?: number;
}

export interface Escuela {
  id_escuela: number;
  id_institucion: number;
  id_municipio?: number;
  nombre: string;
  nombre_anuies?: string;
  direccion?: string;
  latitud: number;
  longitud: number;
  logo_url?: string;
  banner_url?: string;
  // UI helpers
  institucion_nombre?: string;
  municipio_nombre?: string;
  sostenimiento?: string;
  color_hex?: string;
  promedio_calificacion?: number;
}

export interface Carrera {
  id_carrera: number;
  nombre: string;
  nombre_normalizado?: string;
  id_campo_detallado?: number;
  // Marketing info from search
  titulo_marketing?: string;
  descripcion_breve?: string;
  imagen_url?: string;
}

export interface Oferta {
  id_oferta: number;
  id_escuela: number;
  id_institucion: number;
  id_carrera: number;
  id_nivel: number;
  id_modalidad?: number;
  anio_ciclo?: number;
  duracion?: string;
  matricula_total?: number;
  nuevo_ingreso_total?: number;
  egresados_total?: number;
  titulados_total?: number;
  lugares_ofertados?: number;
  // Summary fields
  ici?: number;
  competitividad?: number;
  eficiencia_terminal?: number;
  tasa_egreso?: number;
  solicitudes_total?: number;
  // UI helpers
  carrera_nombre?: string;
  nivel_nombre?: string;
  modalidad_nombre?: string;
  escuela_nombre?: string;
  inst_nombre?: string;
  siglas?: string;
  campo_nombre?: string;
  sostenimiento?: string;
  latitud?: number;
  longitud?: number;
  // Marketing info from search
  titulo_marketing?: string;
  descripcion_breve?: string;
  imagen_url?: string;
  // UI helpers
  institucion?: {
    id_institucion: number;
    nombre: string;
    siglas?: string;
    logoUrl?: string;
    color?: string;
  };
  escuela?: {
    id_escuela: number;
    nombre: string;
    latitud: number;
    longitud: number;
    logo_url?: string;
    municipio_nombre?: string;
    promedio_calificacion?: number;
  };
}

export interface DetalleOferta {
  id_oferta: number;
  mapa_curricular_url?: string;
  perfil_ingreso?: string;
  perfil_egreso?: string;
  campo_laboral?: string;
  habilidades?: string;
  // Extended fields from previous request
  requisitos_inscripcion?: string;
  costos_estimados?: string;
  becas_disponibles?: string;
}

export interface EstadisticasInclusion {
  id_oferta: number;
  anio_ciclo?: number;
  // Lenguas indígenas
  matricula_li_m?: number;
  matricula_li_h?: number;
  ni_li_total?: number;
  egresados_li?: number;
  titulados_li?: number;
  // Discapacidad
  matricula_disc_m?: number;
  matricula_disc_h?: number;
  ni_disc_total?: number;
  egresados_disc?: number;
  titulados_disc?: number;
  // Solicitudes
  solicitudes_m?: number;
  solicitudes_h?: number;
  solicitudes_total?: number;
  // Legacy/Simplified fields
  alumnos_discapacidad?: number;
  alumnos_lengua_indigena?: number;
  becas_total?: number;
}

export interface EstadisticasEdad {
  id_estadistica: number;
  id_oferta: number;
  anio_ciclo: number;
  rango_edad: string;
  matricula_mujeres: number;
  matricula_hombres: number;
  nuevo_ingreso_m: number;
  nuevo_ingreso_h: number;
}

export interface Review {
  id_review: number;
  id_institucion: number;
  nombre_usuario: string;
  calificacion: number;
  comentario: string;
  fecha: string;
}

export interface Convocatoria {
  id_convocatoria: number;
  id_institucion: number;
  titulo: string;
  contenido: string;
  imagen_url?: string;
  fecha: string;
  // UI helper
  imagenUrl?: string;
}

export interface GaleriaImagen {
  id_imagen: number;
  id_institucion: number;
  imagen_url: string;
  descripcion?: string;
  orden?: number;
  // UI helper
  imagenUrl?: string;
}

export interface Municipio {
  id_municipio: number;
  id_entidad: number;
  nombre: string;
}

export interface Nivel {
  id_nivel: number;
  nombre: string;
}

export interface Modalidad {
  id_modalidad: number;
  nombre: string;
}

export interface CampoFormacion {
  id_campo_detallado: number;
  nombre: string;
}

export interface InfoCarrera {
  id_info: number;
  tituloMarketing: string;
  descripcionBreve: string;
  imagenUrl: string;
  palabraClave: string;
  // API helpers
  imagen_url?: string;
  titulo_marketing?: string;
  descripcion_breve?: string;
  palabra_clave?: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
}
