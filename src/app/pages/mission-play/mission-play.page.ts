import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase';
import { AuthService } from '../../services/auth';
import { CalificacionService } from '../../services/calificacion.service';
import { GamificacionService } from '../../services/gamificacion.service';
import { Pregunta, Mision, Estudiante, DetalleRespuesta } from '../../models/mision.model';
import { NivelConfig } from '../../config/game.config';

@Component({
  selector: 'app-mission-play',
  templateUrl: './mission-play.page.html',
  styleUrls: ['./mission-play.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class MissionPlayPage implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private calificacionService = inject(CalificacionService);
  private gamificacionService = inject(GamificacionService);
  private alertCtrl = inject(AlertController);

  misionId = '';
  estudiante = signal<Estudiante | null>(null);
  mision = signal<Mision | null>(null);
  xpRecompensa = signal<number>(0);

  cargando = signal<boolean>(true);
  preguntas = signal<Pregunta[]>([]);
  indiceActual = signal<number>(0);
  misionCompletada = signal<boolean>(false);
  guardando = signal<boolean>(false);
  mensajeError = signal<string | null>(null);

  respuestasCorrectas = signal<number>(0);
  totalPreguntas = signal<number>(0);
  puntajeObtenido = signal<number>(0);
  xpGanado = signal<number>(0);
  calificacionTexto = signal<string>('');
  calificacionColor = signal<string>('');

  respuestasTemp = signal<Record<string, string>>({});
  detalleRespuestas = signal<DetalleRespuesta[]>([]);

  yaCompletada = signal<boolean>(false);

  mostrarLevelUp = signal<boolean>(false);
  nivelGanado = signal<NivelConfig | null>(null);
  xpTotalAntes = signal<number>(0);

  ngOnInit() {
    const misionId = this.route.snapshot.paramMap.get('id');
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

    this.mision.set(data);
    this.xpRecompensa.set(data.xp_recompensa || 100);

    await this.verificarIntentoPrevio();
    await this.cargarPreguntasReales(misionId);
  }

  async verificarIntentoPrevio() {
    const est = this.estudiante();
    if (!est) return;

    const { data } = await this.supabaseService.verificarIntentoPrevio(est.id, this.misionId);
    if (data) {
      this.yaCompletada.set(true);
      this.mensajeError.set('Ya completaste esta misión.');
      return;
    }

    const m = this.mision();
    if (m && m.max_intentos && m.max_intentos > 1) {
      const { count } = await (this.supabaseService as any).supabase
        .from('intentos_misiones')
        .select('id', { count: 'exact', head: true })
        .eq('estudiante_id', est.id)
        .eq('mision_id', this.misionId)
        .eq('completado', true);

      if (count && count >= m.max_intentos) {
        this.yaCompletada.set(true);
        this.mensajeError.set(`Has agotado tus ${m.max_intentos} intento(s) para esta misión.`);
      }
    }
  }

  async cargarPreguntasReales(misionId: string) {
    const { data, error } = await this.supabaseService.obtenerPreguntasDeMision(misionId);

    if (error) {
      this.mensajeError.set(error);
    } else if (!data || data.length === 0) {
      this.mensajeError.set('Esta misión no tiene preguntas configuradas.');
    } else {
      this.preguntas.set(data);
      this.totalPreguntas.set(data.length);
    }

    this.cargando.set(false);
  }

  get preguntaActual(): Pregunta | null {
    return this.preguntas()[this.indiceActual()] ?? null;
  }

  get progreso(): number {
    const total = this.preguntas().length;
    if (total === 0) return 0;
    return this.indiceActual() / total;
  }

  get esUltimaPregunta(): boolean {
    return this.indiceActual() === this.preguntas().length - 1;
  }

  seleccionarRespuesta(opcionId: string) {
    const pId = this.preguntaActual?.id;
    if (!pId) return;

    this.respuestasTemp.update(respuestas => ({
      ...respuestas,
      [pId]: opcionId
    }));
  }

  opcionEstaSeleccionada(opcionId: string): boolean {
    if (!this.preguntaActual) return false;
    return this.respuestasTemp()[this.preguntaActual.id] === opcionId;
  }

  get respuestaActual(): string | undefined {
    if (!this.preguntaActual) return undefined;
    return this.respuestasTemp()[this.preguntaActual.id];
  }

  siguientePregunta() {
    if (this.indiceActual() < this.preguntas().length - 1) {
      this.indiceActual.update(i => i + 1);
    } else {
      this.calificarYEnviar();
    }
  }

  preguntaAnterior() {
    if (this.indiceActual() > 0) {
      this.indiceActual.update(i => i - 1);
    }
  }

  async calificarYEnviar() {
    const est = this.estudiante();
    if (!est) return;

    this.misionCompletada.set(true);
    this.guardando.set(true);

    const { data, error } = await this.supabaseService.calificarMision(
      est.id,
      this.misionId,
      this.respuestasTemp()
    );

    if (error || !data) {
      this.mensajeError.set(error || 'Error al calificar.');
      this.guardando.set(false);
      return;
    }

    this.respuestasCorrectas.set(data.correctas);
    this.totalPreguntas.set(data.total);
    this.puntajeObtenido.set(data.porcentaje);
    this.xpGanado.set(data.xp_ganado);
    this.detalleRespuestas.set(data.detalle);

    this.calificacionTexto.set(
      this.calificacionService.obtenerCalificacionTexto(data.porcentaje)
    );
    this.calificacionColor.set(
      this.calificacionService.obtenerCalificacionColor(data.porcentaje)
    );

    const sesion = this.authService.obtenerSesion();
    if (sesion) {
      const xpAnterior = sesion.xp || 0;
      this.xpTotalAntes.set(xpAnterior);

      const nivelAnterior = this.gamificacionService.obtenerNivelPorXp(xpAnterior);

      sesion.xp = xpAnterior + data.xp_ganado;

      const nivelNuevo = this.gamificacionService.obtenerNivelPorXp(sesion.xp);

      if (nivelNuevo.nivel > nivelAnterior.nivel) {
        this.nivelGanado.set(nivelNuevo);
        setTimeout(() => this.mostrarLevelUp.set(true), 500);
      }

      sesion.rango_nivel = nivelNuevo.nivel;
      this.authService.guardarSesion(sesion);
    }

    this.guardando.set(false);
  }

  esRespuestaCorrecta(pregunta: Pregunta): boolean {
    const respuesta = this.respuestasTemp()[pregunta.id];
    if (!respuesta) return false;
    return pregunta.estructura.opciones
      .filter(op => op.es_correcta)
      .some(op => op.id === respuesta);
  }

  esSeleccionadaEnRespuesta(opcionId: string, preguntaId: string): boolean {
    return this.respuestasTemp()[preguntaId] === opcionId;
  }

  esCorrectaEnRespuesta(opcionId: string, pregunta: Pregunta): boolean {
    return pregunta.estructura.opciones
      .filter(op => op.es_correcta)
      .some(op => op.id === opcionId);
  }

  obtenerTextoOpcion(pregunta: Pregunta, opcionId: string): string {
    const opcion = pregunta.estructura.opciones.find(op => op.id === opcionId);
    return opcion?.texto ?? opcionId;
  }

  get progresoCorrectas(): number {
    const total = this.totalPreguntas();
    if (total === 0) return 0;
    return this.respuestasCorrectas() / total;
  }

  get progresoXp(): number {
    const max = this.xpRecompensa();
    if (max === 0) return 0;
    return this.xpGanado() / max;
  }

  async confirmarAbandonar() {
    const alert = await this.alertCtrl.create({
      header: '¿Abandonar misión?',
      message: 'Perderás tu progreso en esta misión.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Abandonar',
          role: 'confirm',
          cssClass: 'alert-danger',
          handler: () => this.router.navigate(['/login'])
        }
      ]
    });
    await alert.present();
  }

  onImgError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }

  reiniciarMision() {
    this.indiceActual.set(0);
    this.respuestasTemp.set({});
    this.misionCompletada.set(false);
    this.yaCompletada.set(false);
    this.detalleRespuestas.set([]);
    this.respuestasCorrectas.set(0);
    this.puntajeObtenido.set(0);
    this.xpGanado.set(0);
    this.mostrarLevelUp.set(false);
    this.nivelGanado.set(null);
  }

  cerrarLevelUp() {
    this.mostrarLevelUp.set(false);
  }
}
