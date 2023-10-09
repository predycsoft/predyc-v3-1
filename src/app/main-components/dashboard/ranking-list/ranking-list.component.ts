import { Component } from '@angular/core';
import { User } from 'src/app/shared/models/user.model';
import { IconService } from 'src/app/shared/services/icon.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
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
  ){}

  ranking: User[]
  listLength: number = 6
  showPointsTooltip = false

  ngOnInit() {
    this.loaderService.setLoading(true)
    this.userService.usersLoaded$.subscribe(isLoaded => {
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
          console.log("this.ranking", this.ranking)
          this.loaderService.setLoading(false)
        })
      }
    })
  }
}
