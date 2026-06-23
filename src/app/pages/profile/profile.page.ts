import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { SupabaseService } from '../../services/supabase';
import { GamificacionService } from '../../services/gamificacion.service';
import { Estudiante } from '../../models/mision.model';
import { TITULOS, NivelConfig } from '../../config/game.config';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule]
})
export class ProfilePage implements OnInit {
  private authService = inject(AuthService);
  private supabaseService = inject(SupabaseService);
  private gamificacionService = inject(GamificacionService);
  private router = inject(Router);

  estudiante = signal<Estudiante | null>(null);
  subiendoAvatar = signal<boolean>(false);
  guardando = signal<boolean>(false);
  mensajeExito = signal<string | null>(null);
  mensajeError = signal<string | null>(null);

  nivelActual = computed(() => {
    const est = this.estudiante();
    if (!est) return null;
    return this.gamificacionService.obtenerNivelPorXp(est.xp);
  });

  progresoNivel = computed(() => {
    const est = this.estudiante();
    if (!est) return 0;
    return this.gamificacionService.obtenerProgresoNivel(est.xp);
  });

  xpSiguienteNivel = computed(() => {
    const est = this.estudiante();
    if (!est) return 0;
    return this.gamificacionService.obtenerXpParaSiguienteNivel(est.xp);
  });

  titulosDisponibles = computed(() => {
    const nivel = this.nivelActual();
    if (!nivel) return [];
    return TITULOS.filter(t => t.nivelRequerido <= nivel.nivel);
  });

  ngOnInit() {
    const sesion = this.authService.obtenerSesion();
    if (sesion) {
      this.estudiante.set(sesion);
    }
  }

  getIniciales(): string {
    const est = this.estudiante();
    if (!est) return '?';
    const partes = est.nombre_completo.split(' ');
    if (partes.length >= 2) {
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    return est.nombre_completo.substring(0, 2).toUpperCase();
  }

  async onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const est = this.estudiante();
    if (!est) return;

    this.subiendoAvatar.set(true);
    this.mensajeError.set(null);
    this.mensajeExito.set(null);

    const { data, error } = await this.supabaseService.subirAvatar(file, est.id);

    if (error) {
      this.mensajeError.set(error);
      this.subiendoAvatar.set(false);
      return;
    }

    const { error: updateError } = await this.supabaseService.actualizarPerfil(est.id, {
      avatar_url: data ?? undefined
    });

    if (updateError) {
      this.mensajeError.set(updateError);
    } else {
      est.avatar_url = data ?? undefined;
      this.estudiante.set({ ...est });
      this.authService.guardarSesion(est);
      this.mensajeExito.set('Avatar actualizado correctamente.');
    }

    this.subiendoAvatar.set(false);
  }

  async seleccionarTitulo(titulo: string) {
    const est = this.estudiante();
    if (!est) return;

    this.guardando.set(true);
    this.mensajeError.set(null);
    this.mensajeExito.set(null);

    const { error } = await this.supabaseService.actualizarPerfil(est.id, {
      titulo_actual: titulo
    });

    if (error) {
      this.mensajeError.set(error);
    } else {
      est.titulo_actual = titulo;
      this.estudiante.set({ ...est });
      this.authService.guardarSesion(est);
      this.mensajeExito.set('Título actualizado.');
    }

    this.guardando.set(false);
  }

  volverAlCuartel() {
    this.router.navigate(['/login']);
  }
}
