import { Component, Inject } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { License } from 'projects/predyc-business/src/shared/models/license.model';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';

@Component({
  selector: 'app-dialog-history-licenses',
  templateUrl: './dialog-history-licenses.component.html',
  styleUrls: ['./dialog-history-licenses.component.css']
})
export class DialogHistoryLicensesComponent {

  constructor(
    public dialog: MatDialogRef<DialogHistoryLicensesComponent>,
    private functions: AngularFireFunctions,
    public icon: IconService,
    @Inject (MAT_DIALOG_DATA) public data: any,
  ) { }

  enterprise = JSON.parse(localStorage.getItem('empresa'));
  licenses = this.data.licenses as License[]
  opcion = 0
  licensesQty = 0   

  ngOnInit(): void {
  }

  openWhatsappContacto(){
    window.open(`https://wa.me/524424257590?text=${this.enterprise.nombre} ha solicitado ${this.licensesQty} ${this.licensesQty == 1 ? 'licencia' : 'licencias'}.`,"_blank")
    this.dialog.close()
  }
  

  async emailContacto(){
    const sender = 'desarrollo@predyc.com'
    const subject = `Solicitud de más licencias`
    const recipients = 'ventas@predyc.com'

    let text = `La empresa ${this.enterprise.nombre}, ha solicitado ${this.licensesQty} ${this.licensesQty == 1 ? 'licencia' : 'licencias'}.`

    this.opcion = 3
    await firstValueFrom(this.functions.httpsCallable('sendMail')({sender, text, subject, recipients}))
  }
  salir(){
    this.dialog.close(false)
  }

}
