import { Component, input, effect, ElementRef, viewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { RendimientoPorNivel } from '../../../../services/estadisticas.service';

Chart.register(...registerables);

@Component({
  selector: 'app-chart-rendimiento',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-card">
      <h3 class="chart-title">📊 Rendimiento Promedio por Nivel y Grado</h3>
      <div class="chart-container">
        <canvas #chartCanvas></canvas>
      </div>
    </div>
  `,
  styles: [`
    .chart-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.04);
      margin-bottom: 20px;
    }
    .chart-title {
      margin: 0 0 15px 0;
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
    }
    .chart-container {
      position: relative;
      height: 300px;
    }
  `]
})
export class ChartRendimientoComponent implements OnDestroy {
  chartCanvas = viewChild.required<ElementRef<HTMLCanvasElement>>('chartCanvas');
  data = input.required<RendimientoPorNivel[]>();

  private chart: Chart | null = null;

  constructor() {
    effect(() => {
      const datos = this.data();
      if (datos.length > 0) {
        setTimeout(() => this.renderChart(datos), 100);
      }
    });
  }

  private renderChart(data: RendimientoPorNivel[]) {
    if (this.chart) {
      this.chart.destroy();
    }

    const primaria = data.filter(d => d.nivel_educativo === 'Primaria');
    const secundaria = data.filter(d => d.nivel_educativo === 'Secundaria');

    const allGrados = [...new Set(data.map(d => d.grado))].sort();
    const labels = allGrados.map(g => `${g}°`);

    const datasets = [];

    if (primaria.length > 0) {
      datasets.push({
        label: 'Primaria',
        data: allGrados.map(g => {
          const item = primaria.find(p => p.grado === g);
          return item?.promedio_puntaje ?? 0;
        }),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: '#3b82f6',
        borderWidth: 1,
        borderRadius: 4
      });
    }

    if (secundaria.length > 0) {
      datasets.push({
        label: 'Secundaria',
        data: allGrados.map(g => {
          const item = secundaria.find(s => s.grado === g);
          return item?.promedio_puntaje ?? 0;
        }),
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderColor: '#10b981',
        borderWidth: 1,
        borderRadius: 4
      });
    }

    const canvas = this.chartCanvas().nativeElement;
    this.chart = new Chart(canvas, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: { display: true, text: 'Puntaje Promedio (%)' }
          },
          x: {
            title: { display: true, text: 'Grado' }
          }
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }
}
