import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { OnInit } from '@angular/core';
import { NonSidebarRoutes } from '../../lib/constants';
import { SidebarService } from '../services/sidebar.service';
import { ModalService } from '../services/modal.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    @if (sidebarService.get()) {
      <div class="sidebar">
        <div class="sidebar-header">
          <h2>Bug Tracker</h2>
        </div>
        <nav class="sidebar-nav">
          <ul>
            <li>
              <a
                routerLink="/"
                routerLinkActive="active"
                [routerLinkActiveOptions]="{ exact: true }"
                >Dashboard</a
              >
            </li>
            <li>
              <a routerLink="/projects" routerLinkActive="active">Projects</a>
            </li>
            <li>
              <a routerLink="/bugs" routerLinkActive="active">Bugs</a>
            </li>
            @if (authService.hasRole('admin')) {
              <li>
                <a routerLink="/users" routerLinkActive="active">Manage Users</a>
              </li>
            }
            <li><a routerLink="/profile" routerLinkActive="active">Profile</a></li>
          </ul>
        </nav>
        <div class="sidebar-footer">
          <button
            (click)="logout()"
            class="logout-btn btn-secondary with-icon"
            style="background: transparent; border-color: #4b5563; color: #d1d5db; justify-content: flex-start; width: 100%;"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .sidebar {
        width: 220px;
        height: 100vh;
        background-color: #1f2937;
        color: white;
        display: flex;
        flex-direction: column;
        position: fixed;
        left: 0;
        top: 0;
        padding: 1rem;
        box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
      }
      .sidebar-header {
        border-bottom: 1px solid #374151;
        margin-bottom: 1rem;
        padding-bottom: 1rem;
      }
      .sidebar-header h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: white;
      }
      .sidebar-nav ul {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .sidebar-nav li {
        margin-bottom: 0.25rem;
      }
      .sidebar-nav a {
        display: block;
        padding: 0.75rem 1rem;
        color: #d1d5db;
        text-decoration: none;
        border-radius: 6px;
        transition:
          background-color 0.2s,
          color 0.2s;
      }
      .sidebar-nav a:hover {
        background-color: #374151;
        color: white;
      }
      .sidebar-nav a.active {
        background-color: #2563eb;
        color: white;
        font-weight: 500;
      }
      .sidebar-footer {
        margin-top: auto;
        border-top: 1px solid #374151;
        padding-top: 1rem;
        padding-bottom: 1rem;
      }
      .logout-btn {
        width: 100%;
        padding: 0.75rem;
        cursor: pointer;
        background-color: transparent;
        color: #d1d5db;
        border: 1px solid #4b5563;
        border-radius: 6px;
        transition:
          background-color 0.2s,
          color 0.2s;
        font-weight: 500;
      }
      .logout-btn:hover {
        background-color: #374151;
        color: white;
      }
    `,
  ],
})
export class SidebarComponent implements OnInit {
  authService = inject(AuthService);
  router = inject(Router);
  sidebarService = inject(SidebarService);
  modalService = inject(ModalService);

  ngOnInit() {
    this.updateSidebar(this.router.url);

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateSidebar(event.urlAfterRedirects);
      });
  }

  private updateSidebar(url: string) {
    const segment = url.split('?')[0].replace(/^\//, '').split('/')[0].toLowerCase();
    this.sidebarService.set(!NonSidebarRoutes.includes(segment));
  }

  logout() {
    this.authService.logout().subscribe({
      error: (error: any) => {
        this.modalService.showError('Error Logging out');
      },
    });
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}
