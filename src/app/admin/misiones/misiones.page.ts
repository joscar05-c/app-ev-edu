import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../services/supabase';
import { Mision } from '../../models/mision.model';

@Component({
  selector: 'app-misiones',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>📋 Gestión de Misiones</h1>
        <button class="btn-primary" routerLink="/admin/crear-mision">+ Nueva Misión</button>
      </div>

      @if (cargando()) {
        <div class="loading"><div class="spinner"></div></div>
      }

      @if (!cargando() && misiones().length > 0) {
        <div class="table-card">
          <div class="table-header">
            <div class="col-title">Título</div>
            <div class="col-level">Nivel / Grado</div>
            <div class="col-xp">XP</div>
            <div class="col-intentos">Intentos</div>
            <div class="col-status">Estado</div>
            <div class="col-actions">Acciones</div>
          </div>
          <div class="table-body">
            @for (m of misiones(); track m.id) {
              <div class="table-row">
                <div class="col-title"><strong>{{ m.titulo }}</strong></div>
                <div class="col-level">
                  <span class="badge gray">{{ m.nivel_educativo }}</span>
                  <span class="badge gray">{{ m.grado }}°</span>
                </div>
                <div class="col-xp">⭐ {{ m.xp_recompensa }}</div>
                <div class="col-intentos">{{ m.max_intentos || 1 }}</div>
                <div class="col-status">
                  <span class="badge" [class]="m.activo ? 'badge-green' : 'badge-red'">{{ m.activo ? 'Activo' : 'Inactivo' }}</span>
                </div>
                <div class="col-actions">
                  <button class="btn-icon" (click)="editarMision(m)">✏️</button>
                  <button class="btn-icon" (click)="toggleEstado(m)">🔄</button>
                  <button class="btn-icon danger" (click)="eliminarMision(m)">🗑️</button>
                </div>
              </div>
            }
          </div>
        </div>
      } @else if (!cargando()) {
        <div class="empty">No hay misiones creadas.</div>
      }
    </div>
  `,
  styles: [`
    .page-container { max-width: 1100px; margin: 0 auto; padding: 30px 20px; font-family: 'Segoe UI', Roboto, sans-serif; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
    .page-header h1 { margin: 0; font-size: 22px; font-weight: 700; }
    .btn-primary { background: #2563eb; color: white; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .table-card { background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
    .table-header { display: grid; grid-template-columns: 2fr 1fr 0.7fr 0.7fr 0.8fr 1fr; background: #f1f5f9; padding: 12px 16px; font-weight: 600; font-size: 13px; color: #64748b; }
    .table-row { display: grid; grid-template-columns: 2fr 1fr 0.7fr 0.7fr 0.8fr 1fr; padding: 12px 16px; align-items: center; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .table-row:hover { background: #f8fafc; }
    .badge { padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
    .badge-gray { background: #f1f5f9; color: #475569; }
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-red { background: #fee2e2; color: #991b1b; }
    .col-actions { display: flex; gap: 6px; }
    .btn-icon { background: transparent; border: 1px solid #e2e8f0; border-radius: 6px; padding: 5px 8px; cursor: pointer; }
    .btn-icon.danger:hover { background: #fee2e2; }
    .loading { text-align: center; padding: 40px; }
    .spinner { width: 36px; height: 36px; margin: 0 auto; border: 3px solid #e2e8f0; border-top-color: #2563eb; border-radius: 50%; animation: spin 1s linear infinite; }
    .empty { text-align: center; padding: 40px; color: #94a3b8; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 768px) { .table-header, .table-row { grid-template-columns: 1fr auto; } .col-level, .col-xp, .col-intentos, .col-status { display: none; } }
  `]
})
export class MisionesPage implements OnInit {
  private supabase = inject(SupabaseService);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);

  misiones = signal<Mision[]>([]);
  cargando = signal(true);

  ngOnInit() { this.cargar(); }

  async cargar() {
    this.cargando.set(true);
    const { data } = await this.supabase.obtenerTodasLasMisionesAdmin();
    this.misiones.set(data ?? []);
    this.cargando.set(false);
  }

  editarMision(m: Mision) { this.router.navigate(['/admin/editar-mision', m.id]); }

  async toggleEstado(m: Mision) {
    const nuevo = !m.activo;
    const { success } = await this.supabase.cambiarEstadoMision(m.id, nuevo);
    if (success) this.misiones.update(ms => ms.map(x => x.id === m.id ? { ...x, activo: nuevo } : x));
  }

  async eliminarMision(m: Mision) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar', message: `¿Eliminar "${m.titulo}"?`, cssClass: 'alert-danger',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'confirm', handler: async () => {
          const { success } = await this.supabase.eliminarMision(m.id);
          if (success) this.misiones.update(ms => ms.filter(x => x.id !== m.id));
        }}
      ]
    });
    await alert.present();
  }
}
