import { Component, inject, signal, OnInit } from '@angular/core';
import { AuthFormComponent } from './auth-form/auth-form.component';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-auth-page',
  imports: [AuthFormComponent],
  template: `
    <div class="page-container">
      <h1>Welcome to Bug Tracker</h1>
      <app-auth-form [isSignupForm]="isSignupForm()"></app-auth-form>
    </div>
  `,
  styles: [
    `
      .page-container {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding-top: 5rem;
        background-color: var(--color-bg);
      }

      h1 {
        margin-bottom: 1.5rem;
        color: var(--color-text);
        font-weight: 600;
      }
    `,
  ],
})
export class AuthPageComponent implements OnInit {
  private activatedRoute = inject(ActivatedRoute);
  isSignupForm = signal<boolean>(true);

  ngOnInit() {
    this.activatedRoute.url.subscribe({
      next: (url) => {
        console.log(url);
        this.isSignupForm.set(url[0].path.toLowerCase() === 'signup' ? true : false);
      },
    });
  }
}
