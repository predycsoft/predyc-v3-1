import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DialogService } from 'projects/predyc-business/src/shared/services/dialog.service';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { Subscription } from 'rxjs';
import { CourseRatingData } from '../reviews-list.component';
import { CourseService } from 'projects/predyc-business/src/shared/services/course.service';

@Component({
  selector: 'app-dialog-reviews',
  templateUrl: './dialog-reviews.component.html',
  styleUrls: ['./dialog-reviews.component.css']
})
export class DialogReviewsComponent {
  constructor(
    private _activeModal: NgbActiveModal,
    public icon: IconService,
    private _courseService: CourseService,
    private _dialogService: DialogService,
  ) {}

  @Input() courseRatingData: CourseRatingData;

  combinedServicesSubscription: Subscription


  ngOnInit(): void {
    console.log("this.courseRatingData", this.courseRatingData)
  }

  closeDialog() {
    this._activeModal.dismiss('Cross click');
  }
}
