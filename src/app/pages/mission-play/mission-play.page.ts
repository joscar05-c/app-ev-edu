import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase';
import { AuthService } from '../../services/auth';
import { CalificacionService } from '../../services/calificacion.service';
import { Pregunta, Mision, Estudiante } from '../../models/mision.model';

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

  yaCompletada = signal<boolean>(false);

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
    }
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

  calificarYEnviar() {
    const preguntas = this.preguntas();
    const respuestas = this.respuestasTemp();

    const resultado = this.calificacionService.calificar(preguntas, respuestas);
    const xp = this.calificacionService.calcularXp(resultado.porcentaje, this.xpRecompensa());

    resultado.xpGanado = xp;

    this.respuestasCorrectas.set(resultado.correctas);
    this.totalPreguntas.set(resultado.total);
    this.puntajeObtenido.set(resultado.porcentaje);
    this.xpGanado.set(xp);
    this.calificacionTexto.set(
      this.calificacionService.obtenerCalificacionTexto(resultado.porcentaje)
    );
    this.calificacionColor.set(
      this.calificacionService.obtenerCalificacionColor(resultado.porcentaje)
    );

    this.misionCompletada.set(true);
    this.enviarRespuestas(resultado.porcentaje, xp);
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

  esRespuestaCorrecta(pregunta: Pregunta): boolean {
    const respuesta = this.respuestasTemp()[pregunta.id];
    if (!respuesta) return false;
    return pregunta.estructura.opciones
      .filter(op => op.es_correcta)
      .some(op => op.id === respuesta);
  }

  esRespuestaCorrectaOpcion(opcionId: string, pregunta: Pregunta): boolean {
    return pregunta.estructura.opciones
      .filter(op => op.es_correcta)
      .some(op => op.id === opcionId);
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
    this.respuestasCorrectas.set(0);
    this.puntajeObtenido.set(0);
    this.xpGanado.set(0);
  }
}
