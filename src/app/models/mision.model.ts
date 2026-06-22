export type TipoPregunta = 'opcion_multiple' | 'verdadero_falso';
export type TipoMultimedia = 'imagen' | 'video';

export interface OpcionPregunta {
  id: string;
  texto: string;
  es_correcta: boolean;
}

export interface MultimData {
  tiene_multimedia: boolean;
  tipo?: TipoMultimedia;
  url?: string;
  storage_path?: string;
}

export interface EstructuraPregunta {
  tipo: TipoPregunta;
  opciones: OpcionPregunta[];
  feedback_error: string;
}

export interface Pregunta {
  id: string;
  mision_id: string;
  orden: number;
  tipo_pregunta: TipoPregunta;
  enunciado: string;
  multimedia: MultimData;
  estructura: EstructuraPregunta;
}

export interface Mision {
  id: string;
  titulo: string;
  descripcion: string;
  nivel_educativo: 'Primaria' | 'Secundaria';
  grado: number;
  xp_recompensa: number;
  activo: boolean;
  created_at: string;
}

export interface InstitucionEducativa {
  nombre: string;
  nivel: string;
}

export interface Estudiante {
  id: string;
  nombre_completo: string;
  dni: string;
  grado: number;
  seccion: string;
  xp: number;
  rango_nivel: number;
  rol: 'estudiante' | 'admin';
  instituciones_educativas: InstitucionEducativa;
  ie_nombre?: string;
  ie_nivel?: string;
}

export interface IntentoMision {
  estudiante_id: string;
  mision_id: string;
  respuestas: Record<string, string>;
  puntaje_total: number;
  xp_ganado: number;
}

export interface ResultadoCalificacion {
  correctas: number;
  total: number;
  porcentaje: number;
  xpGanado: number;
}
