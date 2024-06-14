import { Component, EventEmitter, Input, Output } from "@angular/core";
import { DocumentReference } from "@angular/fire/compat/firestore";
import { FormControl } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { IconService } from "projects/predyc-business/src/shared/services/icon.service";
import { UserService } from "projects/predyc-business/src/shared/services/user.service";
import { Enterprise } from "projects/shared/models/enterprise.model";
import { User } from "projects/shared/models/user.model";
import { Observable, map, switchMap } from "rxjs";

@Component({
  selector: "app-dialog-assign-live-courses",
  templateUrl: "./dialog-assign-live-courses.component.html",
  styleUrls: ["./dialog-assign-live-courses.component.css"],
})
export class DialogAssignLiveCoursesComponent {
  constructor(private userService: UserService, public activeModal: NgbActiveModal, public icon: IconService) {}

  @Input() emailsAssigned: string[];
  @Output() userSelected = new EventEmitter<User>();

  myControl = new FormControl("");
  filteredOptions: Observable<User[]>;
  QUERYLIMYT: number = 3;

  ngOnInit() {
    this.filteredOptions = this.myControl.valueChanges.pipe(
      switchMap((value) => this.userService.getAllUsersForLiveCourses$(value, this.QUERYLIMYT)),
      map((users) => users.filter((user) => !this.emailsAssigned.includes(user.email)))
    );
  }

  onUserSelected(user: User) {
    this.userSelected.emit(user);
    this.closeModal();
  }

  closeModal() {
    this.activeModal.close();
  }
}
