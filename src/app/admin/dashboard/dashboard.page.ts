import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../services/supabase';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class DashboardPage implements OnInit {
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private router = inject(Router);

  admin = signal<any>(null);
  misiones = signal<any[]>([]);
  cargando = signal<boolean>(true);
  mensajeError = signal<string | null>(null);

  ngOnInit() {
    this.admin.set(this.authService.obtenerSesion());
    this.cargarMisiones();
  }

  // Si volvemos a esta vista desde "Crear Misión", Ionic dispara este evento
  ionViewWillEnter() {
    this.cargarMisiones();
  }

  async cargarMisiones() {
    this.cargando.set(true);
    this.mensajeError.set(null);

    const { data, error } = await this.supabaseService.obtenerTodasLasMisionesAdmin();

    this.cargando.set(false);

    if (error) {
      this.mensajeError.set(error);
    } else {
      this.misiones.set(data ?? []);
    }
  }

  cerrarSesion() {
    this.authService.cerrarSesion();
    this.router.navigate(['/login']);
  }

  // Función placeholder para más adelante
  cambiarEstadoMision(mision: any) {
    console.log('Cambiar estado de la misión:', mision.id);
    // Aquí luego haremos un UPDATE en Supabase para activar/desactivar
  }
}
