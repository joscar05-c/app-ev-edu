import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface KpiData {
  label: string;
  value: string | number;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-kpi-cards',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="kpi-grid">
      @for (kpi of kpis(); track kpi.label) {
        <div class="kpi-card" [style.border-left-color]="kpi.color">
          <div class="kpi-icon" [style.background]="kpi.color + '20'" [style.color]="kpi.color">{{ kpi.icon }}</div>
          <div class="kpi-info">
            <span class="kpi-value">{{ kpi.value }}</span>
            <span class="kpi-label">{{ kpi.label }}</span>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 15px;
      margin-bottom: 30px;
    }
    .kpi-card {
      background: white;
      border-radius: 10px;
      padding: 18px;
      display: flex;
      align-items: center;
      gap: 14px;
      border: 1px solid #e2e8f0;
      border-left: 4px solid;
      box-shadow: 0 2px 4px rgba(0,0,0,0.04);
    }
    .kpi-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      flex-shrink: 0;
    }
    .kpi-info {
      display: flex;
      flex-direction: column;
    }
    .kpi-value {
      font-size: 22px;
      font-weight: 700;
      color: #1e293b;
    }
    .kpi-label {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  `]
})
export class KpiCardsComponent {
  kpis = input.required<KpiData[]>();
}
