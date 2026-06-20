import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../../services/supabase';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-mission-play',
  templateUrl: './mission-play.page.html',
  styleUrls: ['./mission-play.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class MissionPlayPage implements OnInit {

  private route = inject(ActivatedRoute);
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);

  // Datos de la misión y estudiante
  misionId = '';
  estudiante = signal<any>(null);
  xpRecompensa = signal<number>(0);

  // Estado de la partida
  cargando = signal<boolean>(true);
  preguntas = signal<any[]>([]);
  indiceActual = signal<number>(0);
  misionCompletada = signal<boolean>(false);
  guardando = signal<boolean>(false);
  mensajeError = signal<string | null>(null);

  // Resultados
  respuestasCorrectas = signal<number>(0);
  totalPreguntas = signal<number>(0);
  puntajeObtenido = signal<number>(0);
  xpGanado = signal<number>(0);

  // Almacenamiento temporal: Guarda { "pregunta_id": "opcion_id" }
  respuestasTemp = signal<{ [key: string]: string }>({});

  ngOnInit() {
    // Capturamos el ID de la misión desde la URL
    const misionId = this.route.snapshot.paramMap.get('id');
    // Leemos el estudiante desde AuthService (persistido en localStorage)
    this.estudiante.set(this.authService.obtenerSesion());

    if (misionId) {
      this.misionId = misionId;
      this.cargarMision(misionId);
    } else {
      this.mensajeError.set('ID de misión no válido.');
      this.cargando.set(false);
    }
  }

  async cargarMision(misionId: string) {
    const { data, error } = await this.supabaseService.obtenerMisionPorId(misionId);

    if (error || !data) {
      this.mensajeError.set(error || 'Misión no encontrada.');
      this.cargando.set(false);
      return;
    }

    this.xpRecompensa.set(data.xp_recompensa || 100);
    await this.cargarPreguntasReales(misionId);
  }

  async cargarPreguntasReales(misionId: string) {
    const { data, error } = await this.supabaseService.obtenerPreguntasDeMision(misionId);

    if (error) {
      this.mensajeError.set(error);
    } else if (data.length === 0) {
      this.mensajeError.set('Esta misión no tiene preguntas configuradas.');
    } else {
      this.preguntas.set(data);
      this.totalPreguntas.set(data.length);
    }

    this.cargando.set(false);
  }

  get preguntaActual() {
    return this.preguntas()[this.indiceActual()];
  }

  get progreso() {
    if (this.preguntas().length === 0) return 0;
    return (this.indiceActual()) / this.preguntas().length;
  }

  seleccionarRespuesta(opcionId: string) {
    const pId = this.preguntaActual.id;
    this.respuestasTemp.update(respuestas => ({
      ...respuestas,
      [pId]: opcionId
    }));
  }

  opcionEstaSeleccionada(opcionId: string): boolean {
    if (!this.preguntaActual) return false;
    const pId = this.preguntaActual.id;
    return this.respuestasTemp()[pId] === opcionId;
  }

  siguientePregunta() {
    if (this.indiceActual() < this.preguntas().length - 1) {
      this.indiceActual.update(i => i + 1);
    } else {
      // Fin de la misión - calificar
      this.calificarYEnviar();
    }
  }

  calificarYEnviar() {
    const preguntas = this.preguntas();
    const respuestas = this.respuestasTemp();
    let correctas = 0;

    // Comparar cada respuesta del estudiante con la correcta
    for (const pregunta of preguntas) {
      const respuestaEstudiante = respuestas[pregunta.id];
      const opcionesCorrectas = pregunta.estructura.opciones.filter(
        (op: any) => op.es_correcta
      );

      if (respuestaEstudiante && opcionesCorrectas.some((op: any) => op.id === respuestaEstudiante)) {
        correctas++;
      }
    }

    const total = preguntas.length;
    const porcentaje = total > 0 ? Math.round((correctas / total) * 100) : 0;
    const xp = Math.round((porcentaje / 100) * this.xpRecompensa());

    this.respuestasCorrectas.set(correctas);
    this.totalPreguntas.set(total);
    this.puntajeObtenido.set(porcentaje);
    this.xpGanado.set(xp);

    this.misionCompletada.set(true);
    this.enviarRespuestas(porcentaje, xp);
  }

  async enviarRespuestas(puntaje: number, xp: number) {
    this.guardando.set(true);

    const est = this.estudiante();
    if (!est) {
      this.guardando.set(false);
      return;
    }

    const intentoData = {
      estudiante_id: est.id,
      mision_id: this.misionId,
      respuestas: this.respuestasTemp(),
      puntaje_total: puntaje,
      xp_ganado: xp
    };

    const { success, error } = await this.supabaseService.guardarIntentoMision(intentoData);

    if (!success) {
      console.error('Error al guardar intento:', error);
    }

    this.guardando.set(false);
  }

  get calificacionTexto(): string {
    const pct = this.puntajeObtenido();
    if (pct >= 90) return '¡Excelente!';
    if (pct >= 70) return '¡Buen trabajo!';
    if (pct >= 50) return 'Aprobado';
    return 'Necesita mejorar';
  }

  get calificacionColor(): string {
    const pct = this.puntajeObtenido();
    if (pct >= 90) return '#10b981';
    if (pct >= 70) return '#3b82f6';
    if (pct >= 50) return '#f59e0b';
    return '#ef4444';
  }
}
