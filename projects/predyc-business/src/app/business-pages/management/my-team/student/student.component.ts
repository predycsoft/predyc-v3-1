import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Subscription, catchError, combineLatest, map, of } from 'rxjs';
import { User } from 'projects/predyc-business/src/shared/models/user.model';
import { LoaderService } from 'projects/predyc-business/src/shared/services/loader.service';
import { ProfileService } from 'projects/predyc-business/src/shared/services/profile.service';
import { UserService } from 'projects/predyc-business/src/shared/services/user.service';
import { CreateUserComponent } from './create-user/create-user.component';

@Component({
  selector: 'app-student',
  templateUrl: './student.component.html',
  styleUrls: ['./student.component.css']
})
export class StudentComponent {

  student: any
  uid: any

  combinedObservableSubscription: Subscription

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    public loaderService: LoaderService,
    private router: Router,
    private profileService: ProfileService,
    private modalService: NgbModal

  ){}

  ngOnInit() {
    this.loaderService.setLoading(true)
    this.profileService.loadProfiles()
    this.combinedObservableSubscription = combineLatest([this.userService.usersLoaded$, this.profileService.profilesLoaded$]).pipe(
      map(([usersLoaded, profilesLoaded]) => {
        return usersLoaded && profilesLoaded
      }),
      catchError(error => {
        console.error('Error occurred:', error);
        return of([]);  // Return an empty array as a fallback.
      })
    ).subscribe(isLoaded => {
      if (isLoaded) {
        this.uid = this.route.snapshot.paramMap.get('uid');
        this.student = this.userService.getUser(this.uid)
        this.loaderService.setLoading(false)
        if (!this.student) {
          this.router.navigate(['management/students'])
        }
      }
    })

  } 

 

  ngOnDestroy() {
    this.combinedObservableSubscription.unsubscribe()
  }

}
