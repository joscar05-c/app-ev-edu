import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../../services/supabase';
import { AuthService } from '../../services/auth';
import {
  Mision,
  Pregunta,
  TipoPregunta,
  OpcionPregunta,
  MultimData
} from '../../models/mision.model';
import { MULTIMEDIA, MATERIAS } from '../../config/game.config';

interface PreguntaForm {
  tipo: TipoPregunta;
  enunciado: string;
  multimedia: MultimData;
  materia: string;
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
export class CrearMisionPage implements OnInit {
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private alertCtrl = inject(AlertController);

  mision = signal<Partial<Mision>>({
    titulo: '',
    descripcion: '',
    nivel_educativo: 'Secundaria',
    grado: 4,
    xp_recompensa: 100,
    max_intentos: 1
  });

  preguntas = signal<PreguntaForm[]>([]);
  guardando = signal<boolean>(false);
  mensajeError = signal<string | null>(null);
  subiendoImagen = signal<number | null>(null);

  modoEdicion = signal<boolean>(false);
  misionId = signal<string>('');
  cargandoDatos = signal<boolean>(false);

  readonly maxFileSize = MULTIMEDIA.MAX_FILE_SIZE_MB * 1024 * 1024;
  readonly formatosPermitidos: readonly string[] = MULTIMEDIA.FORMATOS_PERMITIDOS;
  readonly materias = MATERIAS;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.modoEdicion.set(true);
      this.misionId.set(id);
      this.cargarMisionExistente(id);
    } else {
      this.agregarPregunta('opcion_multiple');
    }
  }

  async cargarMisionExistente(id: string) {
    this.cargandoDatos.set(true);

    const { data: mision, error: errMision } = await this.supabaseService.obtenerMisionPorId(id);
    if (errMision || !mision) {
      this.mensajeError.set(errMision || 'Misión no encontrada.');
      this.cargandoDatos.set(false);
      return;
    }

    this.mision.set({
      titulo: mision.titulo,
      descripcion: mision.descripcion,
      nivel_educativo: mision.nivel_educativo,
      grado: mision.grado,
      xp_recompensa: mision.xp_recompensa,
      max_intentos: mision.max_intentos || 1
    });

    const { data: preguntas, error: errPreg } = await this.supabaseService.obtenerPreguntasDeMision(id);
    if (errPreg) {
      this.mensajeError.set(errPreg);
      this.cargandoDatos.set(false);
      return;
    }

    if (preguntas && preguntas.length > 0) {
      const forms: PreguntaForm[] = preguntas.map(p => ({
        tipo: p.tipo_pregunta,
        enunciado: p.enunciado,
        multimedia: p.multimedia || { tiene_multimedia: false },
        materia: p.materia || '',
        estructura: p.estructura
      }));
      this.preguntas.set(forms);
    } else {
      this.agregarPregunta('opcion_multiple');
    }

    this.cargandoDatos.set(false);
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
      materia: '',
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

    let result: { success: boolean; error: string | null };

    if (this.modoEdicion()) {
      result = await this.supabaseService.actualizarMisionConPreguntas(
        this.misionId(),
        this.mision(),
        this.preguntas()
      );
    } else {
      result = await this.supabaseService.crearMisionConPreguntas(
        this.mision(),
        this.preguntas()
      );
    }

    this.guardando.set(false);

    if (result.success) {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.mensajeError.set(`Error al guardar: ${result.error}`);
    }
  }

  cerrarSesion() {
    this.authService.cerrarSesion();
    this.router.navigate(['/login']);
  }
}
