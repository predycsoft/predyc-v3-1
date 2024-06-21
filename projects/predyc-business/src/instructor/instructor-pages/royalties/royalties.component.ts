import { Component, signal } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AuthService } from 'projects/predyc-business/src/shared/services/auth.service';
import { InstructorsService } from 'projects/predyc-business/src/shared/services/instructors.service';
import { RoyaltiesService } from '../../../shared/services/royalties.service';

@Component({
  selector: 'app-royalties-courses',
  templateUrl: './royalties.component.html',
  styleUrls: ['./royalties.component.css']
})
export class RoyaltiesComponent {

  constructor(
    private authService: AuthService,
    private instructorsService:InstructorsService,
    private afs: AngularFirestore,
    private royaltiesService:RoyaltiesService
  ) 
  {

  }

  currentUrl

  totalAnswered: number = 0;
  totalPending: number = 0;
  intructor
  royalties


  ngOnInit() {

    this.authService.user$.subscribe(async (user) => {
      let intructor = await this.instructorsService.getInstructorByEmail(user.email)
      intructor = intructor[0]
      let instructorRef = this.afs.collection<any>('instructors').doc(intructor.id).ref;
      intructor.ref = instructorRef
      console.log(intructor)
      this.intructor = intructor

      let royalties = await this.royaltiesService.getRoyaltiesInstructor(this.intructor.id)

      // Ordenar por dateSaved de más reciente a más antiguo
      royalties = royalties.sort((a, b) => {
        return b.dateSaved.seconds - a.dateSaved.seconds;
      });

      if(royalties){
        this.royalties = royalties
        console.log(this.royalties )
      }

    })

  }
  





}
