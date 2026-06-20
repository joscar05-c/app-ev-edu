import { Injectable } from '@angular/core';

const SESSION_KEY = 'academia_quest_session';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  guardarSesion(usuario: any): void {
    localStorage.setItem(SESSION_KEY, JSON.stringify(usuario));
  }

  obtenerSesion(): any | null {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  cerrarSesion(): void {
    localStorage.removeItem(SESSION_KEY);
  }

  estaLogueado(): boolean {
    return this.obtenerSesion() !== null;
  }

  esAdmin(): boolean {
    const user = this.obtenerSesion();
    return user?.rol === 'admin';
  }

  esEstudiante(): boolean {
    const user = this.obtenerSesion();
    return user?.rol === 'estudiante';
  }
}
