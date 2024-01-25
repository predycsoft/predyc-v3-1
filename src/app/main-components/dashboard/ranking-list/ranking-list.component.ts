import { Component } from '@angular/core';
import { Subscription, catchError, combineLatest, map, of } from 'rxjs';
import { User, UserJson } from 'src/app/shared/models/user.model';
import { IconService } from 'src/app/shared/services/icon.service';
import { ProfileService } from 'src/app/shared/services/profile.service';
import { UserService } from 'src/app/shared/services/user.service';

interface UserRanking extends UserJson {
  profileName: string
}

@Component({
  selector: 'app-ranking-list',
  templateUrl: './ranking-list.component.html',
  styleUrls: ['./ranking-list.component.css']
})
export class RankingListComponent {

  constructor(
    private userService: UserService,
    public icon: IconService,
    private profileService: ProfileService,

  ){}

  ranking: UserRanking[]
  listLength: number = 5
  showPointsTooltip = false
  combinedObservableSubscription: Subscription

  ngOnInit() {
    this.combinedObservableSubscription = combineLatest([this.userService.getUsers$(), this.profileService.getProfiles$()]).subscribe(([users, profiles]) => {
        this.ranking = users.map(user => {
          const profile = user.profile ? profiles.find(profile => profile.id === user.profile.id) : null
          return {
            ...user,
            profileName: profile ? profile.name : 'Sin perfil'
          }
        }).sort((a, b) => b.ratingPoints - a.ratingPoints)
      })
  }

  ngOnDestroy() {
    if(this.combinedObservableSubscription) this.combinedObservableSubscription.unsubscribe()
  }

}
