import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BugListComponent } from '../bug-list/bug-list.component';
import { BugService } from '../../../core/services/bug.service';
import { ModalService } from '../../../core/services/modal.service';

@Component({
  selector: 'app-bugs-page',
  standalone: true,
  imports: [CommonModule, FormsModule, BugListComponent],
  templateUrl: './bugs-page.component.html',
  styleUrl: './bugs-page.component.css',
})
export class BugsPageComponent {
  private bugService = inject(BugService);
  private modalService = inject(ModalService);

  selectedProjectId = signal<number | null>(null);

  // projectsWithBugs = computed(() => {
  //   const seen = new Map<number, string>();
  //   for (const bug of this.allBugs()) {
  //     if (!seen.has(bug.projectId)) {
  //       seen.set(bug.projectId, bug?.project?.name || '');
  //     }
  //   }
  //   return [...seen.entries()].map(([id, name]) => ({ id, name }));
  // });

}
