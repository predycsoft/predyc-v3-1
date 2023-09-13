import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class AlertsService {

  constructor() { }

  succesAlert(text: string) {
    Swal.fire({
      icon: 'success',
      title: '¡Éxito!',
      text: text
    }); 
  }
  
  errorAlert() {
    Swal.fire({
      icon: 'error',
      title: '¡Error!',
      text: 'Algo salió mal. Por favor, intenta nuevamente.'
    });
  }

  infoAlert(text: string, mode: ("edit" | "delete")) {
    Swal.fire({
      icon: 'info',
      iconColor: mode === 'delete' ? 'red' : '',
      title: '¡Éxito!',
      confirmButtonColor: mode === 'delete' ? 'red' : '',
      text: text
    }); 
  }

}
