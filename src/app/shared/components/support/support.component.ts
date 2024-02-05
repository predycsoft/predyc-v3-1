import { Component } from '@angular/core';
import { IconService } from '../../services/icon.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom } from 'rxjs';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { AlertsService } from '../../services/alerts.service';

@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.css']
})
export class SupportComponent {

  constructor(
    private activeModal: NgbActiveModal,
    public icon: IconService,
    private functions: AngularFireFunctions,
    private alertService: AlertsService
  ) {}

  formIsOpen: boolean = false
  name: string
  email: string
  message: string

  openWhatsapp() {
    window.open("https://wa.me/524424257590?text=Consulta sobre capacitación para empresas","_blank")
    this.activeModal.close();
  }

  async sendEmail() {
    try {
      await firstValueFrom(this.functions.httpsCallable("contactoEmail")({
        email: this.email,
        asunto: "Consulta Predyc",
        mensaje: this.message
      }))
      this.activeModal.close()
      this.alertService.succesAlert("Mensaje enviado")
    } catch(error) {
      console.log(error)
      this.alertService.errorAlert(error)
    }
  }
  dismiss() {
    this.activeModal.dismiss()
  }

}
