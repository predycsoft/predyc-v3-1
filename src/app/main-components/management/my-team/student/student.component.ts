import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, catchError, combineLatest, map, of } from 'rxjs';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { ProfileService } from 'src/app/shared/services/profile.service';
import { UserService } from 'src/app/shared/services/user.service';

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
