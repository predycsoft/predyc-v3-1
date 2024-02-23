import { Component } from '@angular/core';
import { AfterOnInitResetLoading } from 'src/shared/decorators/loading.decorator';
import { LoaderService } from 'src/shared/services/loader.service';
import { NotificationService } from 'src/shared/services/notification.service';
import { UserService } from 'src/shared/services/user.service';

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
