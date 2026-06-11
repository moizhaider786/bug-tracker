import { Component, input, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {Router} from '@angular/router';


import { UserRoles } from '../../../types/types';
import { AuthService } from '../../../core/services/auth.service';
import { SignupDto } from '../../../core/dtos/auth/signup.dto';
import { ModalService } from '../../../core/services/modal.service';

interface IAuthForm {
  name: string | null;
  email: string | null;
  role: UserRoles | null;
  password: string | null;
  confirmPassword: string | null;
}

@Component({
  selector: 'app-auth-form',
  imports: [FormsModule, RouterLink],
  templateUrl: './auth-form.component.html',
  styleUrl: './auth-form.component.css',
})
export class AuthFormComponent {
  private router = inject(Router);
  authService = inject(AuthService);
  modalService = inject(ModalService);
  userRoles = Object.values(UserRoles);
  isSignupForm = input<boolean>();
  formData: IAuthForm = {
    name: null,
    email: null,
    role: null,
    password: null,
    confirmPassword: null,
  };
  submitted = signal<boolean>(false);
  onSubmit() {
    if (this.submitted()) return;
    this.submitted.set(true);
    if (this.isSignupForm()) {
      const { confirmPassword, ...signupData } = this.formData;
      this.authService.signup(signupData as SignupDto).subscribe({
        next: (res) => {
          this.modalService.showSuccess('Signup successful');
          Object.keys(this.formData).forEach((key) => ((this.formData as any)[key] = null));
          this.submitted.set(false);
        },
        error: (error) => {
          this.modalService.showError(error.error.message || 'Signup Failed');
          this.submitted.set(false);
        },
      });
    } else {
      const { email, password } = this.formData;
      this.authService.login({ email, password } as SignupDto).subscribe({
        next: (res) => {
          this.modalService.showSuccess('Login successful');
          this.router.navigate(["/"])
        },
        error: (error) => {
          this.modalService.showError(error.error.message || 'Login Failed');
          this.submitted.set(false);
        },
      });
    }
  }
}
