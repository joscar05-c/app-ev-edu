import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { SupabaseService } from '../../services/supabase';

interface UsuarioRow {
  id: string;
  dni: string;
  nombre_completo: string;
  rol: string;
  created_at: string;
}

interface Institucion {
  id: string;
  nombre: string;
  nivel: string;
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>👤 Gestión de Usuarios</h1>
        <button class="btn-primary" (click)="abrirFormulario()">+ Nuevo Usuario</button>
      </div>

      <div class="filters">
        <select [(ngModel)]="filtroRol" (change)="filtrar()">
          <option value="">Todos los roles</option>
          <option value="admin">Admin</option>
          <option value="profesor">Profesor</option>
          <option value="estudiante">Estudiante</option>
        </select>
      </div>

      @if (cargando()) {
        <div class="loading"><div class="spinner"></div></div>
      }

      @if (!cargando()) {
        <div class="table-card">
          <div class="table-header">
            <div class="col-name">Nombre</div>
            <div class="col-dni">DNI</div>
            <div class="col-rol">Rol</div>
            <div class="col-date">Creado</div>
            <div class="col-actions">Acciones</div>
          </div>
          <div class="table-body">
            @for (u of usuariosFiltrados(); track u.id) {
              <div class="table-row">
                <div class="col-name"><strong>{{ u.nombre_completo }}</strong></div>
                <div class="col-dni">{{ u.dni }}</div>
                <div class="col-rol">
                  <span class="badge" [class]="u.rol === 'admin' ? 'badge-red' : u.rol === 'profesor' ? 'badge-blue' : 'badge-green'">
                    {{ u.rol }}
                  </span>
                </div>
                <div class="col-date">{{ u.created_at | date:'dd/MM/yyyy' }}</div>
                <div class="col-actions">
                  <button class="btn-icon" (click)="abrirFormulario(u)" title="Editar">✏️</button>
                  <button class="btn-icon danger" (click)="eliminar(u)" title="Eliminar">🗑️</button>
                </div>
              </div>
            }
            @if (usuariosFiltrados().length === 0) {
              <div class="empty-row">No se encontraron usuarios.</div>
            }
          </div>
        </div>
      }

