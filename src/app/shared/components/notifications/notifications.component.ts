import { Component, Input, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Notification } from '../../models/notification.model';
import { LoaderService } from '../../services/loader.service';
import { AfterOnInitResetLoading } from '../../decorators/loading.decorator';
import { DataSource, SelectionModel } from '@angular/cdk/collections';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { BehaviorSubject, Observable, combineLatest, map, switchMap } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { IconService } from '../../services/icon.service';
import { UserService } from '../../services/user.service';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { User } from '../../models/user.model';

@AfterOnInitResetLoading
@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent {

  @Input() isDetail: boolean = true

  constructor(
    private loaderService: LoaderService,
    public icon: IconService,
    private notificationService: NotificationService,
    private userService: UserService,
    //
    private afs: AngularFirestore,

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

  users: User[]
  

  async ngOnInit() {
    const initialSelection: Notification[] = [];
    const allowMultiSelect = true;
    this.selection = new SelectionModel<Notification>(
      allowMultiSelect, initialSelection
    );
    this.dataSource = new NotificationDataSource(this.notificationService, this.userService, this.paginator, this.sort);
    console.log("this.dataSource")
    console.log(this.dataSource)

    // Para crear notificaciones en firebase
    await this.userService.getUsers()
    this.userService.getUsersObservable().subscribe(users => {
      this.users = users
      console.log("this.users")
      console.log(this.users)
    })
  }

  async onAddButton() {
    const notifications: Notification[] = [
      {
        id: "notId1",
        readByUsers: [],
        readByAdmin: false,
        message: "tiene 14 horas de retraso en el curso Estrategias de Mantenimiento",
        date: +new Date(), // timestamp
        user: this.afs.collection<User>('users').doc(this.users[0].uid as string).ref,
        empresaId: "companyId",
        type: 'alert' 
      },
      {
        id: "notId2",
        readByUsers: [],
        readByAdmin: false,
        message: "ha completado el diagnostico inicial de Direccion de Proyectos",
        date: +new Date(), // timestamp
        user: this.afs.collection<User>('users').doc(this.users[1].uid as string).ref,
        empresaId: "companyId",
        type: "activity" 
      },
      {
        id: "notId3",
        readByUsers: [],
        readByAdmin: false,
        message: "esta solicitando acceso al diplomado Diplomado de Mantenimiento 2023",
        date: +new Date(), // timestamp
        user: this.afs.collection<User>('users').doc(this.users[2].uid as string).ref,
        empresaId: "companyId",
        type: "request"
      },
      {
        id: "notId4",
        readByUsers: [],
        readByAdmin: false,
        message: "tiene 14 horas de retraso en el curso Estrategias de Mantenimiento",
        date: +new Date(), // timestamp
        user: this.afs.collection<User>('users').doc(this.users[3].uid as string).ref,
        empresaId: "companyId",
        type: 'alert' 
      },
      {
        id: "notId5",
        readByUsers: [],
        readByAdmin: false,
        message: "esta solicitando acceso al diplomado Diplomado de Mantenimiento 2023",
        date: +new Date(), // timestamp
        user: this.afs.collection<User>('users').doc(this.users[0].uid as string).ref,
        empresaId: "companyId",
        type: "request"
      },
      {
        id: "notId6",
        readByUsers: [],
        readByAdmin: false,
        message: "tiene 14 horas de retraso en el curso Estrategias de Mantenimiento",
        date: +new Date(), // timestamp
        user: this.afs.collection<User>('users').doc(this.users[1].uid as string).ref,
        empresaId: "companyId",
        type: 'alert' 
      },
      {
        id: "notId7",
        readByUsers: [],
        readByAdmin: false,
        message: "esta solicitando acceso al diplomado Diplomado de Mantenimiento 2023",
        date: +new Date(), // timestamp
        user: this.afs.collection<User>('users').doc(this.users[2].uid as string).ref,
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
      private userService: UserService,
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
      // Combina los 3 observables. tomará el último valor emitido por cada uno de estos observables y 
      // emitirá un array con esos valores cada vez que cualquiera de ellos emita un nuevo valor.
      return combineLatest([
        this.notificationService.notifications$,
        this.userService.getUsersObservable(),
        this._filterChange
      ]).pipe(
        // Se desestructura el array en tres constantes
        map(([notifications, users, filterString]) => {
          // Mapea cada notificación para anexar la información del usuario
          const notificationsWithUser = notifications.map(notification => {
            const user = users.find(u => u.uid === notification.user!.id);
            return {
              ...notification,
              userData: user ? user : undefined  // asignar el dato del usuario al campo userData
            };
          });
          // aplicamos el filtro seleccionado
          if (filterString === 'all') {
            return notificationsWithUser;
          }
          return notificationsWithUser.filter(notification => notification.type === this.filter);
        })
      );
    }
    
    
  
    disconnect() {
  
    }
  }

