import { Injectable } from '@angular/core';
import { NIVELES, COLORES_NIVEL, NivelConfig } from '../config/game.config';

@Injectable({ providedIn: 'root' })
export class GamificacionService {

  obtenerNivelPorXp(xp: number): NivelConfig {
    let nivel = NIVELES[0];
    for (const n of NIVELES) {
      if (xp >= n.xpMinimo) {
        nivel = n;
      }
    }
    return nivel;
  }

  obtenerNivelAnterior(xpSinGanar: number): NivelConfig {
    return this.obtenerNivelPorXp(xpSinGanar);
  }

  obtenerXpParaSiguienteNivel(xp: number): number {
    const nivelActual = this.obtenerNivelPorXp(xp);
    const idx = NIVELES.findIndex(n => n.nivel === nivelActual.nivel);
    if (idx < NIVELES.length - 1) {
      return NIVELES[idx + 1].xpMinimo;
    }
    return nivelActual.xpMinimo;
  }

  obtenerProgresoNivel(xp: number): number {
    const nivelActual = this.obtenerNivelPorXp(xp);
    const xpSiguiente = this.obtenerXpParaSiguienteNivel(xp);

    if (xpSiguiente === nivelActual.xpMinimo) {
      return 1;
    }

    const xpEnNivel = xp - nivelActual.xpMinimo;
    const xpNecesario = xpSiguiente - nivelActual.xpMinimo;
    return Math.min(xpEnNivel / xpNecesario, 1);
  }

  obtenerColorNivel(nivel: number): string {
    return COLORES_NIVEL[nivel] || '#94a3b8';
  }
}
