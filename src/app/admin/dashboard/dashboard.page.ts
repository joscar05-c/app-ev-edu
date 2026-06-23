import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../services/supabase';
import { AuthService } from '../../services/auth';
import { EstadisticasService, EstadisticasDashboard, RendimientoPorNivel, RankingIE, PreguntaError } from '../../services/estadisticas.service';
import { Mision } from '../../models/mision.model';
import { KpiCardsComponent, KpiData } from './components/kpi-cards/kpi-cards.component';
import { ChartRendimientoComponent } from './components/chart-rendimiento/chart-rendimiento.component';
import { ChartRankingComponent } from './components/chart-ranking/chart-ranking.component';
import { TablaPreguntasErrorComponent } from './components/tabla-preguntas-error/tabla-preguntas-error.component';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    IonicModule, CommonModule, FormsModule, RouterModule,
    KpiCardsComponent, ChartRendimientoComponent, ChartRankingComponent, TablaPreguntasErrorComponent
  ]
})
export class DashboardPage implements OnInit {
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);
  private estadisticasService = inject(EstadisticasService);

  admin = signal<any>(null);
  misiones = signal<Mision[]>([]);
  cargando = signal<boolean>(true);
  mensajeError = signal<string | null>(null);

  estadisticas = signal<EstadisticasDashboard | null>(null);
  rendimientoPorNivel = signal<RendimientoPorNivel[]>([]);
  rankingIEs = signal<RankingIE[]>([]);
  preguntasError = signal<PreguntaError[]>([]);

  kpis = signal<KpiData[]>([]);

  ngOnInit() {
    this.admin.set(this.authService.obtenerSesion());
    this.cargarDatos();
  }

  ionViewWillEnter() {
    this.cargarMisiones();
  }

  async cargarDatos() {
    this.cargando.set(true);

    await Promise.all([
      this.cargarMisiones(),
      this.cargarEstadisticas(),
      this.cargarRendimiento(),
      this.cargarRanking(),
      this.cargarPreguntasError()
    ]);

    this.cargando.set(false);
  }

  async cargarMisiones() {
    const { data, error } = await this.supabaseService.obtenerTodasLasMisionesAdmin();
    if (error) {
      this.mensajeError.set(error);
    } else {
      this.misiones.set(data ?? []);
    }
  }

  async cargarEstadisticas() {
    const stats = await this.estadisticasService.obtenerEstadisticasDashboard();
    this.estadisticas.set(stats);

    this.kpis.set([
      { label: 'Misiones', value: stats.totalMisiones, icon: '📋', color: '#3b82f6' },
      { label: 'Misiones Activas', value: stats.misionesActivas, icon: '✅', color: '#10b981' },
      { label: 'Estudiantes', value: stats.totalEstudiantes, icon: '👥', color: '#8b5cf6' },
      { label: 'Intentos Totales', value: stats.totalIntentos, icon: '📝', color: '#f59e0b' },
      { label: 'Promedio General', value: stats.promedioGeneral + '%', icon: '📊', color: '#06b6d4' },
      { label: 'Tasa de Aprobación', value: stats.tasaAprobacion + '%', icon: '🎯', color: '#ec4899' }
    ]);
  }

  async cargarRendimiento() {
    const data = await this.estadisticasService.obtenerRendimientoPorNivel();
    this.rendimientoPorNivel.set(data);
  }

  async cargarRanking() {
    const data = await this.estadisticasService.obtenerRankingIE();
    this.rankingIEs.set(data);
  }

  async cargarPreguntasError() {
    const data = await this.estadisticasService.obtenerPreguntasConMayorError(10);
    this.preguntasError.set(data);
  }

  cerrarSesion() {
    this.authService.cerrarSesion();
    this.router.navigate(['/login']);
  }

  async cambiarEstadoMision(mision: Mision) {
    const nuevoEstado = !mision.activo;
    const textoEstado = nuevoEstado ? 'activar' : 'desactivar';

    const alert = await this.alertCtrl.create({
      header: `${textoEstado.charAt(0).toUpperCase() + textoEstado.slice(1)} misión`,
      message: `¿Estás seguro de que quieres ${textoEstado} la misión "${mision.titulo}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: textoEstado.charAt(0).toUpperCase() + textoEstado.slice(1),
          role: 'confirm',
          handler: async () => {
            const { success, error } = await this.supabaseService.cambiarEstadoMision(
              mision.id,
              nuevoEstado
            );

            if (success) {
              this.misiones.update(ms =>
                ms.map(m => m.id === mision.id ? { ...m, activo: nuevoEstado } : m)
              );
              this.cargarEstadisticas();
            } else {
              this.mensajeError.set(error || 'No se pudo cambiar el estado.');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async eliminarMision(mision: Mision) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar misión',
      message: `¿Estás seguro de que quieres eliminar la misión "${mision.titulo}"? Esta acción no se puede deshacer.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'confirm',
          cssClass: 'alert-danger',
          handler: async () => {
            const { success, error } = await this.supabaseService.eliminarMision(mision.id);

            if (success) {
              this.misiones.update(ms => ms.filter(m => m.id !== mision.id));
              this.cargarEstadisticas();
            } else {
              this.mensajeError.set(error || 'No se pudo eliminar la misión.');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  editarMision(mision: Mision) {
    this.router.navigate(['/admin/editar-mision', mision.id]);
  }
}
