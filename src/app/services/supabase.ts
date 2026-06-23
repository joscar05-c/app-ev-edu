import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Mision, Pregunta, Estudiante, ResultadoCalificacionRPC } from '../models/mision.model';
import { MULTIMEDIA } from '../config/game.config';

interface SupabaseResponse<T> {
  data: T | null;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async loginConDni(dni: string): Promise<SupabaseResponse<Estudiante | null>> {
    try {
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

  async obtenerMisionesDisponibles(nivel: string, grado: number): Promise<SupabaseResponse<Mision[]>> {
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

  async obtenerTodasLasMisionesAdmin(): Promise<SupabaseResponse<Mision[]>> {
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

  async crearMisionConPreguntas(
    misionData: Partial<Mision>,
    preguntasData: any[]
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { data: mision, error: errorMision } = await this.supabase
        .from('misiones')
        .insert({
          titulo: misionData.titulo,
          descripcion: misionData.descripcion,
          nivel_educativo: misionData.nivel_educativo,
          grado: misionData.grado,
          xp_recompensa: misionData.xp_recompensa,
          max_intentos: misionData.max_intentos || 1,
          activo: true
        })
        .select()
        .single();

      if (errorMision) throw errorMision;

      const preguntasInsert = preguntasData.map((p, index) => ({
        mision_id: mision.id,
        orden: index + 1,
        tipo_pregunta: p.tipo,
        enunciado: p.enunciado,
        multimedia: p.multimedia || { tiene_multimedia: false },
        materia: p.materia || '',
        estructura: p.estructura
      }));

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

  async calificarMision(
    estudianteId: string,
    misionId: string,
    respuestas: Record<string, string>
  ): Promise<SupabaseResponse<ResultadoCalificacionRPC>> {
    try {
      const { data, error } = await this.supabase.rpc('calificar_mision', {
        p_estudiante_id: estudianteId,
        p_mision_id: misionId,
        p_respuestas: respuestas
      });

      if (error) throw error;

      if (!data) {
        return { data: null, error: 'No se pudo calificar la misión.' };
      }

      return { data, error: null };
    } catch (err: any) {
      console.error('Error al calificar misión:', err);
      return { data: null, error: 'Error al procesar la calificación.' };
    }
  }

  async obtenerMisionPorId(misionId: string): Promise<SupabaseResponse<Mision | null>> {
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

  async obtenerPreguntasDeMision(misionId: string): Promise<SupabaseResponse<Pregunta[]>> {
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

  async verificarIntentoPrevio(
    estudianteId: string,
    misionId: string
  ): Promise<SupabaseResponse<boolean>> {
    try {
      const { data, error } = await this.supabase
        .from('intentos_misiones')
        .select('id')
        .eq('estudiante_id', estudianteId)
        .eq('mision_id', misionId)
        .eq('completado', true)
        .limit(1);

      if (error) throw error;
      return { data: (data?.length ?? 0) > 0, error: null };
    } catch (err: any) {
      console.error('Error al verificar intento previo:', err);
      return { data: false, error: 'No se pudo verificar el historial.' };
    }
  }

  async subirImagen(
    file: File,
    carpeta: string
  ): Promise<{ url: string; path: string } | null> {
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${carpeta}/${fileName}`;

      const { error } = await this.supabase.storage
        .from(MULTIMEDIA.BUCKET_NAME)
        .upload(filePath, file);

      if (error) throw error;

      const { data: urlData } = this.supabase.storage
        .from(MULTIMEDIA.BUCKET_NAME)
        .getPublicUrl(filePath);

      return { url: urlData.publicUrl, path: filePath };
    } catch (err: any) {
      console.error('Error al subir imagen:', err);
      return null;
    }
  }

  async eliminarArchivo(path: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.storage
        .from(MULTIMEDIA.BUCKET_NAME)
        .remove([path]);

      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error('Error al eliminar archivo:', err);
      return false;
    }
  }

  getPublicUrl(path: string): string {
    const { data } = this.supabase.storage
      .from(MULTIMEDIA.BUCKET_NAME)
      .getPublicUrl(path);
    return data?.publicUrl ?? '';
  }

  async actualizarPerfil(
    estudianteId: string,
    datos: { avatar_url?: string; titulo_actual?: string }
  ): Promise<SupabaseResponse<Estudiante>> {
    try {
      const { data, error } = await this.supabase
        .from('estudiantes')
        .update(datos)
        .eq('id', estudianteId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      console.error('Error al actualizar perfil:', err);
      return { data: null, error: 'No se pudo actualizar el perfil.' };
    }
  }

  async subirAvatar(
    file: File,
    estudianteId: string
  ): Promise<SupabaseResponse<string>> {
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${estudianteId}.${ext}`;

      const { error } = await this.supabase.storage
        .from(MULTIMEDIA.AVATAR_BUCKET)
        .upload(filePath, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = this.supabase.storage
        .from(MULTIMEDIA.AVATAR_BUCKET)
        .getPublicUrl(filePath);

      return { data: urlData.publicUrl, error: null };
    } catch (err: any) {
      console.error('Error al subir avatar:', err);
      return { data: null, error: 'No se pudo subir la imagen.' };
    }
  }

  async actualizarMisionConPreguntas(
    misionId: string,
    misionData: Partial<Mision>,
    preguntasData: any[]
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error: errorMision } = await this.supabase
        .from('misiones')
        .update({
          titulo: misionData.titulo,
          descripcion: misionData.descripcion,
          nivel_educativo: misionData.nivel_educativo,
          grado: misionData.grado,
          xp_recompensa: misionData.xp_recompensa,
          max_intentos: misionData.max_intentos || 1
        })
        .eq('id', misionId);

      if (errorMision) throw errorMision;

      await this.supabase
        .from('preguntas')
        .delete()
        .eq('mision_id', misionId);

      const preguntasInsert = preguntasData.map((p, index) => ({
        mision_id: misionId,
        orden: index + 1,
        tipo_pregunta: p.tipo,
        enunciado: p.enunciado,
        multimedia: p.multimedia || { tiene_multimedia: false },
        materia: p.materia || '',
        estructura: p.estructura
      }));

      const { error: errorPreguntas } = await this.supabase
        .from('preguntas')
        .insert(preguntasInsert);

      if (errorPreguntas) throw errorPreguntas;

      return { success: true, error: null };
    } catch (err: any) {
      console.error('Error al actualizar misión:', err);
      return { success: false, error: err.message };
    }
  }

  async eliminarMision(misionId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      await this.supabase
        .from('preguntas')
        .delete()
        .eq('mision_id', misionId);

      const { error } = await this.supabase
        .from('misiones')
        .delete()
        .eq('id', misionId);

      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      console.error('Error al eliminar misión:', err);
      return { success: false, error: err.message };
    }
  }

  async cambiarEstadoMision(
    misionId: string,
    activo: boolean
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase
        .from('misiones')
        .update({ activo })
        .eq('id', misionId);

      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      console.error('Error al cambiar estado:', err);
      return { success: false, error: err.message };
    }
  }
}
