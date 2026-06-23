import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PreguntaError } from '../../../../services/estadisticas.service';

@Component({
  selector: 'app-tabla-preguntas-error',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-card">
      <h3 class="table-title">⚠️ Preguntas con Mayor Índice de Error</h3>

      @if (data().length === 0) {
        <p class="empty-msg">No hay datos de respuestas aún.</p>
      } @else {
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Enunciado</th>
                <th>Misión</th>
                <th>Nivel</th>
                <th>Respuestas</th>
                <th>Errores</th>
                <th>Índice Error</th>
              </tr>
            </thead>
            <tbody>
              @for (p of data(); track p.pregunta_id; let i = $index) {
                <tr>
                  <td class="col-num">{{ i + 1 }}</td>
                  <td class="col-enunciado">{{ p.enunciado | slice:0:60 }}{{ p.enunciado.length > 60 ? '...' : '' }}</td>
                  <td>{{ p.mision_titulo }}</td>
                  <td>
                    <span class="badge" [class]="p.nivel_educativo === 'Primaria' ? 'badge-blue' : 'badge-green'">
                      {{ p.nivel_educativo }} {{ p.mision_grado }}°
                    </span>
                  </td>
                  <td class="col-center">{{ p.total_respuestas }}</td>
                  <td class="col-center col-error">{{ p.total_errores }}</td>
                  <td class="col-center">
                    <span class="error-pct" [class.high]="p.indice_error_pct >= 70" [class.mid]="p.indice_error_pct >= 40 && p.indice_error_pct < 70">
                      {{ p.indice_error_pct }}%
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .table-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.04);
      margin-bottom: 20px;
    }
    .table-title {
      margin: 0 0 15px 0;
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
    }
    .empty-msg {
      color: #94a3b8;
      font-style: italic;
      text-align: center;
      padding: 30px;
    }
    .table-wrapper {
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th {
      background: #f8fafc;
      padding: 10px 12px;
      text-align: left;
      font-weight: 600;
      color: #475569;
      border-bottom: 2px solid #e2e8f0;
      white-space: nowrap;
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }
    tr:hover td {
      background: #f8fafc;
    }
    .col-num { text-align: center; font-weight: 600; color: #94a3b8; }
    .col-enunciado { max-width: 250px; }
    .col-center { text-align: center; }
    .col-error { color: #ef4444; font-weight: 600; }
    .badge {
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      white-space: nowrap;
    }
    .badge-blue { background: #dbeafe; color: #1d4ed8; }
    .badge-green { background: #dcfce7; color: #166534; }
    .error-pct {
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
    }
    .error-pct.high { background: #fee2e2; color: #991b1b; }
    .error-pct.mid { background: #fef3c7; color: #92400e; }
  `]
})
export class TablaPreguntasErrorComponent {
  data = input.required<PreguntaError[]>();
}
