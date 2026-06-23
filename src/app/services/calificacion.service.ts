import { Injectable } from '@angular/core';
import { Pregunta, ResultadoCalificacion } from '../models/mision.model';
import { CALIFICACION } from '../config/game.config';

@Injectable({
  providedIn: 'root'
})
export class CalificacionService {

  calificar(preguntas: Pregunta[], respuestas: Record<string, string>): ResultadoCalificacion {
    let correctas = 0;
    let puntajeObtenido = 0;
    let puntajeTotal = 0;

    for (const pregunta of preguntas) {
      const puntajePregunta = pregunta.puntaje || 1;
      puntajeTotal += puntajePregunta;

      const respuestaEstudiante = respuestas[pregunta.id];
      if (!respuestaEstudiante) continue;

      const opcionesCorrectas = pregunta.estructura.opciones
        .filter(op => op.es_correcta);

      if (opcionesCorrectas.some(op => op.id === respuestaEstudiante)) {
        correctas++;
        puntajeObtenido += puntajePregunta;
      }
    }

    const total = preguntas.length;
    const porcentaje = puntajeTotal > 0 ? Math.round((puntajeObtenido / puntajeTotal) * 100) : 0;

    return {
      correctas,
      total,
      porcentaje,
      xpGanado: 0
    };
  }

  calcularXp(porcentaje: number, xpRecompensa: number): number {
    return Math.round((porcentaje / 100) * xpRecompensa);
  }

  obtenerCalificacionTexto(porcentaje: number): string {
    if (porcentaje >= CALIFICACION.UMBRAL_EXCELENTE) return '¡Excelente!';
    if (porcentaje >= CALIFICACION.UMBRAL_BUENO) return '¡Buen trabajo!';
    if (porcentaje >= CALIFICACION.UMBRAL_APROBADO) return 'Aprobado';
    return 'Necesita mejorar';
  }

  obtenerCalificacionColor(porcentaje: number): string {
    if (porcentaje >= CALIFICACION.UMBRAL_EXCELENTE) return '#10b981';
    if (porcentaje >= CALIFICACION.UMBRAL_BUENO) return '#3b82f6';
    if (porcentaje >= CALIFICACION.UMBRAL_APROBADO) return '#f59e0b';
    return '#ef4444';
  }

  esAprobado(porcentaje: number): boolean {
    return porcentaje >= CALIFICACION.UMBRAL_APROBADO;
  }
}
