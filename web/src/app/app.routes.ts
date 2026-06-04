import { Routes } from '@angular/router';
import { AuthPageComponent } from './features/auth/auth-page.component';
import { DashboardPageComponent } from './features/dashboard/dashboard-page/dashboard-page.component';
import { ProjectsPageComponent } from './features/project/projects-page/projects-page.component';
import { AuthGuard } from './features/auth/auth.guard';
export const routes: Routes = [
  {
    path: 'signup',
    component: AuthPageComponent,
  },
  {
    path: 'login',
    component: AuthPageComponent,
  },
  {
    path: "dashboard",
    component: DashboardPageComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'projects',
    component: ProjectsPageComponent,
    canActivate: [AuthGuard]
  }
];
