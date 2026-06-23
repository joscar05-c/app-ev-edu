import { Component, input, effect, ElementRef, viewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { RankingIE } from '../../../../services/estadisticas.service';

Chart.register(...registerables);

@Component({
  selector: 'app-chart-ranking',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-card">
      <h3 class="chart-title">🏫 Ranking de Instituciones Educativas</h3>
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
      height: 350px;
    }
  `]
})
export class ChartRankingComponent implements OnDestroy {
  chartCanvas = viewChild.required<ElementRef<HTMLCanvasElement>>('chartCanvas');
  data = input.required<RankingIE[]>();

  private chart: Chart | null = null;

  constructor() {
    effect(() => {
      const datos = this.data();
      if (datos.length > 0) {
        setTimeout(() => this.renderChart(datos), 100);
      }
    });
  }

  private renderChart(data: RankingIE[]) {
    if (this.chart) {
      this.chart.destroy();
    }

    const top = data.slice(0, 10);
    const labels = top.map(ie => ie.ie_nombre.length > 25 ? ie.ie_nombre.substring(0, 25) + '...' : ie.ie_nombre);
    const promedios = top.map(ie => ie.promedio_general ?? 0);

    const colores = promedios.map(p => {
      if (p >= 80) return 'rgba(16, 185, 129, 0.7)';
      if (p >= 60) return 'rgba(245, 158, 11, 0.7)';
      return 'rgba(239, 68, 68, 0.7)';
    });

    const bordes = promedios.map(p => {
      if (p >= 80) return '#10b981';
      if (p >= 60) return '#f59e0b';
      return '#ef4444';
    });

    const canvas = this.chartCanvas().nativeElement;
    this.chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Promedio General (%)',
          data: promedios,
          backgroundColor: colores,
          borderColor: bordes,
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            title: { display: true, text: 'Puntaje Promedio (%)' }
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
