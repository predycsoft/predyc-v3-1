import { Component } from '@angular/core';
import { AfterOnInitResetLoading } from 'src/app/shared/decorators/loading.decorator';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { NotificationService } from 'src/app/shared/services/notification.service';

@AfterOnInitResetLoading
@Component({
  selector: 'app-management',
  templateUrl: './management.component.html',
  styleUrls: ['./management.component.css']
})
export class ManagementComponent {

  constructor(
    private notificationService: NotificationService,
    private loaderService: LoaderService,
  ) {}

  pageSize: number = 10
  sortBy: string = 'default'
  async ngOnInit() {
    console.log("Inicio de managment component")
    console.log("cargando notificaciones")
    await this.notificationService.getNotifications(this.pageSize, this.sortBy)

  }

}
