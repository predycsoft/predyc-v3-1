import { Component, Input } from '@angular/core';
import { DocumentReference } from '@angular/fire/compat/firestore';
import { FormControl } from '@angular/forms';
import { UserService } from 'projects/predyc-business/src/shared/services/user.service';
import { Enterprise } from 'projects/shared/models/enterprise.model';
import { User } from 'projects/shared/models/user.model';
import { Observable, switchMap } from 'rxjs';

@Component({
  selector: 'app-dialog-assign-live-courses',
  templateUrl: './dialog-assign-live-courses.component.html',
  styleUrls: ['./dialog-assign-live-courses.component.css']
})
export class DialogAssignLiveCoursesComponent {

  constructor(
    private userService: UserService
  ){}

  @Input() enterpriseRef: DocumentReference<Enterprise> | null = null;

  myControl = new FormControl('');
  filteredOptions: Observable<User[]>;
  QUERYLIMYT: number = 3

  ngOnInit() {
    this.filteredOptions = this.myControl.valueChanges.pipe(
      switchMap(value => this.userService.getAllUsersForLiveCourses$(value, this.QUERYLIMYT))
    );
  }


}
