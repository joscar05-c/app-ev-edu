import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  /**
   * Intenta loguear a un estudiante usando su DNI llamando a una función segura (RPC).
   * Buena práctica: Oculta la lógica de tablas y JOINS detrás de la API de Supabase.
   */
  async loginConDni(dni: string): Promise<{ data: any, error: string | null }> {
    try {
      // Llamamos a la función remota (RPC) creada en Postgres
      const { data, error } = await this.supabase.rpc('login_estudiante', {
        p_dni: dni
      });

      if (error) throw error;

      if (!data) {
        return { data: null, error: 'Credencial no válida o estudiante no encontrado.' };
      }

      return { data, error: null };
    } catch (err: any) {
      console.error('Error en SupabaseService:', err);
      return { data: null, error: 'Problemas de conexión con el servidor.' };
    }
  }

  /**
   * Obtiene las misiones activas para un nivel y grado específico.
   */
  async obtenerMisionesDisponibles(nivel: string, grado: number): Promise<{ data: any[], error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('misiones')
        .select('*')
        .eq('activo', true)
        .eq('nivel_educativo', nivel)
        .eq('grado', grado)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (err: any) {
      console.error('Error al cargar misiones:', err);
      return { data: [], error: 'No se pudieron cargar las misiones.' };
    }
  }

  /**
   * ADMIN: Obtiene TODAS las misiones creadas (activas e inactivas)
   */
  async obtenerTodasLasMisionesAdmin(): Promise<{ data: any[], error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('misiones')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (err: any) {
      console.error('Error al cargar misiones en admin:', err);
      return { data: [], error: 'No se pudieron cargar las misiones.' };
    }
  }

  /**
   * ADMIN: Crea una nueva misión y guarda sus preguntas dinámicas (JSONB)
   */
  async crearMisionConPreguntas(misionData: any, preguntasData: any[]): Promise<{ success: boolean, error: string | null }> {
    try {
      // 1. Insertamos la misión
      const { data: mision, error: errorMision } = await this.supabase
        .from('misiones')
        .insert({
          titulo: misionData.titulo,
          descripcion: misionData.descripcion,
          nivel_educativo: misionData.nivel_educativo,
          grado: misionData.grado,
          xp_recompensa: misionData.xp_recompensa,
          activo: true // Por defecto activa al crearla
        })
        .select()
        .single();

      if (errorMision) throw errorMision;

      // 2. Preparamos las preguntas con el ID de la misión recién creada
      const preguntasInsert = preguntasData.map((p, index) => ({
        mision_id: mision.id,
        orden: index + 1,
        tipo_pregunta: p.tipo,
        enunciado: p.enunciado,
        multimedia: p.multimedia || {},
        estructura: p.estructura
      }));

      // 3. Insertamos las preguntas en bloque
      const { error: errorPreguntas } = await this.supabase
        .from('preguntas')
        .insert(preguntasInsert);

      if (errorPreguntas) throw errorPreguntas;

      return { success: true, error: null };
    } catch (err: any) {
      console.error('Error al crear misión:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * STUDENT: Guarda el intento de un estudiante en una misión con sus respuestas y calificación.
   */
  async guardarIntentoMision(intentoData: {
    estudiante_id: string;
    mision_id: string;
    respuestas: any;
    puntaje_total: number;
    xp_ganado: number;
  }): Promise<{ success: boolean, error: string | null }> {
    try {
      const { error } = await this.supabase
        .from('intentos_misiones')
        .insert({
          estudiante_id: intentoData.estudiante_id,
          mision_id: intentoData.mision_id,
          respuestas: intentoData.respuestas,
          puntaje_total: intentoData.puntaje_total,
          xp_ganado: intentoData.xp_ganado,
          completado: true,
          finalizado_en: new Date().toISOString()
        });

      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      console.error('Error al guardar intento:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Obtiene una misión por su ID.
   */
  async obtenerMisionPorId(misionId: string): Promise<{ data: any, error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('misiones')
        .select('*')
        .eq('id', misionId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      console.error('Error al cargar misión:', err);
      return { data: null, error: 'No se pudo cargar la misión.' };
    }
  }

  /**
   * Obtiene las preguntas reales de una misión ordenadas correctamente.
   */
  async obtenerPreguntasDeMision(misionId: string): Promise<{ data: any[], error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('preguntas')
        .select('*')
        .eq('mision_id', misionId)
        .order('orden', { ascending: true });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (err: any) {
      console.error('Error al cargar preguntas:', err);
      return { data: [], error: 'No se pudieron cargar las preguntas.' };
    }
  }
}
