import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../services/supabase';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-crear-mision',
  templateUrl: './crear-mision.page.html',
  styleUrls: ['./crear-mision.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class CrearMisionPage {
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Estado del formulario de la Misión
  mision = signal({
    titulo: '',
    descripcion: '',
    nivel_educativo: 'Secundaria',
    grado: 4,
    xp_recompensa: 100
  });

  // Estado del creador de Preguntas (Repeater)
  preguntas = signal<any[]>([]);
  guardando = signal<boolean>(false);
  mensajeError = signal<string | null>(null);

  constructor() {
    // Iniciamos con una pregunta por defecto
    this.agregarPreguntaMultiple();
  }

  agregarPreguntaMultiple() {
    const nuevaPregunta = {
      tipo: 'opcion_multiple',
      enunciado: '',
      estructura: {
        tipo: 'opcion_multiple',
        opciones: [
          { id: 'A', texto: '', es_correcta: true },
          { id: 'B', texto: '', es_correcta: false },
          { id: 'C', texto: '', es_correcta: false },
          { id: 'D', texto: '', es_correcta: false }
        ],
        feedback_error: ''
      }
    };
    this.preguntas.update(ps => [...ps, nuevaPregunta]);
  }

  eliminarPregunta(index: number) {
    this.preguntas.update(ps => ps.filter((_, i) => i !== index));
  }

  marcarOpcionCorrecta(preguntaIndex: number, opcionId: string) {
    this.preguntas.update(ps => {
      const nuevasPreguntas = [...ps];
      nuevasPreguntas[preguntaIndex].estructura.opciones.forEach((op: any) => {
        op.es_correcta = (op.id === opcionId);
      });
      return nuevasPreguntas;
    });
  }

  async guardarMision() {
    // Validaciones básicas
    if (!this.mision().titulo || this.preguntas().length === 0) {
      this.mensajeError.set('La misión necesita un título y al menos una pregunta.');
      return;
    }

    this.guardando.set(true);
    this.mensajeError.set(null);

    const { success, error } = await this.supabaseService.crearMisionConPreguntas(this.mision(), this.preguntas());

    this.guardando.set(false);

    if (success) {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.mensajeError.set(`Error al guardar: ${error}`);
    }
  }

  cerrarSesion() {
    this.authService.cerrarSesion();
    this.router.navigate(['/login']);
  }
}
