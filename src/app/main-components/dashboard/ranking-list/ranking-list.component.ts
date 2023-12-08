import { Component } from '@angular/core';
import { Subscription, catchError, combineLatest, map, of } from 'rxjs';
import { User } from 'src/app/shared/models/user.model';
import { IconService } from 'src/app/shared/services/icon.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { ProfileService } from 'src/app/shared/services/profile.service';
import { UserService } from 'src/app/shared/services/user.service';

@Component({
  selector: 'app-ranking-list',
  templateUrl: './ranking-list.component.html',
  styleUrls: ['./ranking-list.component.css']
})
export class RankingListComponent {

  constructor(
    private userService: UserService,
    public loaderService: LoaderService,
    public icon: IconService,
    private profileService: ProfileService,

  ){}

  ranking: User[]
  listLength: number = 5
  showPointsTooltip = false
  combinedObservableSubscription: Subscription


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
        this.userService.users$.subscribe(users => {
          let students: User[] = [...users]
          students.sort((a, b) => {
            if (a.photoUrl !== "" && b.photoUrl === "") {
              return -1; // a va antes que b
            }
            if (a.photoUrl === "" && b.photoUrl !== "") {
              return 1; // b va antes que a
            }
            return 0; // a y b son iguales
          });
          this.ranking = students.sort((a, b) => b.ratingPoints - a.ratingPoints)
          // console.log("this.ranking", this.ranking)
          this.loaderService.setLoading(false)
        })
      }
    })
  }

  getStudentProfileName(item: User): string {
    if (item.profile) return this.profileService.getProfile(item.profile.id).name
    return "Sin perfil"
  }
}