      @if (mostrarForm()) {
        <div class="modal-overlay" (click)="cerrarForm()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <h2>{{ editando() ? 'Editar' : 'Nuevo' }} Usuario</h2>

            <div class="form-grid">
              <div class="input-group full">
                <label>Nombre Completo</label>
                <input type="text" [(ngModel)]="form().nombre_completo" placeholder="Juan Pérez">
              </div>
              <div class="input-group">
                <label>DNI</label>
                <input type="text" [(ngModel)]="form().dni" placeholder="71234567" maxlength="8" [disabled]="!!editando()">
              </div>
              <div class="input-group">
                <label>Rol</label>
                <select [(ngModel)]="form().rol" [disabled]="!!editando()">
                  <option value="estudiante">Estudiante</option>
                  <option value="admin">Admin</option>
                  <option value="profesor">Profesor</option>
                </select>
              </div>

              @if (form().rol === 'estudiante') {
                <div class="input-group full section-divider">
                  <span>Datos de Estudiante</span>
                </div>
                <div class="input-group">
                  <label>Institución Educativa</label>
                  <select [(ngModel)]="form().ie_id">
                    <option value="">Seleccionar IE</option>
                    @for (ie of instituciones(); track ie.id) {
                      <option [value]="ie.id">{{ ie.nombre }} ({{ ie.nivel }})</option>
                    }
                  </select>
                </div>
                <div class="input-group">
                  <label>Grado</label>
                  <select [(ngModel)]="form().grado">
                    @for (g of [1,2,3,4,5,6]; track g) {
                      <option [value]="g">{{ g }}°</option>
                    }
                  </select>
                </div>
                <div class="input-group">
                  <label>Sección</label>
                  <input type="text" [(ngModel)]="form().seccion" placeholder="A" maxlength="2">
                </div>
              }
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
    .page-container { max-width: 1100px; margin: 0 auto; padding: 30px 20px; font-family: 'Segoe UI', Roboto, sans-serif; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
    .page-header h1 { margin: 0; font-size: 22px; font-weight: 700; color: var(--admin-text); }
    .btn-primary { background: var(--admin-primary); color: white; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .filters { display: flex; gap: 10px; margin-bottom: 20px; }
    .filters select { padding: 8px 12px; border: 1px solid var(--admin-border); border-radius: 8px; font-size: 13px; background: var(--admin-card); color: var(--admin-text); }
    .table-card { background: var(--admin-card); border-radius: 12px; border: 1px solid var(--admin-border); overflow: hidden; }
    .table-header { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 0.8fr; background: var(--admin-table-header-bg); padding: 12px 16px; font-weight: 600; font-size: 13px; color: var(--admin-text-light); }
    .table-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 0.8fr; padding: 12px 16px; align-items: center; border-bottom: 1px solid var(--admin-border); font-size: 14px; }
    .table-row:hover { background: var(--admin-hover); }
    .col-name strong { color: var(--admin-text); }
    .empty-row { padding: 20px; text-align: center; color: var(--admin-text-light); }
    .badge { padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
    .badge-red { background: #fee2e2; color: #991b1b; }
    .badge-blue { background: #dbeafe; color: #1d4ed8; }
    .badge-green { background: #dcfce7; color: #166534; }
    .col-actions { display: flex; gap: 6px; }
    .btn-icon { background: var(--admin-card); border: 1px solid var(--admin-border); border-radius: 6px; padding: 5px 8px; cursor: pointer; font-size: 14px; transition: all 0.2s; }
    .btn-icon:hover { background: var(--admin-hover); }
    .btn-icon.danger:hover { background: #fee2e2; }
    .loading { text-align: center; padding: 40px; }
    .spinner { width: 36px; height: 36px; margin: 0 auto; border: 3px solid var(--admin-spinner-track, #e2e8f0); border-top-color: var(--admin-primary, #2563eb); border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; justify-content: center; align-items: center; }
    .modal-card { background: var(--admin-card); border-radius: 16px; padding: 30px; width: 90%; max-width: 550px; max-height: 90vh; overflow-y: auto; border: 1px solid var(--admin-border); }
    .modal-card h2 { margin: 0 0 20px 0; font-size: 20px; color: var(--admin-text); }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
    .input-group.full { grid-column: 1 / -1; }
    .input-group label { display: block; font-size: 12px; font-weight: 600; color: var(--admin-text-light); margin-bottom: 6px; }
    .input-group input, .input-group select { width: 100%; padding: 10px; border: 1px solid var(--admin-border); border-radius: 8px; font-size: 14px; box-sizing: border-box; background: var(--admin-card); color: var(--admin-text); }
    .input-group input:focus, .input-group select:focus { outline: none; border-color: var(--admin-primary); }
    .input-group input:disabled, .input-group select:disabled { opacity: 0.5; cursor: not-allowed; }
    .section-divider { grid-column: 1 / -1; padding: 8px 0 0 0; border-top: 1px solid var(--admin-border); margin-top: 5px; }
    .section-divider span { font-weight: 700; font-size: 14px; color: var(--admin-primary); }
    .form-actions { display: flex; gap: 10px; justify-content: flex-end; }
    .btn-cancel { background: var(--admin-hover); border: 1px solid var(--admin-border); color: var(--admin-text); padding: 10px 18px; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .btn-save { background: var(--admin-primary); color: white; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn-save:disabled { opacity: 0.5; }
    .error-msg { background: #fee2e2; color: #991b1b; padding: 10px; border-radius: 8px; font-size: 13px; margin-bottom: 15px; }
    @media (max-width: 768px) { .form-grid { grid-template-columns: 1fr; } .table-header, .table-row { grid-template-columns: 1fr auto; } .col-dni, .col-rol, .col-date { display: none; } }
  `]
})
export class UsuariosPage implements OnInit {
  private supabase = inject(SupabaseService);
  private alertCtrl = inject(AlertController);

  usuarios = signal<UsuarioRow[]>([]);
  instituciones = signal<Institucion[]>([]);
  cargando = signal(true);
  mostrarForm = signal(false);
  editando = signal<UsuarioRow | null>(null);
  guardando = signal(false);
  errorForm = signal<string | null>(null);

  filtroRol = '';
  usuariosFiltrados = signal<UsuarioRow[]>([]);

  form = signal<any>({ nombre_completo: '', dni: '', rol: 'estudiante', ie_id: '', grado: 1, seccion: 'A' });

  ngOnInit() { this.cargar(); }

  async cargar() {
    this.cargando.set(true);
    try {
      const [usRes, ieRes] = await Promise.all([
        (this.supabase as any).supabase
          .from('usuarios')
          .select('id, dni, nombre_completo, rol, created_at')
          .order('created_at', { ascending: false }),
        (this.supabase as any).supabase
          .from('instituciones_educativas')
          .select('id, nombre, nivel')
          .order('nombre')
      ]);

      if (usRes.error) {
        console.error('Error al cargar usuarios:', usRes.error);
      }
      this.usuarios.set(usRes.data ?? []);
      this.instituciones.set(ieRes.data ?? []);
      this.filtrar();
    } catch (err) {
      console.error('Error inesperado:', err);
      this.usuarios.set([]);
    }
    this.cargando.set(false);
  }

  filtrar() {
    let filtered = this.usuarios();
    if (this.filtroRol) {
      filtered = filtered.filter(u => u.rol === this.filtroRol);
    }
    this.usuariosFiltrados.set(filtered);
  }

  abrirFormulario(u?: UsuarioRow) {
    if (u) {
      this.editando.set(u);
      this.form.set({ nombre_completo: u.nombre_completo, dni: u.dni, rol: u.rol, ie_id: '', grado: 1, seccion: 'A' });
    } else {
      this.editando.set(null);
      this.form.set({ nombre_completo: '', dni: '', rol: 'estudiante', ie_id: '', grado: 1, seccion: 'A' });
    }
    this.errorForm.set(null);
    this.mostrarForm.set(true);
  }

  cerrarForm() { this.mostrarForm.set(false); }

  async guardar() {
    const f = this.form();
    if (!f.nombre_completo.trim()) { this.errorForm.set('El nombre es obligatorio.'); return; }
    if (!f.dni.trim() || f.dni.length < 8) { this.errorForm.set('El DNI debe tener 8 dígitos.'); return; }

    if (f.rol === 'estudiante') {
      if (!f.ie_id) { this.errorForm.set('Selecciona una institución.'); return; }
    }

    this.guardando.set(true);
    this.errorForm.set(null);

    try {
      if (this.editando()) {
        const { error } = await (this.supabase as any).supabase
          .from('usuarios')
          .update({ nombre_completo: f.nombre_completo })
          .eq('id', this.editando()!.id);
        if (error) throw error;
      } else {
        const usuarioPayload: any = {
          nombre_completo: f.nombre_completo,
          dni: f.dni,
          rol: f.rol
        };

        const { data: newUsuario, error: errUsuario } = await (this.supabase as any).supabase
          .from('usuarios')
          .insert(usuarioPayload)
          .select()
          .single();
        if (errUsuario) throw errUsuario;

        if (f.rol === 'estudiante' && newUsuario) {
          const { error: errEst } = await (this.supabase as any).supabase
            .from('estudiantes')
            .insert({
              id: newUsuario.id,
              dni: f.dni,
              nombre_completo: f.nombre_completo,
              ie_id: f.ie_id,
              grado: Number(f.grado),
              seccion: f.seccion,
              xp: 0,
              rango_nivel: 1
            });
          if (errEst) throw errEst;
        }
      }
      this.mostrarForm.set(false);
      await this.cargar();
    } catch (err: any) {
      console.error('Error al guardar:', err);
      this.errorForm.set(err.message || 'Error al guardar.');
    }
    this.guardando.set(false);
  }

  async eliminar(u: UsuarioRow) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar',
      message: `¿Eliminar al usuario "${u.nombre_completo}"?${u.rol === 'estudiante' ? ' También se eliminará su registro de estudiante.' : ''}`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'confirm', handler: async () => {
          try {
            if (u.rol === 'estudiante') {
              await (this.supabase as any).supabase.from('estudiantes').delete().eq('id', u.id);
            }
            await (this.supabase as any).supabase.from('usuarios').delete().eq('id', u.id);
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
