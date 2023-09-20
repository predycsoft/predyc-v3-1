import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogConfirmarComponent } from '../../shared/components/dialogs/dialog-confirmar/dialog-confirmar.component';
// import { DiasComponent } from '../dialogs/dias/dias.component';
import { ExitoComponent } from '../../shared/components/dialogs/exito/exito.component';
// import { FracasoComponent } from '../dialogs/fracaso/fracaso.component';
// import { DialogListaErroresComponent } from '../empresa/dialog-lista-errores/dialog-lista-errores.component';
// import { ProcesandoComponent } from '../procesando/procesando.component';
import { AlertComponent } from './dialogs/alert/alert.component';

@Injectable({
  providedIn: 'root'
})
export class DialogService {

  constructor(
    public dialog: MatDialog
  ) { }

  // dialogListaErrores(errores){
  //   return this.dialog.open(DialogListaErroresComponent,{
  //     data: {
  //       errores: errores
  //     }
  //   })
  // }

  dialogConfirmar() {
    return this.dialog.open(DialogConfirmarComponent)
  }

  dialogExito() {
    return this.dialog.open(ExitoComponent)
  }

  // dialogFracaso() {
  //   return this.dialog.open(FracasoComponent)
  // }

  // dialogDias() {
  //   return this.dialog.open(DiasComponent)
  // }

  dialogAlerta(mensaje){
    return this.dialog.open(AlertComponent, {
      data: {
        mensaje: mensaje
      }
    })
  }
}
