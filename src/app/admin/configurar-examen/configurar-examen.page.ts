import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../services/supabase';
import { MATERIAS } from '../../config/game.config';

@Component({
  selector: 'app-configurar-examen',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>⚙️ Configurar Examen</h1>
          @if (mision()) {
            <p class="subtitle">{{ mision()?.titulo }}</p>
          }
        </div>
        <button class="btn-back" routerLink="/admin/misiones">← Volver</button>
      </div>

      @if (cargando()) {
        <div class="loading"><div class="spinner"></div></div>
      }

      @if (!cargando() && mision()) {
        <div class="config-card">
          <h2>Distribución de Preguntas por Materia</h2>
          <p class="hint">Define cuántas preguntas tendrá cada materia en este examen.</p>

          <div class="total-row">
            <label>Total de preguntas:</label>
            <input type="number" [ngModel]="totalPreguntas()" (ngModelChange)="totalPreguntas.set($event)" min="1" max="50">
          </div>

          <div class="materias-grid">
            @for (m of materias; track m) {
              <div class="materia-row">
                <span class="materia-name">{{ m }}</span>
                <div class="materia-controls">
                  <button class="btn-qty" (click)="ajustar(m, -1)" [disabled]="cantidad(m) <= 0">−</button>
                  <span class="qty-value">{{ cantidad(m) }}</span>
                  <button class="btn-qty" (click)="ajustar(m, 1)">+</button>
                </div>
              </div>
            }
          </div>

          <div class="resumen">
            <span [class]="sumar() === totalPreguntas() ? 'valid' : 'invalid'">
              Configurado: {{ sumar() }} / {{ totalPreguntas() }} preguntas
            </span>
          </div>

          @if (error()) { <div class="error-msg">{{ error() }}</div> }
          @if (exito()) { <div class="success-msg">{{ exito() }}</div> }

          <button class="btn-save" (click)="guardar()" [disabled]="guardando()">
            {{ guardando() ? 'Guardando...' : 'Guardar Configuración' }}
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container { max-width: 700px; margin: 0 auto; padding: 30px 20px; font-family: 'Segoe UI', Roboto, sans-serif; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; }
    .page-header h1 { margin: 0; font-size: 22px; font-weight: 700; }
    .subtitle { margin: 4px 0 0 0; color: #64748b; font-size: 14px; }
    .btn-back { background: white; border: 1px solid #e2e8f0; padding: 8px 14px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 13px; }
    .config-card { background: white; border-radius: 12px; border: 1px solid #e2e8f0; padding: 30px; }
    .config-card h2 { margin: 0 0 8px 0; font-size: 18px; }
    .hint { color: #64748b; font-size: 13px; margin: 0 0 20px 0; }
    .total-row { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
    .total-row label { font-weight: 600; font-size: 14px; }
    .total-row input { width: 80px; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 16px; text-align: center; }
    .total-row input:focus { outline: none; border-color: #2563eb; }
    .materias-grid { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
    .materia-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; }
    .materia-name { font-weight: 600; font-size: 14px; }
    .materia-controls { display: flex; align-items: center; gap: 10px; }
    .btn-qty { width: 32px; height: 32px; border-radius: 8px; border: 1px solid #e2e8f0; background: white; font-size: 16px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .btn-qty:hover:not(:disabled) { background: #f1f5f9; }
    .btn-qty:disabled { opacity: 0.3; cursor: not-allowed; }
    .qty-value { font-size: 18px; font-weight: 700; min-width: 30px; text-align: center; }
    .resumen { text-align: center; margin-bottom: 15px; font-weight: 600; }
    .valid { color: #16a34a; }
    .invalid { color: #dc2626; }
    .error-msg { background: #fee2e2; color: #991b1b; padding: 10px; border-radius: 8px; font-size: 13px; margin-bottom: 15px; }
    .success-msg { background: #dcfce7; color: #166534; padding: 10px; border-radius: 8px; font-size: 13px; margin-bottom: 15px; }
    .btn-save { width: 100%; background: #2563eb; color: white; border: none; padding: 14px; border-radius: 8px; font-weight: 700; font-size: 15px; cursor: pointer; }
    .btn-save:disabled { opacity: 0.5; }
    .loading { text-align: center; padding: 40px; }
    .spinner { width: 36px; height: 36px; margin: 0 auto; border: 3px solid #e2e8f0; border-top-color: #2563eb; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class ConfigurarExamenPage implements OnInit {
  private route = inject(ActivatedRoute);
  private supabase = inject(SupabaseService);

  materias = [...MATERIAS];
  mision = signal<any>(null);
  cargando = signal(true);
  guardando = signal(false);
  error = signal<string | null>(null);
  exito = signal<string | null>(null);

  totalPreguntas = signal(20);
  distribucion = signal<Record<string, number>>({});

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.cargar(id);
    this.materias.forEach(m => this.distribucion.update(d => ({ ...d, [m]: 0 })));
  }

  async cargar(id: string) {
    this.cargando.set(true);
    const { data } = await this.supabase.obtenerMisionPorId(id);
    this.mision.set(data);

    if (data?.configuracion_examen) {
      const config = data.configuracion_examen;
      this.totalPreguntas.set(config.total || 20);
      this.materias.forEach(m => {
        this.distribucion.update(d => ({ ...d, [m]: config.distribucion?.[m] || 0 }));
      });
    }
    this.cargando.set(false);
  }

  cantidad(materia: string): number {
    return this.distribucion()[materia] || 0;
  }

  ajustar(materia: string, delta: number) {
    this.distribucion.update(d => ({
      ...d,
      [materia]: Math.max(0, (d[materia] || 0) + delta)
    }));
    this.error.set(null);
    this.exito.set(null);
  }

  sumar(): number {
    return Object.values(this.distribucion()).reduce((a, b) => a + b, 0);
  }

  async guardar() {
    if (this.sumar() !== this.totalPreguntas()) {
      this.error.set(`La suma (${this.sumar()}) debe ser igual al total (${this.totalPreguntas()}).`);
      return;
    }

    if (this.sumar() === 0) {
      this.error.set('Debe configurar al menos una pregunta por materia.');
      return;
    }

    this.guardando.set(true);
    this.error.set(null);

    const config = {
      total: this.totalPreguntas(),
      distribucion: { ...this.distribucion() }
    };

    try {
      const { error: err } = await (this.supabase as any).supabase
        .from('misiones')
        .update({ configuracion_examen: config })
        .eq('id', this.mision().id);

      if (err) throw err;
      this.exito.set('Configuración guardada correctamente.');
    } catch (err: any) {
      this.error.set(err.message || 'Error al guardar.');
    }
    this.guardando.set(false);
  }
}
