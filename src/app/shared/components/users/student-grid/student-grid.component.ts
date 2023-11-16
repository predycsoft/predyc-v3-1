import { Component, EventEmitter, Input, Output } from '@angular/core';
import { User } from 'src/app/shared/models/user.model';
import { IconService } from 'src/app/shared/services/icon.service';

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

  constructor(
    public icon: IconService,

  ){}

  ngOnInit() {
    console.log(this.usersArray);
    this.filterUsers();
  }

  ngOnChanges() {
    this.filterUsers();
  }

  filterUsers() {
    if (this.selectedProfileId === "all") {
      // Si no hay un perfil seleccionado, muestra todos los usuarios
      this.filteredUsers = this.usersArray;
    } else {
      this.filteredUsers = this.usersArray.filter(user => {
        // Puedes ajustar esta lógica según la estructura real de tus objetos User
        return user.profile && user.profile.id === this.selectedProfileId;
      });
    }
  }

  onSelectUser(user: User) {
    this.onSelectStudentEvent.emit(user)
  }


}
