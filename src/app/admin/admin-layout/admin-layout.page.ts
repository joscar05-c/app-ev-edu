import { Component, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.page.html',
  styleUrls: ['./admin-layout.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule, RouterOutlet]
})
export class AdminLayoutPage {
  private authService = inject(AuthService);
  private router = inject(Router);
  themeService = inject(ThemeService);

  admin = signal<any>(null);
  sidebarAbierto = signal<boolean>(window.innerWidth > 768);

  menuItems = [
    { label: 'Dashboard', icon: '📊', route: '/admin/dashboard' },
    { label: 'Misiones', icon: '📋', route: '/admin/misiones' },
    { label: 'Usuarios', icon: '👤', route: '/admin/usuarios' },
    { label: 'Estudiantes', icon: '👥', route: '/admin/estudiantes' },
    { label: 'Instituciones', icon: '🏫', route: '/admin/instituciones' },
    { label: 'Materias', icon: '📚', route: '/admin/materias' },
  ];

  constructor() {
    effect(() => {
      const mode = this.themeService.theme();
      document.documentElement.setAttribute('data-admin-theme', mode);
    });
  }

  ngOnInit() {
    this.admin.set(this.authService.obtenerSesion());
  }

  toggleSidebar() {
    this.sidebarAbierto.update(v => !v);
  }

  cerrarSesion() {
    this.authService.cerrarSesion();
    this.router.navigate(['/login']);
  }

  isActive(route: string): boolean {
    return this.router.url.startsWith(route);
  }

  onNavClick() {
    if (window.innerWidth <= 768) {
      this.sidebarAbierto.set(false);
    }
  }
}
