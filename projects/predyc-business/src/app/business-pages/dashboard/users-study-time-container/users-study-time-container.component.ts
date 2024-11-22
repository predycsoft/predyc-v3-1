import { Component, Input } from '@angular/core';
import { combineLatest, filter, map, of, Subscription, switchMap, take } from 'rxjs';
import { CourseService } from 'projects/predyc-business/src/shared/services/course.service';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { firestoreTimestampToNumberTimestamp } from 'projects/shared/utils';
import { LoggingService } from 'projects/predyc-business/src/shared/services/logging.service';
import { Enterprise } from 'projects/shared/models/enterprise.model';
import { User } from 'projects/shared/models/user.model';
import { ComponentLog } from 'projects/shared/models/component-log.model';

export class Log {
  endDate: number = 0
  classDuration: number = 0 
}
@Component({
  selector: 'app-users-study-time-container',
  templateUrl: './users-study-time-container.component.html',
  styleUrls: ['./users-study-time-container.component.css']
})
export class UsersStudyTimeContainerComponent {

  @Input() enterprise: Enterprise = null

  constructor(
    public icon: IconService,
  ){}

  async ngOnInit() {
  }

}
