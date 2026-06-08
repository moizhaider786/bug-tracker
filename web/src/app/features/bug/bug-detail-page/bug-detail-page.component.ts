import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BugService } from '../../../core/services/bug.service';
import { Bug } from '../../../core/models/bug.model';

@Component({
  selector: 'app-bug-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './bug-detail-page.component.html',
  styleUrl: './bug-detail-page.component.css',
})
export class BugDetailPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private bugService = inject(BugService);

  bug = signal<Bug | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.loadBug(+id);
      }
    });
  }

  private loadBug(id: number): void {
    this.isLoading.set(true);
    this.bugService.getBugById(id).subscribe({
      next: (b) => {
        this.bug.set(b);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || err.message);
        this.isLoading.set(false);
      },
    });
  }
}
