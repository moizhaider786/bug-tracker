import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SidebarService {
  private renderSidebar = signal<boolean>(true);

  set(value: boolean) {
    this.renderSidebar.set(value);
  }
  get() {
    return this.renderSidebar();
  }
}
