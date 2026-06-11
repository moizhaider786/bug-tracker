import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SidebarService } from '../services/sidebar.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './not-found-page.component.html',
  styleUrl: './not-found-page.component.css'
})
export class NotFoundPage implements OnInit{
    sidebarService = inject(SidebarService);
    ngOnInit(): void {
        this.sidebarService.set(false);
    }
}