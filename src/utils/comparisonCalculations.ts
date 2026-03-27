export interface ComparisonData {
  id: number;
  nombre_programa: string;
  nombre_institucion: string;
  sector: 'pub' | 'priv';
  campo_amplio: string;
  entidad: string;
  ipd: number;
  solicitudes: number;
  nuevo_ingreso: number;
  matricula_total: number;
  egresados: number;
  titulados: number;
  pct_mujeres: number;
}

export interface ComparisonScores {
  acceso: number;
  eficiencia: number;
  titulacion: number;
  genero: number;
  escala: number;
  global: number;
}

export const calculateScores = (data: ComparisonData): ComparisonScores => {
  const acceso = Math.round(Math.min(100, (100 / (data.ipd || 1)) * 10));
  const eficiencia = Math.min(100, Math.round((data.egresados / (data.nuevo_ingreso || 1)) * 100));
  const titulacion = Math.min(100, Math.round((data.titulados / (data.matricula_total || 1)) * 100 * 4));
  const genero = Math.round(100 - Math.abs(data.pct_mujeres - 50) * 2);
  const escala = Math.min(100, Math.round(data.matricula_total / 20));

  const global = Math.round((acceso + eficiencia + titulacion + genero + escala) / 5);

  return { acceso, eficiencia, titulacion, genero, escala, global };
};
