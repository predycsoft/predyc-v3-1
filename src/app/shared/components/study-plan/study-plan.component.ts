import { Component } from '@angular/core';
import { IconService } from '../../services/icon.service';
import { studyPlanData } from 'src/assets/data/studyPlan.data';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';
import { firstValueFrom } from 'rxjs';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { AlertsService } from '../../services/alerts.service';

@Component({
  selector: 'app-study-plan',
  templateUrl: './study-plan.component.html',
  styleUrls: ['./study-plan.component.css']
})
export class StudyPlanComponent {

  today = Date.now()
  studyPlanData = studyPlanData
  student: User
  clickedCourse: { [id: string]: boolean } = {};

  constructor(
    public icon: IconService,
    private userService: UserService,
    private fireFunctions: AngularFireFunctions,
    private alertService: AlertsService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    const studentUid = this.route.snapshot.paramMap.get('uid');
    if (studentUid) this.student = this.userService.getUser(studentUid)
  }

  async sendEmail(course) {
    this.clickedCourse[course.courseTitle] = true;
    let sender = "ventas@predyc.com"
    let recipients = [this.student.email]
    let subject = "Retraso en curso."
    let text = `Tienes un retraso en tu curso ${course.courseTitle}.`

    try {
      await firstValueFrom(this.fireFunctions.httpsCallable('sendMail')({
        sender: sender,
        recipients: recipients,
        subject: subject,
        text: text,
      }));    
      console.log("Email enviado")
    } catch (error) {
      console.log("error", error)
      this.alertService.errorAlert("")
    }

  }
}
