import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'admin-theme';

  theme = signal<ThemeMode>(this.loadInitial());

  private loadInitial(): ThemeMode {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
    return 'light';
  }

  toggle() {
    this.theme.update(t => t === 'light' ? 'dark' : 'light');
    localStorage.setItem(this.STORAGE_KEY, this.theme());
  }

  isDark(): boolean {
    return this.theme() === 'dark';
  }
}
