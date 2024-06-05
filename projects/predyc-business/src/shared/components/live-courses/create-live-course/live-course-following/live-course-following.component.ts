import { Component, Input } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { AlertsService } from 'projects/predyc-business/src/shared/services/alerts.service';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { LiveCourseService } from 'projects/predyc-business/src/shared/services/live-course.service';
import { Subscription, firstValueFrom } from 'rxjs';

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
    private liveCourseService: LiveCourseService,
  ){}

  @Input() studentEmails: string[] = [];
  @Input() idBaseLiveCourse: string
	@Input() idLiveCourseSon: string

  emailLastDate: string
  emailSent: boolean
  emailContent = ""

  liveCourseServiceSubscription: Subscription

  ngOnInit() {
    this.emailSent = false

    this.liveCourseService.getLiveCourseSonById$(this.idBaseLiveCourse, this.idLiveCourseSon).subscribe(liveCourseSon => {
      if (liveCourseSon) {
        // console.log("liveCourseSon.emailLastDate", liveCourseSon.emailLastDate)
        this.emailLastDate = this.convertTimestampToDatetimeLocalString(liveCourseSon.emailLastDate)
      }
    })
  }

  async onSubmit() {
    let sender = "desarrollo@predyc.com"
    // let recipients = this.studentEmails
    let recipients = ["diegonegrette42@gmail.com"]
    let subject = "Aviso de curso en vivo."
    let text = this.emailContent

    try {
      this.emailSent = true

      await firstValueFrom(this.fireFunctions.httpsCallable('sendLiveCourseEmail')({
        sender: sender,
        recipients: recipients,
        subject: subject,
        text: text,
        liveCourseId: this.idBaseLiveCourse,
        liveCourseSonId: this.idLiveCourseSon,
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

  
  convertTimestampToDatetimeLocalString(timestamp: any): string {
    if (!timestamp) return '';
    const date = new Date(timestamp.seconds * 1000);
  
    // Get the local time components
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
  
    // Format the local datetime string in the format required by input[type="datetime-local"]
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  ngOnDestroy() {
    if (this.liveCourseServiceSubscription) this.liveCourseServiceSubscription.unsubscribe()
  }

}
