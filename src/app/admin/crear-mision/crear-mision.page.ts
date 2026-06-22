import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../services/supabase';
import { AuthService } from '../../services/auth';
import {
  Mision,
  Pregunta,
  TipoPregunta,
  OpcionPregunta,
  MultimData
} from '../../models/mision.model';
import { MULTIMEDIA } from '../../config/game.config';

interface PreguntaForm {
  tipo: TipoPregunta;
  enunciado: string;
  multimedia: MultimData;
  estructura: {
    tipo: TipoPregunta;
    opciones: OpcionPregunta[];
    feedback_error: string;
  };
}

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
  private alertCtrl = inject(AlertController);

  mision = signal<Partial<Mision>>({
    titulo: '',
    descripcion: '',
    nivel_educativo: 'Secundaria',
    grado: 4,
    xp_recompensa: 100
  });

  preguntas = signal<PreguntaForm[]>([]);
  guardando = signal<boolean>(false);
  mensajeError = signal<string | null>(null);
  subiendoImagen = signal<number | null>(null);

  readonly maxFileSize = MULTIMEDIA.MAX_FILE_SIZE_MB * 1024 * 1024;
  readonly formatosPermitidos: readonly string[] = MULTIMEDIA.FORMATOS_PERMITIDOS;

  constructor() {
    this.agregarPregunta('opcion_multiple');
  }

  agregarPregunta(tipo: TipoPregunta) {
    const opciones = tipo === 'verdadero_falso'
      ? [
          { id: 'V', texto: 'Verdadero', es_correcta: true },
          { id: 'F', texto: 'Falso', es_correcta: false }
        ]
      : [
          { id: 'A', texto: '', es_correcta: true },
          { id: 'B', texto: '', es_correcta: false },
          { id: 'C', texto: '', es_correcta: false },
          { id: 'D', texto: '', es_correcta: false }
        ];

    const nuevaPregunta: PreguntaForm = {
      tipo,
      enunciado: '',
      multimedia: { tiene_multimedia: false },
      estructura: {
        tipo,
        opciones,
        feedback_error: ''
      }
    };

    this.preguntas.update(ps => [...ps, nuevaPregunta]);
  }

  cambiarTipoPregunta(index: number, nuevoTipo: TipoPregunta) {
    this.preguntas.update(ps => {
      const copia = [...ps];
      const pregunta = copia[index];

      if (pregunta.tipo === nuevoTipo) return copia;

      const opciones = nuevoTipo === 'verdadero_falso'
        ? [
            { id: 'V', texto: 'Verdadero', es_correcta: true },
            { id: 'F', texto: 'Falso', es_correcta: false }
          ]
        : [
            { id: 'A', texto: '', es_correcta: true },
            { id: 'B', texto: '', es_correcta: false },
            { id: 'C', texto: '', es_correcta: false },
            { id: 'D', texto: '', es_correcta: false }
          ];

      copia[index] = {
        ...pregunta,
        tipo: nuevoTipo,
        estructura: {
          tipo: nuevoTipo,
          opciones,
          feedback_error: pregunta.estructura.feedback_error
        }
      };

      return copia;
    });
  }

  async eliminarPregunta(index: number) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar pregunta',
      message: '¿Estás seguro de que quieres eliminar esta pregunta?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'confirm',
          handler: () => {
            this.preguntas.update(ps => ps.filter((_, i) => i !== index));
          }
        }
      ]
    });
    await alert.present();
  }

  marcarOpcionCorrecta(preguntaIndex: number, opcionId: string) {
    this.preguntas.update(ps => {
      const nuevasPreguntas = [...ps];
      nuevasPreguntas[preguntaIndex].estructura.opciones.forEach(op => {
        op.es_correcta = op.id === opcionId;
      });
      return nuevasPreguntas;
    });
  }

  async onFileSelected(event: Event, preguntaIndex: number) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    if (file.size > this.maxFileSize) {
      this.mensajeError.set(`La imagen no debe superar ${MULTIMEDIA.MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    if (!this.formatosPermitidos.includes(file.type)) {
      this.mensajeError.set('Formato no permitido. Use JPEG, PNG, WebP o GIF.');
      return;
    }

    this.subiendoImagen.set(preguntaIndex);
    this.mensajeError.set(null);

    const resultado = await this.supabaseService.subirImagen(file, 'preguntas');

    if (resultado) {
      this.preguntas.update(ps => {
        const copia = [...ps];
        copia[preguntaIndex].multimedia = {
          tiene_multimedia: true,
          tipo: 'imagen',
          url: resultado.url,
          storage_path: resultado.path
        };
        return copia;
      });
    } else {
      this.mensajeError.set('No se pudo subir la imagen. Intente nuevamente.');
    }

    this.subiendoImagen.set(null);
    input.value = '';
  }

  async eliminarMultimedia(preguntaIndex: number) {
    const pregunta = this.preguntas()[preguntaIndex];

    if (pregunta.multimedia.storage_path) {
      await this.supabaseService.eliminarArchivo(pregunta.multimedia.storage_path);
    }

    this.preguntas.update(ps => {
      const copia = [...ps];
      copia[preguntaIndex].multimedia = { tiene_multimedia: false };
      return copia;
    });
  }

  async guardarMision() {
    if (!this.mision().titulo || this.preguntas().length === 0) {
      this.mensajeError.set('La misión necesita un título y al menos una pregunta.');
      return;
    }

    for (let i = 0; i < this.preguntas().length; i++) {
      const p = this.preguntas()[i];
      if (!p.enunciado.trim()) {
        this.mensajeError.set(`La pregunta ${i + 1} necesita un enunciado.`);
        return;
      }
    }

    this.guardando.set(true);
    this.mensajeError.set(null);

    const { success, error } = await this.supabaseService.crearMisionConPreguntas(
      this.mision(),
      this.preguntas()
    );

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
