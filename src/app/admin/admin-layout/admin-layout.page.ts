import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth';

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

  admin = signal<any>(null);
  sidebarAbierto = signal<boolean>(true);

  menuItems = [
    { label: 'Dashboard', icon: '📊', route: '/admin/dashboard' },
    { label: 'Misiones', icon: '📋', route: '/admin/misiones' },
    { label: 'Estudiantes', icon: '👥', route: '/admin/estudiantes' },
    { label: 'Instituciones', icon: '🏫', route: '/admin/instituciones' },
  ];

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
    return this.router.url === route;
  }

  onNavClick() {
    if (window.innerWidth <= 768) {
      this.sidebarAbierto.set(false);
    }
  }
}
