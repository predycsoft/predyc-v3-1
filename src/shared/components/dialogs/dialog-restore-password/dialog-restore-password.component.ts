import { Component } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { MatDialogRef } from '@angular/material/dialog';
import { Subscription, firstValueFrom } from 'rxjs';
import { AlertsService } from 'src/shared/services/alerts.service';

@Component({
  selector: 'app-dialog-restore-password',
  templateUrl: './dialog-restore-password.component.html',
  styleUrls: ['./dialog-restore-password.component.css']
})
export class DialogRestorePasswordComponent {

  constructor(
    private alertService: AlertsService, 
    private dialogRef: MatDialogRef<DialogRestorePasswordComponent>,
    private fireFunctions: AngularFireFunctions
  ) { }

  targetEmail: string

  async onSubmit() {
    try {
      if (!this.targetEmail) throw Error("Debe especificar el correo a utilizar")
      await firstValueFrom(this.fireFunctions.httpsCallable('generatePasswordResetLink')({
        email: this.targetEmail,
      }))
      this.dialogRef.close(true);
      this.alertService.succesAlert("El correo de reestablecimiento se ha enviado correctamente")
    } catch(error) {
      console.log(error)
    }
  }

  closeDialog() {
    this.dialogRef.close(false);
  }
}
