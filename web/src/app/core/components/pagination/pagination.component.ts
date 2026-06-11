import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.css',
})
export class PaginationComponent {
  total = input.required<number>();
  currentPage = input.required<number>();
  pageSize = input<number>(10);
  maxVisible = input<number>(5);
  pageChange = output<number>();

  totalPages = computed(() => Math.ceil(this.total() / this.pageSize()));

  pages = computed<(number | null)[]>(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const max = this.maxVisible();

    if (total <= max) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const half = Math.floor(max / 2);
    let start = Math.max(2, current - half);
    let end = Math.min(total - 1, current + half);

    if (current - half < 2) {
      end = Math.min(total - 1, max - 1);
    }
    if (current + half > total - 1) {
      start = Math.max(2, total - max + 2);
    }

    const pages: (number | null)[] = [1];

    if (start > 2) pages.push(null);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < total - 1) pages.push(null);

    pages.push(total);

    return pages;
  });

  isFirstPage = computed(() => this.currentPage() === 1);
  isLastPage = computed(() => this.currentPage() >= this.totalPages());

  /** Range text e.g. "1–10 of 42" */
  rangeText = computed(() => {
    const from = (this.currentPage() - 1) * this.pageSize() + 1;
    const to = Math.min(this.currentPage() * this.pageSize(), this.total());
    return `${from}–${to} of ${this.total()}`;
  });

  goTo(page: number | null) {
    if (page === null) return;
    if (page < 1 || page > this.totalPages()) return;
    if (page === this.currentPage()) return;
    this.pageChange.emit(page);
  }

  prev() {
    if (!this.isFirstPage()) this.goTo(this.currentPage() - 1);
  }

  next() {
    if (!this.isLastPage()) this.goTo(this.currentPage() + 1);
  }
}
