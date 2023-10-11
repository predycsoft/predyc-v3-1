import { Component } from '@angular/core';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { EditValidationTestComponent } from '../management/edit-validation-test/edit-validation-test.component';

@Component({
  selector: 'app-validation',
  templateUrl: './validation.component.html',
  styleUrls: ['./validation.component.css']
})
export class ValidationComponent {

  constructor(
    private loaderService: LoaderService,
    private modalService: NgbModal
  ) {}

  openEditValidationTestModal(targetActivity=null): NgbModalRef {
    const modalRef = this.modalService.open(EditValidationTestComponent, {
      animation: true,
      centered: true,
      size: 'xl'
    })
    if (targetActivity) {
      modalRef.componentInstance.existingActivity = targetActivity
    }
    return modalRef
  }

  createValidationTest() {
    const modalRef = this.openEditValidationTestModal()
    // modalRef.closed(result => {
    //   // this.activityService.addActivity()
    // })
    modalRef.result.then(result => {
      console.log("result", result)
    }).catch(error => console.log("error", error))
  }

  editValidationTest() {
    const modalRef = this.openEditValidationTestModal({
      title: 'test activity',
      description: 'test description',
      instructions: 'test instructions',
    })
    modalRef.result.then(result => {
      console.log("result", result)
    }).catch(error => console.log("error", error))
  }

}
