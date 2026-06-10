import { Component, inject } from '@angular/core';
import { ModalType } from '../../../types/types';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-modal',
  imports: [],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css',
})
export class ModalComponent {
  modalService = inject(ModalService);
  modalType = ModalType;
}
