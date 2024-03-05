import { Component } from '@angular/core';
import { AfterOnInitResetLoading } from 'projects/predyc-business/src/shared/decorators/loading.decorator';
import { LoaderService } from 'projects/predyc-business/src/shared/services/loader.service';
import { NotificationService } from 'projects/predyc-business/src/shared/services/notification.service';
import { UserService } from 'projects/predyc-business/src/shared/services/user.service';

@Component({
  selector: 'app-management',
  templateUrl: './management.component.html',
  styleUrls: ['./management.component.css']
})
export class ManagementComponent {

  constructor(
    // private notificationService: NotificationService,
  ) {}

}
