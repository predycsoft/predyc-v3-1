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
  @Output() onSelectStudentEvent = new EventEmitter<User>()

  constructor(
    public icon: IconService,

  ){}


  onSelectUser(user: User) {
    this.onSelectStudentEvent.emit(user)
  }

  ngOnInit() {
    console.log(this.usersArray)
  }

}
