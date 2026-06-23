import { Injectable, inject } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export interface EstadisticasDashboard {
  totalMisiones: number;
  misionesActivas: number;
  totalEstudiantes: number;
  totalIntentos: number;
  promedioGeneral: number;
  tasaAprobacion: number;
}

export interface RendimientoPorNivel {
  nivel_educativo: string;
  grado: number;
  total_intentos: number;
  completados: number;
  promedio_puntaje: number;
  xp_promedio: number;
}

export interface RankingIE {
  ie_nombre: string;
  ie_nivel: string;
  distrito: string;
  total_estudiantes: number;
  total_intentos: number;
  promedio_general: number;
  aprobados: number;
  desaprobados: number;
  tasa_aprobacion: number;
}

export interface PreguntaError {
  pregunta_id: string;
  enunciado: string;
  tipo_pregunta: string;
  mision_titulo: string;
  nivel_educativo: string;
  mision_grado: number;
  total_respuestas: number;
  total_errores: number;
  indice_error_pct: number;
}

@Injectable({ providedIn: 'root' })
export class EstadisticasService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async obtenerEstadisticasDashboard(): Promise<EstadisticasDashboard> {
    try {
      const [misiones, estudiantes, intentos] = await Promise.all([
        this.supabase.from('misiones').select('id, activo'),
        this.supabase.from('estudiantes').select('id', { count: 'exact', head: true }),
        this.supabase.from('intentos_misiones').select('puntaje_total, completado')
      ]);

      const todasMisiones = misiones.data || [];
      const totalIntentos = intentos.data?.length ?? 0;
      const intentosCompletados = intentos.data?.filter(i => i.completado) ?? [];
      const promedio = intentosCompletados.length > 0
        ? Math.round(intentosCompletados.reduce((sum, i) => sum + (i.puntaje_total || 0), 0) / intentosCompletados.length)
        : 0;
      const aprobados = intentosCompletados.filter(i => (i.puntaje_total || 0) >= 70).length;
      const tasaAprob = intentosCompletados.length > 0
        ? Math.round((aprobados / intentosCompletados.length) * 100)
        : 0;

      return {
        totalMisiones: todasMisiones.length,
        misionesActivas: todasMisiones.filter(m => m.activo).length,
        totalEstudiantes: estudiantes.count ?? 0,
        totalIntentos,
        promedioGeneral: promedio,
        tasaAprobacion: tasaAprob
      };
    } catch (err) {
      console.error('Error al obtener estadísticas:', err);
      return {
        totalMisiones: 0,
        misionesActivas: 0,
        totalEstudiantes: 0,
        totalIntentos: 0,
        promedioGeneral: 0,
        tasaAprobacion: 0
      };
    }
  }

  async obtenerRendimientoPorNivel(): Promise<RendimientoPorNivel[]> {
    try {
      const { data, error } = await this.supabase
        .from('vw_rendimiento_por_nivel')
        .select('*');

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error al obtener rendimiento por nivel:', err);
      return [];
    }
  }

  async obtenerRankingIE(): Promise<RankingIE[]> {
    try {
      const { data, error } = await this.supabase
        .from('vw_estadisticas_por_ie')
        .select('*')
        .order('promedio_general', { ascending: false });

      if (error) throw error;

      return (data || []).map(ie => ({
        ...ie,
        tasa_aprobacion: ie.total_intentos > 0
          ? Math.round((ie.aprobados / ie.total_intentos) * 100)
          : 0
      }));
    } catch (err) {
      console.error('Error al obtener ranking de IEs:', err);
      return [];
    }
  }

  async obtenerPreguntasConMayorError(limite: number = 10): Promise<PreguntaError[]> {
    try {
      const { data, error } = await this.supabase
        .from('vw_indice_error_preguntas')
        .select('*')
        .order('indice_error_pct', { ascending: false })
        .limit(limite);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error al obtener preguntas con error:', err);
      return [];
    }
  }
}
