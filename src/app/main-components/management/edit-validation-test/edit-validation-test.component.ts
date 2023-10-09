import { Component, Input } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { IconService } from 'src/app/shared/services/icon.service';

@Component({
  selector: 'app-edit-validation-test',
  templateUrl: './edit-validation-test.component.html',
  styleUrls: ['./edit-validation-test.component.css']
})
export class EditValidationTestComponent {

  @Input() testObject: {}

  // activityForm = this.fb.group({
  //   title: ['', Validators.required],
  //   questions: [''],
  //   description: [''],
  //   instructions: ['', Validators.required],
  //   duration: [0, Validators.required, Validators.pattern('^\n$')],
  //   files: [''],
  //   vimeoId1: [0],
  //   vimeoId2: [''],
  //   type: [''],    
  //   stripeInfo: this.fb.group({ stripeId: [''], updatedAt: [null] }),
  // });

  constructor(
    public icon: IconService,
    public activeModal: NgbActiveModal,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    console.log("Edit validation test")
  }

}
