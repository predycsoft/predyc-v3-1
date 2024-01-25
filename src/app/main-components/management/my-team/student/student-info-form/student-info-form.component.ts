import { Component, Input } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Profile } from 'src/app/shared/models/profile.model';
import { User } from 'src/app/shared/models/user.model';
import { IconService } from 'src/app/shared/services/icon.service';

@Component({
  selector: 'app-student-info-form',
  templateUrl: './student-info-form.component.html',
  styleUrls: ['./student-info-form.component.css']
})
export class StudentInfoFormComponent {
  @Input() student: User;
  @Input() studentProfile: Profile;
  studentForm: FormGroup;
  isEditing = false;

  constructor(public icon: IconService) {}

  ngOnInit() {
    this.studentForm = new FormGroup({
      displayName: new FormControl(''),
      email: new FormControl(''),
      phoneNumber: new FormControl(''),
      country: new FormControl('')
    });

    if (this.student) {
      this.studentForm.patchValue({
        displayName: this.student.displayName,
        email: this.student.email,
        phoneNumber: this.student.phoneNumber,
        country: this.student.country
      });
    }
  }

  save() {
    if (this.isEditing) {
      console.log("Guardando...", this.studentForm.value);
      // Save data here
    }
    this.isEditing = false
  }
}
