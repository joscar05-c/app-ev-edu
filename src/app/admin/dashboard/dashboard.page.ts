import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router'; // Para el botón de "Crear Misión"
import { SupabaseService } from '../../services/supabase';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class DashboardPage implements OnInit {
  private supabaseService = inject(SupabaseService);

  misiones = signal<any[]>([]);
  cargando = signal<boolean>(true);
  mensajeError = signal<string | null>(null);

  ngOnInit() {
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
      this.misiones.set(data);
    }
  }

  // Función placeholder para más adelante
  cambiarEstadoMision(mision: any) {
    console.log('Cambiar estado de la misión:', mision.id);
    // Aquí luego haremos un UPDATE en Supabase para activar/desactivar
  }
}
