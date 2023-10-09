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

  openEditValidationTestModal(): NgbModalRef {
    const modalRef = this.modalService.open(EditValidationTestComponent, {
      animation: true,
      centered: true,
      size: 'lg'
    })
    modalRef.componentInstance.testObject = {
      attr1: "hola",
      attr2: "hola1"
    }
    return modalRef
  }

  createValidationTest() {
    // const modalRef = this.openEditValidationTestModal({
    //   attr1: "hola",
    //   attr2: "hola1"
    // })
    // modalRef.closed(result => {
    //   // this.activityService.addActivity()
    // })
  }

  editValidationTest() {
    // this.openEditValidationTestModal({
    //   attr1: "hola",
    //   attr2: "hola1"
    // })
  }

}
