import { Component, Input } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { AlertsService } from 'projects/predyc-business/src/shared/services/alerts.service';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-live-course-following',
  templateUrl: './live-course-following.component.html',
  styleUrls: ['./live-course-following.component.css']
})
export class LiveCourseFollowingComponent {

  constructor(
		public icon: IconService,
    private fireFunctions: AngularFireFunctions,
    private alertService: AlertsService,
  ){}

  @Input() studentEmails: string[] = [];


  emailSent: boolean
  emailContent = ""

  ngOnInit() {
    this.emailSent = false
    console.log("this.studentEmails", this.studentEmails)
  }

  async onSubmit() {
    let sender = "desarrollo@predyc.com"
    let recipients = ["diegonegrette42@gmail.com"]
    let subject = "Aviso de curso en vivo."
    let text = this.emailContent

    console.log("this.studentEmails", this.studentEmails)

    try {
      this.emailSent = true
      await firstValueFrom(this.fireFunctions.httpsCallable('sendMail')({
        sender: sender,
        recipients: recipients,
        subject: subject,
        text: text,
      }));
      this.emailContent = ""
      console.log("Email enviado")
    } catch (error) {
      console.log("error", error)
      this.emailSent = true
      this.emailContent = ""
      this.alertService.errorAlert("")
    }
  }

}
