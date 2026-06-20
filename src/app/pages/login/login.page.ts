import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '../../services/supabase';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class LoginPage {
  private supabaseService = inject(SupabaseService);

  // Manejo de estado del estudiante
  dniInput = signal<string>('');
  cargando = signal<boolean>(false);
  mensajeError = signal<string | null>(null);
  estudianteConectado = signal<any | null>(null);

  // Manejo de estado de las misiones
  misiones = signal<any[]>([]);
  cargandoMisiones = signal<boolean>(false);

  async conectarEstudiante() {
    if (this.dniInput().length < 8) return;

    this.cargando.set(true);
    this.mensajeError.set(null);

    const { data, error } = await this.supabaseService.loginConDni(this.dniInput());

    this.cargando.set(false);

    if (error) {
      this.mensajeError.set(error);
      return;
    }

    if (data) {
      // Formateamos la data si viene del RPC
      const estudianteFormateado = {
        ...data,
        instituciones_educativas: {
          nombre: data.ie_nombre,
          nivel: data.ie_nivel
        }
      };
      this.estudianteConectado.set(estudianteFormateado);

      // Una vez logueado, cargamos sus misiones automáticamente
      this.cargarMisiones(estudianteFormateado.instituciones_educativas.nivel, estudianteFormateado.grado);
    }
  }

  async cargarMisiones(nivel: string, grado: number) {
    this.cargandoMisiones.set(true);

    const { data, error } = await this.supabaseService.obtenerMisionesDisponibles(nivel, grado);

    this.cargandoMisiones.set(false);

    if (!error && data) {
      this.misiones.set(data);
    } else if (error) {
       console.error("Error cargando misiones: ", error);
    }
  }

  cerrarSesion() {
    this.estudianteConectado.set(null);
    this.misiones.set([]); // Limpiamos las misiones al salir
    this.dniInput.set('');
    this.mensajeError.set(null);
  }
}
