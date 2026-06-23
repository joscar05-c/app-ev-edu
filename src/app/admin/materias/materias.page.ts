import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { SupabaseService } from '../../services/supabase';

interface Materia {
  id: string;
  nombre: string;
  activa: boolean;
  created_at: string;
}

@Component({
  selector: 'app-materias',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>📚 Gestión de Materias</h1>
        <button class="btn-primary" (click)="abrirFormulario()">+ Nueva Materia</button>
      </div>

      @if (cargando()) {
        <div class="loading"><div class="spinner"></div></div>
      }

      @if (!cargando()) {
        <div class="table-card">
          <div class="table-header">
            <div class="col-name">Nombre</div>
            <div class="col-status">Estado</div>
            <div class="col-date">Creado</div>
            <div class="col-actions">Acciones</div>
          </div>
          <div class="table-body">
            @for (m of materias(); track m.id) {
              <div class="table-row">
                <div class="col-name"><strong>{{ m.nombre }}</strong></div>
                <div class="col-status">
                  <span class="badge" [class]="m.activa ? 'badge-green' : 'badge-red'">
                    {{ m.activa ? 'Activa' : 'Inactiva' }}
                  </span>
                </div>
                <div class="col-date">{{ m.created_at | date:'dd/MM/yyyy' }}</div>
                <div class="col-actions">
                  <button class="btn-icon" (click)="abrirFormulario(m)" title="Editar">✏️</button>
                  <button class="btn-icon" (click)="toggleEstado(m)" title="Activar/Desactivar">🔄</button>
                  <button class="btn-icon danger" (click)="eliminar(m)" title="Eliminar">🗑️</button>
                </div>
              </div>
            }
            @if (materias().length === 0) {
              <div class="empty-row">No hay materias creadas.</div>
            }
          </div>
        </div>
      }

      @if (mostrarForm()) {
        <div class="modal-overlay" (click)="cerrarForm()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <h2>{{ editando() ? 'Editar' : 'Nueva' }} Materia</h2>

            <div class="form-grid">
              <div class="input-group full">
                <label>Nombre de la Materia</label>
                <input type="text" [(ngModel)]="form().nombre" placeholder="Ej: Matemática">
              </div>
            </div>

            @if (errorForm()) { <div class="error-msg">{{ errorForm() }}</div> }

            <div class="form-actions">
              <button class="btn-cancel" (click)="cerrarForm()">Cancelar</button>
              <button class="btn-save" (click)="guardar()" [disabled]="guardando()">
                {{ guardando() ? 'Guardando...' : 'Guardar' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container { max-width: 800px; margin: 0 auto; padding: 30px 20px; font-family: 'Segoe UI', Roboto, sans-serif; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
    .page-header h1 { margin: 0; font-size: 22px; font-weight: 700; color: var(--admin-text); }
    .btn-primary { background: var(--admin-primary); color: white; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .table-card { background: var(--admin-card); border-radius: 12px; border: 1px solid var(--admin-border); overflow: hidden; }
    .table-header { display: grid; grid-template-columns: 2fr 1fr 1fr 0.8fr; background: var(--admin-table-header-bg); padding: 12px 16px; font-weight: 600; font-size: 13px; color: var(--admin-text-light); }
    .table-row { display: grid; grid-template-columns: 2fr 1fr 1fr 0.8fr; padding: 12px 16px; align-items: center; border-bottom: 1px solid var(--admin-border); font-size: 14px; }
    .table-row:hover { background: var(--admin-hover); }
    .col-name strong { color: var(--admin-text); }
    .empty-row { padding: 20px; text-align: center; color: var(--admin-text-light); }
    .badge { padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-red { background: #fee2e2; color: #991b1b; }
    .col-actions { display: flex; gap: 6px; }
    .btn-icon { background: var(--admin-card); border: 1px solid var(--admin-border); border-radius: 6px; padding: 5px 8px; cursor: pointer; font-size: 14px; transition: all 0.2s; }
    .btn-icon:hover { background: var(--admin-hover); }
    .btn-icon.danger:hover { background: #fee2e2; }
    .loading { text-align: center; padding: 40px; }
    .spinner { width: 36px; height: 36px; margin: 0 auto; border: 3px solid var(--admin-spinner-track, #e2e8f0); border-top-color: var(--admin-primary, #2563eb); border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; justify-content: center; align-items: center; }
    .modal-card { background: var(--admin-card); border-radius: 16px; padding: 30px; width: 90%; max-width: 450px; max-height: 90vh; overflow-y: auto; border: 1px solid var(--admin-border); }
    .modal-card h2 { margin: 0 0 20px 0; font-size: 20px; color: var(--admin-text); }
    .form-grid { display: grid; grid-template-columns: 1fr; gap: 15px; margin-bottom: 20px; }
    .input-group.full { grid-column: 1 / -1; }
    .input-group label { display: block; font-size: 12px; font-weight: 600; color: var(--admin-text-light); margin-bottom: 6px; }
    .input-group input { width: 100%; padding: 10px; border: 1px solid var(--admin-border); border-radius: 8px; font-size: 14px; box-sizing: border-box; background: var(--admin-card); color: var(--admin-text); }
    .input-group input:focus { outline: none; border-color: var(--admin-primary); }
    .form-actions { display: flex; gap: 10px; justify-content: flex-end; }
    .btn-cancel { background: var(--admin-hover); border: 1px solid var(--admin-border); color: var(--admin-text); padding: 10px 18px; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .btn-save { background: var(--admin-primary); color: white; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn-save:disabled { opacity: 0.5; }
    .error-msg { background: #fee2e2; color: #991b1b; padding: 10px; border-radius: 8px; font-size: 13px; margin-bottom: 15px; }
  `]
})
export class MateriasPage implements OnInit {
  private supabase = inject(SupabaseService);
  private alertCtrl = inject(AlertController);

  materias = signal<Materia[]>([]);
  cargando = signal(true);
  mostrarForm = signal(false);
  editando = signal<Materia | null>(null);
  guardando = signal(false);
  errorForm = signal<string | null>(null);

  form = signal<any>({ nombre: '' });

  ngOnInit() { this.cargar(); }

  async cargar() {
    this.cargando.set(true);
    try {
      const { data, error } = await (this.supabase as any).supabase
        .from('materias')
        .select('id, nombre, activa, created_at')
        .order('nombre');
      if (error) throw error;
      this.materias.set(data ?? []);
    } catch (err) {
      console.error('Error al cargar materias:', err);
      this.materias.set([]);
    }
    this.cargando.set(false);
  }

  abrirFormulario(m?: Materia) {
    if (m) {
      this.editando.set(m);
      this.form.set({ nombre: m.nombre });
    } else {
      this.editando.set(null);
      this.form.set({ nombre: '' });
    }
    this.errorForm.set(null);
    this.mostrarForm.set(true);
  }

  cerrarForm() { this.mostrarForm.set(false); }

  async guardar() {
    const f = this.form();
    if (!f.nombre.trim()) { this.errorForm.set('El nombre es obligatorio.'); return; }

    this.guardando.set(true);
    this.errorForm.set(null);

    try {
      if (this.editando()) {
        const { error } = await (this.supabase as any).supabase
          .from('materias')
          .update({ nombre: f.nombre.trim() })
          .eq('id', this.editando()!.id);
        if (error) throw error;
      } else {
        const { error } = await (this.supabase as any).supabase
          .from('materias')
          .insert({ nombre: f.nombre.trim() });
        if (error) throw error;
      }
      this.mostrarForm.set(false);
      await this.cargar();
    } catch (err: any) {
      console.error('Error al guardar:', err);
      this.errorForm.set(err.message || 'Error al guardar.');
    }
    this.guardando.set(false);
  }

  async toggleEstado(m: Materia) {
    const nuevo = !m.activa;
    const { error } = await (this.supabase as any).supabase
      .from('materias')
      .update({ activa: nuevo })
      .eq('id', m.id);
    if (!error) this.materias.update(ms => ms.map(x => x.id === m.id ? { ...x, activa: nuevo } : x));
  }

  async eliminar(m: Materia) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar',
      message: `¿Eliminar la materia "${m.nombre}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'confirm', handler: async () => {
          try {
            await (this.supabase as any).supabase.from('materias').delete().eq('id', m.id);
            await this.cargar();
          } catch (err) {
            console.error('Error al eliminar:', err);
          }
        }}
      ]
    });
    await alert.present();
  }
}
