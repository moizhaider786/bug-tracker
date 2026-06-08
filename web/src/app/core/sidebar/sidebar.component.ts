import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { OnInit } from '@angular/core';
import { NonSidebarRoutes } from '../../lib/constants';
import { SidebarService } from '../services/sidebar.service';

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
              <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
            </li>
            <li>
              <a routerLink="/projects" routerLinkActive="active">Projects</a>
            </li>
            @if (authService.hasRole('admin')) {
              <li>
                <a routerLink="/users" routerLinkActive="active">Manage Users</a>
              </li>
            }
          </ul>
        </nav>
        <div class="sidebar-footer">
          <button (click)="logout()" class="logout-btn">Logout</button>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .sidebar {
        width: 200px;
        height: 100vh;
        background-color: #f0f0f0;
        border-right: 1px solid #ccc;
        display: flex;
        flex-direction: column;
        position: fixed;
        left: 0;
        top: 0;
        padding: 10px;
      }
      .sidebar-header {
        border-bottom: 1px solid #ccc;
        margin-bottom: 10px;
      }
      .sidebar-nav ul {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .sidebar-nav li {
        margin-bottom: 5px;
      }
      .sidebar-nav a {
        display: block;
        padding: 5px;
        color: #333;
        text-decoration: none;
      }
      .sidebar-nav a.active {
        font-weight: bold;
        background-color: #ddd;
      }
      .sidebar-footer {
        margin-top: auto;
        border-top: 1px solid #ccc;
        padding-top: 10px;
      }
      .logout-btn {
        width: 100%;
        padding: 5px;
        cursor: pointer;
      }
    `,
  ],
})
export class SidebarComponent implements OnInit {
  authService = inject(AuthService);
  router = inject(Router);
  sidebarService = inject(SidebarService);

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
    this.authService.logout();
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}
