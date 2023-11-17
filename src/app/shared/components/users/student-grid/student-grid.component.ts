import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { User } from 'src/app/shared/models/user.model';
import { IconService } from 'src/app/shared/services/icon.service';
import { SearchInputService } from 'src/app/shared/services/search-input.service';

@Component({
  selector: 'app-student-grid',
  templateUrl: './student-grid.component.html',
  styleUrls: ['./student-grid.component.css']
})
export class StudentGridComponent {

  @Input() usersArray: User[]
  @Input() enableNavigateToUser: boolean = true
  @Input() selectedProfileId: string;
  @Output() onSelectStudentEvent = new EventEmitter<User>()

  filteredUsers: User[] = [];
  searchSubscription: Subscription

  constructor(
    public icon: IconService,
    private searchInputService: SearchInputService, 

  ){}

  ngOnInit() {
    this.filterUsersByProfile();
    this.searchSubscription = this.searchInputService.dataObservable$.subscribe(filter => {
      const filteredUsersByProfile = [...this.filteredUsers]
      this.filterUsersBySearchBar(filter, filteredUsersByProfile)
    })
  }

  ngOnChanges() {
    this.filterUsersByProfile();
  }

  filterUsersByProfile() {
    if (this.selectedProfileId === "all") {
      // Si no hay un perfil seleccionado, muestra todos los usuarios
      this.filteredUsers = this.usersArray;
    } else {
      this.filteredUsers = this.usersArray.filter(user => {
        return user.profile && user.profile.id === this.selectedProfileId;
      });
    }
  }

  filterUsersBySearchBar(text: string, users: User[]) {
    this.filteredUsers = users.filter(user => {
      const searchStr = (user.name as string + user.email as string).toLowerCase();
      return searchStr.indexOf(text.toLowerCase()) !== -1;
    });
  }

  onSelectUser(user: User) {
    this.onSelectStudentEvent.emit(user)
  }


}
