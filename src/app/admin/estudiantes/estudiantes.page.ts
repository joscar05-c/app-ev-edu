import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { SupabaseService } from '../../services/supabase';

interface EstudianteRow {
  id: string;
  nombre_completo: string;
  dni: string;
  grado: number;
  seccion: string;
  xp: number;
  rango_nivel: number;
  rol: string;
  ie_id: string;
  ie_nombre?: string;
}

interface Institucion {
  id: string;
  nombre: string;
  nivel: string;
}

@Component({
  selector: 'app-estudiantes',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>👥 Gestión de Estudiantes</h1>
        <button class="btn-primary" (click)="abrirFormulario()">+ Nuevo Estudiante</button>
      </div>

      <div class="filters">
        <select [(ngModel)]="filtroNivel" (change)="filtrar()">
          <option value="">Todos los niveles</option>
          <option value="Primaria">Primaria</option>
          <option value="Secundaria">Secundaria</option>
        </select>
        <select [(ngModel)]="filtroIe" (change)="filtrar()">
          <option value="">Todas las IEs</option>
          @for (ie of instituciones(); track ie.id) {
            <option [value]="ie.id">{{ ie.nombre }}</option>
          }
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
            <div class="col-ie">Institución</div>
            <div class="col-grado">Grado</div>
            <div class="col-xp">XP</div>
            <div class="col-actions">Acciones</div>
          </div>
          <div class="table-body">
            @for (e of estudiantesFiltrados(); track e.id) {
              <div class="table-row">
                <div class="col-name"><strong>{{ e.nombre_completo }}</strong></div>
                <div class="col-dni">{{ e.dni }}</div>
                <div class="col-ie">{{ e.ie_nombre || '—' }}</div>
                <div class="col-grado">{{ e.grado }}° {{ e.seccion }}</div>
                <div class="col-xp">⭐ {{ e.xp }}</div>
                <div class="col-actions">
                  <button class="btn-icon" (click)="abrirFormulario(e)">✏️</button>
                  <button class="btn-icon danger" (click)="eliminar(e)">🗑️</button>
                </div>
              </div>
            }
            @if (estudiantesFiltrados().length === 0) {
              <div class="empty-row">No se encontraron estudiantes.</div>
            }
          </div>
        </div>
      }

      @if (mostrarForm()) {
        <div class="modal-overlay" (click)="cerrarForm()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <h2>{{ editando() ? 'Editar' : 'Nuevo' }} Estudiante</h2>

            <div class="form-grid">
              <div class="input-group full">
                <label>Nombre Completo</label>
                <input type="text" [(ngModel)]="form().nombre_completo" placeholder="Juan Pérez">
              </div>
              <div class="input-group">
                <label>DNI</label>
                <input type="text" [(ngModel)]="form().dni" placeholder="71234567" maxlength="8">
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
              <div class="input-group" *ngIf="!editando()">
                <label>Rol</label>
                <select [(ngModel)]="form().rol">
                  <option value="estudiante">Estudiante</option>
                  <option value="admin">Admin</option>
                </select>
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
    .page-container { max-width: 1100px; margin: 0 auto; padding: 30px 20px; font-family: 'Segoe UI', Roboto, sans-serif; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .page-header h1 { margin: 0; font-size: 22px; font-weight: 700; }
    .btn-primary { background: #2563eb; color: white; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .filters { display: flex; gap: 10px; margin-bottom: 20px; }
    .filters select { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; background: white; }
    .table-card { background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
    .table-header { display: grid; grid-template-columns: 2fr 1fr 1.5fr 0.8fr 0.7fr 0.8fr; background: #f1f5f9; padding: 12px 16px; font-weight: 600; font-size: 13px; color: #64748b; }
    .table-row { display: grid; grid-template-columns: 2fr 1fr 1.5fr 0.8fr 0.7fr 0.8fr; padding: 12px 16px; align-items: center; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .table-row:hover { background: #f8fafc; }
    .empty-row { padding: 20px; text-align: center; color: #94a3b8; }
    .col-actions { display: flex; gap: 6px; }
    .btn-icon { background: transparent; border: 1px solid #e2e8f0; border-radius: 6px; padding: 5px 8px; cursor: pointer; }
    .btn-icon.danger:hover { background: #fee2e2; }
    .loading { text-align: center; padding: 40px; }
    .spinner { width: 36px; height: 36px; margin: 0 auto; border: 3px solid #e2e8f0; border-top-color: #2563eb; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; justify-content: center; align-items: center; }
    .modal-card { background: white; border-radius: 16px; padding: 30px; width: 90%; max-width: 550px; max-height: 90vh; overflow-y: auto; }
    .modal-card h2 { margin: 0 0 20px 0; font-size: 20px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
    .input-group.full { grid-column: 1 / -1; }
    .input-group label { display: block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 6px; }
    .input-group input, .input-group select { width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; box-sizing: border-box; }
    .input-group input:focus, .input-group select:focus { outline: none; border-color: #2563eb; }
    .form-actions { display: flex; gap: 10px; justify-content: flex-end; }
    .btn-cancel { background: #f1f5f9; border: 1px solid #e2e8f0; padding: 10px 18px; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .btn-save { background: #2563eb; color: white; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn-save:disabled { opacity: 0.5; }
    .error-msg { background: #fee2e2; color: #991b1b; padding: 10px; border-radius: 8px; font-size: 13px; margin-bottom: 15px; }
    @media (max-width: 768px) { .form-grid { grid-template-columns: 1fr; } .table-header, .table-row { grid-template-columns: 1fr auto; } .col-dni, .col-ie, .col-grado, .col-xp { display: none; } }
  `]
})
export class EstudiantesPage implements OnInit {
  private supabase = inject(SupabaseService);
  private alertCtrl = inject(AlertController);

  estudiantes = signal<EstudianteRow[]>([]);
  instituciones = signal<Institucion[]>([]);
  cargando = signal(true);
  mostrarForm = signal(false);
  editando = signal<EstudianteRow | null>(null);
  guardando = signal(false);
  errorForm = signal<string | null>(null);

  filtroNivel = '';
  filtroIe = '';

  form = signal<any>({ nombre_completo: '', dni: '', ie_id: '', grado: 1, seccion: 'A', rol: 'estudiante' });

  estudiantesFiltrados = signal<EstudianteRow[]>([]);

  ngOnInit() { this.cargar(); }

  async cargar() {
    this.cargando.set(true);
    try {
      const [estRes, ieRes] = await Promise.all([
        (this.supabase as any).supabase
          .from('estudiantes')
          .select('*, instituciones_educativas!inner(nombre)')
          .order('nombre_completo'),
        (this.supabase as any).supabase
          .from('instituciones_educativas')
          .select('id, nombre, nivel')
          .order('nombre')
      ]);

      const estudiantes = (estRes.data ?? []).map((e: any) => ({
        ...e,
        ie_nombre: e.instituciones_educativas?.nombre
      }));

      this.estudiantes.set(estudiantes);
      this.instituciones.set(ieRes.data ?? []);
      this.filtrar();
    } catch {
      this.estudiantes.set([]);
    }
    this.cargando.set(false);
  }

  filtrar() {
    let filtered = this.estudiantes();
    if (this.filtroNivel) {
      const ieIds = this.instituciones().filter(ie => ie.nivel === this.filtroNivel).map(ie => ie.id);
      filtered = filtered.filter(e => ieIds.includes(e.ie_id));
    }
    if (this.filtroIe) {
      filtered = filtered.filter(e => e.ie_id === this.filtroIe);
    }
    this.estudiantesFiltrados.set(filtered);
  }

  abrirFormulario(e?: EstudianteRow) {
    if (e) {
      this.editando.set(e);
      this.form.set({ nombre_completo: e.nombre_completo, dni: e.dni, ie_id: e.ie_id, grado: e.grado, seccion: e.seccion, rol: e.rol });
    } else {
      this.editando.set(null);
      this.form.set({ nombre_completo: '', dni: '', ie_id: '', grado: 1, seccion: 'A', rol: 'estudiante' });
    }
    this.errorForm.set(null);
    this.mostrarForm.set(true);
  }

  cerrarForm() { this.mostrarForm.set(false); }

  async guardar() {
    const f = this.form();
    if (!f.nombre_completo.trim()) { this.errorForm.set('El nombre es obligatorio.'); return; }
    if (!f.dni.trim() || f.dni.length < 8) { this.errorForm.set('El DNI debe tener 8 dígitos.'); return; }
    if (!f.ie_id) { this.errorForm.set('Selecciona una institución.'); return; }

    this.guardando.set(true);
    this.errorForm.set(null);

    try {
      const payload: any = {
        nombre_completo: f.nombre_completo,
        dni: f.dni,
        ie_id: f.ie_id,
        grado: Number(f.grado),
        seccion: f.seccion,
        rol: f.rol
      };

      if (!this.editando()) {
        payload.xp = 0;
        payload.rango_nivel = 1;
      }

      if (this.editando()) {
        const { error } = await (this.supabase as any).supabase
          .from('estudiantes')
          .update(payload)
          .eq('id', this.editando()!.id);
        if (error) throw error;
      } else {
        const { error } = await (this.supabase as any).supabase
          .from('estudiantes')
          .insert(payload);
        if (error) throw error;
      }
      this.mostrarForm.set(false);
      await this.cargar();
    } catch (err: any) {
      this.errorForm.set(err.message || 'Error al guardar.');
    }
    this.guardando.set(false);
  }

  async eliminar(e: EstudianteRow) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar', message: `¿Eliminar a "${e.nombre_completo}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'confirm', handler: async () => {
          try {
            await (this.supabase as any).supabase.from('estudiantes').delete().eq('id', e.id);
            await this.cargar();
          } catch {}
        }}
      ]
    });
    await alert.present();
  }
}
