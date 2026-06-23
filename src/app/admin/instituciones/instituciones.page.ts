import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ModalController } from '@ionic/angular';
import { SupabaseService } from '../../services/supabase';

interface Institucion {
  id: string;
  nombre: string;
  codigo_modular: string;
  nivel: string;
  distrito: string;
  provincia: string;
  region: string;
}

@Component({
  selector: 'app-instituciones',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>🏫 Instituciones Educativas</h1>
        <button class="btn-primary" (click)="abrirFormulario()">+ Nueva Institución</button>
      </div>

      @if (cargando()) {
        <div class="loading"><div class="spinner"></div></div>
      }

      @if (!cargando() && instituciones().length > 0) {
        <div class="table-card">
          <div class="table-header">
            <div class="col-name">Nombre</div>
            <div class="col-codigo">Código</div>
            <div class="col-nivel">Nivel</div>
            <div class="col-distrito">Distrito</div>
            <div class="col-actions">Acciones</div>
          </div>
          <div class="table-body">
            @for (ie of instituciones(); track ie.id) {
              <div class="table-row">
                <div class="col-name"><strong>{{ ie.nombre }}</strong></div>
                <div class="col-codigo">{{ ie.codigo_modular }}</div>
                <div class="col-nivel"><span class="badge" [class]="ie.nivel === 'Primaria' ? 'badge-blue' : 'badge-green'">{{ ie.nivel }}</span></div>
                <div class="col-distrito">{{ ie.distrito }}</div>
                <div class="col-actions">
                  <button class="btn-icon" (click)="abrirFormulario(ie)">✏️</button>
                  <button class="btn-icon danger" (click)="eliminar(ie)">🗑️</button>
                </div>
              </div>
            }
          </div>
        </div>
      } @else if (!cargando()) {
        <div class="empty">No hay instituciones registradas.</div>
      }

      @if (mostrarForm()) {
        <div class="modal-overlay" (click)="cerrarForm()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <h2>{{ editando() ? 'Editar' : 'Nueva' }} Institución</h2>

            <div class="form-grid">
              <div class="input-group">
                <label>Nombre</label>
                <input type="text" [(ngModel)]="form().nombre" placeholder="IE San Martín">
              </div>
              <div class="input-group">
                <label>Código Modular</label>
                <input type="text" [(ngModel)]="form().codigo_modular" placeholder="1234567">
              </div>
              <div class="input-group">
                <label>Nivel</label>
                <select [(ngModel)]="form().nivel">
                  <option value="Primaria">Primaria</option>
                  <option value="Secundaria">Secundaria</option>
                </select>
              </div>
              <div class="input-group">
                <label>Distrito</label>
                <input type="text" [(ngModel)]="form().distrito" placeholder="Distrito">
              </div>
              <div class="input-group">
                <label>Provincia</label>
                <input type="text" [(ngModel)]="form().provincia" placeholder="Provincia">
              </div>
              <div class="input-group">
                <label>Región</label>
                <input type="text" [(ngModel)]="form().region" placeholder="Región">
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
    .page-container { max-width: 1000px; margin: 0 auto; padding: 30px 20px; font-family: 'Segoe UI', Roboto, sans-serif; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
    .page-header h1 { margin: 0; font-size: 22px; font-weight: 700; }
    .btn-primary { background: #2563eb; color: white; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .table-card { background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
    .table-header { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 0.8fr; background: #f1f5f9; padding: 12px 16px; font-weight: 600; font-size: 13px; color: #64748b; }
    .table-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 0.8fr; padding: 12px 16px; align-items: center; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .table-row:hover { background: #f8fafc; }
    .badge { padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
    .badge-blue { background: #dbeafe; color: #1d4ed8; }
    .badge-green { background: #dcfce7; color: #166534; }
    .col-actions { display: flex; gap: 6px; }
    .btn-icon { background: transparent; border: 1px solid #e2e8f0; border-radius: 6px; padding: 5px 8px; cursor: pointer; }
    .btn-icon.danger:hover { background: #fee2e2; }
    .loading { text-align: center; padding: 40px; }
    .spinner { width: 36px; height: 36px; margin: 0 auto; border: 3px solid #e2e8f0; border-top-color: #2563eb; border-radius: 50%; animation: spin 1s linear infinite; }
    .empty { text-align: center; padding: 40px; color: #94a3b8; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; justify-content: center; align-items: center; }
    .modal-card { background: white; border-radius: 16px; padding: 30px; width: 90%; max-width: 550px; max-height: 90vh; overflow-y: auto; }
    .modal-card h2 { margin: 0 0 20px 0; font-size: 20px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
    .input-group label { display: block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 6px; }
    .input-group input, .input-group select { width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; box-sizing: border-box; }
    .input-group input:focus, .input-group select:focus { outline: none; border-color: #2563eb; }
    .form-actions { display: flex; gap: 10px; justify-content: flex-end; }
    .btn-cancel { background: #f1f5f9; border: 1px solid #e2e8f0; padding: 10px 18px; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .btn-save { background: #2563eb; color: white; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn-save:disabled { opacity: 0.5; }
    .error-msg { background: #fee2e2; color: #991b1b; padding: 10px; border-radius: 8px; font-size: 13px; margin-bottom: 15px; }
    @media (max-width: 768px) { .form-grid { grid-template-columns: 1fr; } .table-header, .table-row { grid-template-columns: 1fr auto; } .col-codigo, .col-nivel, .col-distrito { display: none; } }
  `]
})
export class InstitucionesPage implements OnInit {
  private supabase = inject(SupabaseService);
  private alertCtrl = inject(AlertController);

  instituciones = signal<Institucion[]>([]);
  cargando = signal(true);
  mostrarForm = signal(false);
  editando = signal<Institucion | null>(null);
  guardando = signal(false);
  errorForm = signal<string | null>(null);

  form = signal<any>({ nombre: '', codigo_modular: '', nivel: 'Secundaria', distrito: '', provincia: '', region: '' });

  ngOnInit() { this.cargar(); }

  async cargar() {
    this.cargando.set(true);
    try {
      const { data, error } = await (this.supabase as any).supabase
        .from('instituciones_educativas')
        .select('*')
        .order('nombre');
      if (error) throw error;
      this.instituciones.set(data ?? []);
    } catch { this.instituciones.set([]); }
    this.cargando.set(false);
  }

  abrirFormulario(ie?: Institucion) {
    if (ie) {
      this.editando.set(ie);
      this.form.set({ ...ie });
    } else {
      this.editando.set(null);
      this.form.set({ nombre: '', codigo_modular: '', nivel: 'Secundaria', distrito: '', provincia: '', region: '' });
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
          .from('instituciones_educativas')
          .update(f)
          .eq('id', this.editando()!.id);
        if (error) throw error;
      } else {
        const { error } = await (this.supabase as any).supabase
          .from('instituciones_educativas')
          .insert(f);
        if (error) throw error;
      }
      this.mostrarForm.set(false);
      await this.cargar();
    } catch (err: any) {
      this.errorForm.set(err.message || 'Error al guardar.');
    }
    this.guardando.set(false);
  }

  async eliminar(ie: Institucion) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar', message: `¿Eliminar "${ie.nombre}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'confirm', handler: async () => {
          try {
            await (this.supabase as any).supabase
              .from('instituciones_educativas')
              .delete()
              .eq('id', ie.id);
            await this.cargar();
          } catch {}
        }}
      ]
    });
    await alert.present();
  }
}
