import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AuthService } from 'projects/predyc-business/src/shared/services/auth.service';
import { InstructorsService } from 'projects/predyc-business/src/shared/services/instructors.service';

@Component({
  selector: 'app-questions-courses',
  templateUrl: './questions.component.html',
  styleUrls: ['./questions.component.css']
})
export class QuestionsComponent {

  constructor(
    private authService: AuthService,
    private instructorsService:InstructorsService,
    private afs: AngularFirestore
  ) 
  {

  }

  currentUrl

  totalAnswered: number = 0;
  totalPending: number = 0;
  intructor
  ngOnInit() {


    this.authService.user$.subscribe(async (user) => {
      let intructor = await this.instructorsService.getInstructorByEmail(user.email)
      intructor = intructor[0]
      let instructorRef = this.afs.collection<any>('instructors').doc(intructor.id).ref;
      intructor.ref = instructorRef
      console.log(intructor)
      this.intructor = intructor
    })



  }

  updateTotals(totals: {answered: number, pending: number}) {
    this.totalAnswered = totals.answered;
    this.totalPending = totals.pending;
  }
  

}
