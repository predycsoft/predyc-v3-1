import { Component, Inject } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subscription, firstValueFrom } from 'rxjs';
import { Enterprise } from 'src/shared/models/enterprise.model';
import { License } from 'src/shared/models/license.model';
import { AlertsService } from 'src/shared/services/alerts.service';
import { EnterpriseService } from 'src/shared/services/enterprise.service';
import { IconService } from 'src/shared/services/icon.service';

@Component({
  selector: 'app-dialog-request-licenses',
  templateUrl: './dialog-request-licenses.component.html',
  styleUrls: ['./dialog-request-licenses.component.css']
})
export class DialogRequestLicensesComponent {

  constructor(
    private alertService: AlertsService,
    private enterpriseService: EnterpriseService,
    public dialog: MatDialogRef<DialogRequestLicensesComponent>,
    private functions: AngularFireFunctions,
    public icon: IconService,
    @Inject (MAT_DIALOG_DATA) public data: any,
  ) { }

  licenses = this.data.licenses as License[]
  opcion = 0
  licensesQty = 0   
  enterpriseSubscription: Subscription
  enterprise: Enterprise | null = null

  ngOnInit(): void {
    this.enterpriseSubscription = this.enterpriseService.enterprise$.subscribe(enterprise => {
      if (enterprise) {
        this.enterprise = enterprise
      }
    })
  }

  openWhatsappContacto(){
    window.open(`https://wa.me/524424257590?text=${this.enterprise.name} ha solicitado ${this.licensesQty} ${this.licensesQty == 1 ? 'licencia' : 'licencias'}.`,"_blank")
    this.dialog.close()
  }
  

  async emailContacto(){
    const sender = 'desarrollo@predyc.com'
    const subject = `Solicitud de más licencias`
    const recipients = 'ventas@predyc.com'

    let text = `La empresa ${this.enterprise.name}, ha solicitado ${this.licensesQty} ${this.licensesQty == 1 ? 'licencia' : 'licencias'}.`
    try {
      await firstValueFrom(this.functions.httpsCallable('sendMail')({sender, text, subject, recipients}))
      this.dialog.close()
      this.alertService.succesAlert("Mensaje enviado")
    } catch(error) {
      console.log(error)
      this.dialog.close()
      this.alertService.errorAlert(error)
    }
  }

  salir(){
    this.dialog.close(false)
  }

  ngOnDestroy() {
    if (this.enterpriseSubscription) this.enterpriseSubscription.unsubscribe()
  }


}
