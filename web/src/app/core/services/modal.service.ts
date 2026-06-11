import { Injectable, signal } from '@angular/core';
import { ModalType } from '../../types/types';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  visible = signal<boolean>(false);
  type = signal<ModalType>(ModalType.SUCCESS);
  message = signal<string>('');

  showSuccess(msg: string) {
    this.type.set(ModalType.SUCCESS);
    this.message.set(msg);
    this.visible.set(true);
    setTimeout(() => {
      this.close();
    }, 2000);
  }

  showError(msg: string) {
    this.type.set(ModalType.ERROR);
    this.message.set(msg);
    this.visible.set(true);
  }

  close() {
    this.visible.set(false);
  }
}
