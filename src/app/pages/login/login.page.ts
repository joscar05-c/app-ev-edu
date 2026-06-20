import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class LoginPage implements OnInit {
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Manejo de estado del estudiante
  dniInput = signal<string>('');
  cargando = signal<boolean>(false);
  mensajeError = signal<string | null>(null);
  estudianteConectado = signal<any | null>(null);

  // Manejo de estado de las misiones
  misiones = signal<any[]>([]);
  cargandoMisiones = signal<boolean>(false);

  ngOnInit() {
    // Si ya tiene sesión, restaurar estado
    const sesion = this.authService.obtenerSesion();
    if (sesion) {
      this.estudianteConectado.set(sesion);
      if (sesion.rol === 'estudiante' && sesion.grado) {
        this.cargarMisiones(sesion.instituciones_educativas?.nivel, sesion.grado);
      }
    }
  }

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

      // Persistir sesión
      this.authService.guardarSesion(estudianteFormateado);

      // Si es admin, redirigir al dashboard admin
      if (estudianteFormateado.rol === 'admin') {
        this.router.navigate(['/admin/dashboard']);
        return;
      }

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
    this.authService.cerrarSesion();
    this.estudianteConectado.set(null);
    this.misiones.set([]);
    this.dniInput.set('');
    this.mensajeError.set(null);
  }

  iniciarMision(misionId: string) {
    // La sesión ya está en AuthService, mission-play la leerá de ahí
    this.router.navigate(['/mission-play', misionId]);
  }
}
