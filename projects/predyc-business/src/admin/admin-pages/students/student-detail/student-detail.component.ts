import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { MAIN_TITLE } from 'projects/predyc-business/src/admin/admin-routing.module';
import { Enterprise } from 'projects/shared/models/enterprise.model';
import { User } from 'projects/shared/models/user.model';
import { calculateAgeFromTimestamp, timestampToDateNumbers } from 'projects/shared/utils';

@Component({
  selector: 'app-student-detail',
  templateUrl: './student-detail.component.html',
  styleUrls: ['./student-detail.component.css']
})
export class StudentDetailComponent {

  userId = this.route.snapshot.paramMap.get('uid');
  user
  tab: number = 0

  constructor(
    private titleService: Title,
    private route: ActivatedRoute,
    private afs: AngularFirestore
  ) {}

  ngOnInit() {
    this.afs.collection<User>(User.collection).doc(this.userId).valueChanges()
    .pipe(
      switchMap(user => {
        const newUser = {
          ...user,
          createdAt: new Date(user.createdAt),
          birthdate: new Date(user.birthdate),
          age: calculateAgeFromTimestamp(user.birthdate)
        }
        return this.afs.collection<Enterprise>(Enterprise.collection).doc(user.enterprise.id).valueChanges().pipe(
          map(enterprise => {
            return {...newUser, enterprise}
          }),
        )
      }),
    ).subscribe(user => {
      this.user = user
      const title = MAIN_TITLE + `Usuario ${this.user.name}`
      this.titleService.setTitle(title)
    })
  }

  createSubscription() {
    console.log("Crear suscripcion")
  }

  createCharge() {
    console.log("Crear pago")
  }

}
