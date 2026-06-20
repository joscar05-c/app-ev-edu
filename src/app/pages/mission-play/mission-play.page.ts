import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../../services/supabase'; // Asegúrate de que la ruta sea correcta

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

  // Estado de la partida
  cargando = signal<boolean>(true);
  preguntas = signal<any[]>([]);
  indiceActual = signal<number>(0);
  misionCompletada = signal<boolean>(false);
  mensajeError = signal<string | null>(null);

  // Almacenamiento temporal: Guarda { "pregunta_id": "opcion_id" }
  respuestasTemp = signal<{ [key: string]: string }>({});

  ngOnInit() {
    // 1. Capturamos el ID de la misión desde la URL
    const misionId = this.route.snapshot.paramMap.get('id');

    if (misionId) {
      this.cargarPreguntasReales(misionId);
    } else {
      this.mensajeError.set('ID de misión no válido.');
      this.cargando.set(false);
    }
  }

  async cargarPreguntasReales(misionId: string) {
    // 2. Traemos las preguntas de Supabase
    const { data, error } = await this.supabaseService.obtenerPreguntasDeMision(misionId);

    if (error) {
      this.mensajeError.set(error);
    } else if (data.length === 0) {
      this.mensajeError.set('Esta misión no tiene preguntas configuradas.');
    } else {
      this.preguntas.set(data);
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
      // Fin de la misión
      this.misionCompletada.set(true);
      this.enviarRespuestas();
    }
  }

  enviarRespuestas() {
    console.log('--- ENVIANDO A BASE DE DATOS (FASE 3) ---');
    console.log('Respuestas del alumno:', this.respuestasTemp());
    // Próximo paso: Fase 3 (Calificación)
  }
}
