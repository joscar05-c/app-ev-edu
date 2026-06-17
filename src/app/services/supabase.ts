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
}
