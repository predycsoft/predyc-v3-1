import { Component, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Notification } from '../../models/notification.model';
import { LoaderService } from '../../services/loader.service';
import { AfterOnInitResetLoading } from '../../decorators/loading.decorator';
import { DataSource, SelectionModel } from '@angular/cdk/collections';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { BehaviorSubject, Observable, combineLatest, map } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { IconService } from '../../services/icon.service';

@AfterOnInitResetLoading
@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent {

  constructor(
    private loaderService: LoaderService,
    public icon: IconService,
    private notificationService: NotificationService,
  ) {}

  displayedColumns: string[] = [
    'content',
    'date',
    'action',
    'check',
  ]
  dataSource!: NotificationDataSource;
  selection!: SelectionModel<Notification>

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  
  // filteredData: Element[] = [...this.dataSource];

  // applyFilter(filterValue: string) {
  //   this.filteredData = this.dataSource.filter(element => element.hiddenAttribute.includes(filterValue));
  // }

  async ngOnInit() {
    const initialSelection: Notification[] = [];
    const allowMultiSelect = true;
    this.selection = new SelectionModel<Notification>(
      allowMultiSelect, initialSelection
    );
    this.dataSource = new NotificationDataSource(this.notificationService, this.paginator, this.sort);
    console.log("this.dataSource")
    console.log(this.dataSource)
  }

  async onAddButton() {
    const notifications: Notification[] = [
      {
        id: "notId1",
        readByUsers: [],
        readByAdmin: false,
        message: "tiene 14 horas de retraso en el curso Estrategias de Mantenimiento",
        date: +new Date(), // timestamp
        userId: "userId1",
        empresaId: "companyId",
        type: 'alert' 
      },
      {
        id: "notId2",
        readByUsers: [],
        readByAdmin: false,
        message: "ha completado el diagnostico inicial de Direccion de Proyectos",
        date: +new Date(), // timestamp
        userId: "userId2",
        empresaId: "companyId",
        type: "activity" 
      },
      {
        id: "notId3",
        readByUsers: [],
        readByAdmin: false,
        message: "esta solicitando acceso al diplomado Diplomado de Mantenimiento 2023",
        date: +new Date(), // timestamp
        userId: "userId3",
        empresaId: "companyId",
        type: "request"
      },
      {
        id: "notId4",
        readByUsers: [],
        readByAdmin: false,
        message: "tiene 14 horas de retraso en el curso Estrategias de Mantenimiento",
        date: +new Date(), // timestamp
        userId: "userId4",
        empresaId: "companyId",
        type: 'alert' 
      },
      {
        id: "notId5",
        readByUsers: [],
        readByAdmin: false,
        message: "esta solicitando acceso al diplomado Diplomado de Mantenimiento 2023",
        date: +new Date(), // timestamp
        userId: "userId3",
        empresaId: "companyId",
        type: "request"
      },
      {
        id: "notId6",
        readByUsers: [],
        readByAdmin: false,
        message: "tiene 14 horas de retraso en el curso Estrategias de Mantenimiento",
        date: +new Date(), // timestamp
        userId: "userId4",
        empresaId: "companyId",
        type: 'alert' 
      },
      {
        id: "notId7",
        readByUsers: [],
        readByAdmin: false,
        message: "esta solicitando acceso al diplomado Diplomado de Mantenimiento 2023",
        date: +new Date(), // timestamp
        userId: "userId3",
        empresaId: "companyId",
        type: "request"
      },
    ]
    for (const notification of notifications) {
      await this.notificationService.addNotification(notification)
    }
  }

  applyFilter(type: 'all' |'alert' | 'activity' | 'request' | '') {
    this.dataSource.filter = type;
  }

}
  class NotificationDataSource extends DataSource<Notification> {

    constructor(
      private notificationService: NotificationService,
      private paginator: MatPaginator,
      private sort: MatSort
    ) {
      super();
      this.notificationService = notificationService
    }
    
    private _filterChange = new BehaviorSubject<string>('all');

    get filter(): string {
      return this._filterChange.value;
    }
    
    set filter(filter: string) {
      this._filterChange.next(filter);
    }
  
    connect(): Observable<Notification[]> {
      return combineLatest([
        this.notificationService.notifications$,
        this._filterChange
      ]).pipe(
        map(([notifications, filterString]) => {
          if (filterString === 'all') {
            return notifications;
          }
          return notifications.filter(notification => notification.type === filterString);
        })
      );
    }
  
    disconnect() {
  
    }
  }

