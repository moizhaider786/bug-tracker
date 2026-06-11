import { Routes } from '@angular/router';
import { AuthPageComponent } from './features/auth/auth-page.component';
import { DashboardPageComponent } from './features/dashboard/dashboard-page/dashboard-page.component';
import { ProjectsPageComponent } from './features/project/projects-page/projects-page.component';
import { AuthGuard } from './features/auth/auth.guard';
import { ProjectMemberPageComponent } from './features/project/project-member-page/project-member-page.component';
import { ProjectDetailPageComponent } from './features/project/project-detail-page/project-detail-page.component';
import { BugFormPageComponent } from './features/bug/bug-form-page/bug-form-page.component';
import { BugsPageComponent } from './features/bug/bugs-page/bugs-page.component';
import { BugDetailPageComponent } from './features/bug/bug-detail-page/bug-detail-page.component';
import { ProfilePageComponent } from './features/profile/profile-page/profile-page.component';
import { NotFoundPage } from './core/not-found/not-found-page.component';

export const routes: Routes = [
  { path: 'signup', component: AuthPageComponent },
  { path: 'login', component: AuthPageComponent },
  {
    path: '',
    component: DashboardPageComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'projects',
    component: ProjectsPageComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'projects/:id/add-members',
    component: ProjectMemberPageComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'projects/:id/remove-members',
    component: ProjectMemberPageComponent,
    canActivate: [AuthGuard],
  },
  // Bug routes — must come BEFORE projects/:id
  {
    path: 'projects/:projectId/bugs/new',
    component: BugFormPageComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'projects/:projectId/bugs/:bugId/edit',
    component: BugFormPageComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'bugs',
    component: BugsPageComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'bugs/:id',
    component: BugDetailPageComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'projects/:id',
    component: ProjectDetailPageComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'profile',
    component: ProfilePageComponent,
    canActivate: [AuthGuard],
  },
  {
    path: '**',
    component: NotFoundPage,
  },
];
