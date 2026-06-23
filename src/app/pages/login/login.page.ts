import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase';
import { AuthService } from '../../services/auth';
import { GamificacionService } from '../../services/gamificacion.service';
import { Estudiante } from '../../models/mision.model';

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
  private gamificacionService = inject(GamificacionService);
  private router = inject(Router);

  dniInput = signal<string>('');
  cargando = signal<boolean>(false);
  mensajeError = signal<string | null>(null);
  estudianteConectado = signal<Estudiante | null>(null);

  misiones = signal<any[]>([]);
  cargandoMisiones = signal<boolean>(false);

  nivelActual = computed(() => {
    const est = this.estudianteConectado();
    if (!est) return null;
    return this.gamificacionService.obtenerNivelPorXp(est.xp);
  });

  progresoNivel = computed(() => {
    const est = this.estudianteConectado();
    if (!est) return 0;
    return this.gamificacionService.obtenerProgresoNivel(est.xp);
  });

  xpSiguienteNivel = computed(() => {
    const est = this.estudianteConectado();
    if (!est) return 0;
    return this.gamificacionService.obtenerXpParaSiguienteNivel(est.xp);
  });

  ngOnInit() {
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
      const estudianteFormateado: Estudiante = {
        ...data,
        instituciones_educativas: {
          nombre: data.ie_nombre ?? '',
          nivel: data.ie_nivel ?? ''
        }
      };
      this.estudianteConectado.set(estudianteFormateado);
      this.authService.guardarSesion(estudianteFormateado);

      if (estudianteFormateado.rol === 'admin') {
        this.router.navigate(['/admin/dashboard']);
        return;
      }

      const nivel = estudianteFormateado.instituciones_educativas?.nivel ?? 'Secundaria';
      this.cargarMisiones(nivel, estudianteFormateado.grado);
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
    this.router.navigate(['/mission-play', misionId]);
  }

  irAlPerfil() {
    this.router.navigate(['/profile']);
  }

  getIniciales(): string {
    const est = this.estudianteConectado();
    if (!est) return '?';
    const partes = est.nombre_completo.split(' ');
    if (partes.length >= 2) {
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    return est.nombre_completo.substring(0, 2).toUpperCase();
  }
}
