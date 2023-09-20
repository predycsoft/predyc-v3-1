import { DataSource, SelectionModel } from '@angular/cdk/collections';
import { Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { IconService } from 'src/app/shared/services/icon.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { UserService } from 'src/app/shared/services/user.service';

@Component({
  selector: 'app-notification-list',
  templateUrl: './notification-list.component.html',
  styleUrls: ['./notification-list.component.css']
})
export class NotificationListComponent {

  displayedColumns: string[] = [
    'content',
    'date',
    'action',
    'check',
  ]
  // dataSource!: NotificationDataSource;
  initialSelection: Notification[] = [];
  allowMultiSelect = true;
  selection: SelectionModel<Notification> = new SelectionModel<Notification>(
    this.allowMultiSelect, this.initialSelection
  );

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    public icon: IconService,
  ) {}

  // async onAddButton() {
  //   const notifications: Notification[] = [
  //     {
  //       id: "notId1",
  //       readByUsers: [],
  //       readByAdmin: false,
  //       message: "tiene 14 horas de retraso en el curso Estrategias de Mantenimiento",
  //       date: +new Date(), // timestamp
  //       user: this.afs.collection<User>(User.collection).doc(this.users[0].uid as string).ref,
  //       empresaId: "companyId",
  //       type: 'alert' 
  //     },
  //     {
  //       id: "notId2",
  //       readByUsers: [],
  //       readByAdmin: false,
  //       message: "ha completado el diagnostico inicial de Direccion de Proyectos",
  //       date: +new Date(), // timestamp
  //       user: this.afs.collection<User>(User.collection).doc(this.users[1].uid as string).ref,
  //       empresaId: "companyId",
  //       type: "activity" 
  //     },
  //     {
  //       id: "notId3",
  //       readByUsers: [],
  //       readByAdmin: false,
  //       message: "esta solicitando acceso al diplomado Diplomado de Mantenimiento 2023",
  //       date: +new Date(), // timestamp
  //       user: this.afs.collection<User>(User.collection).doc(this.users[2].uid as string).ref,
  //       empresaId: "companyId",
  //       type: "request"
  //     },
  //     {
  //       id: "notId4",
  //       readByUsers: [],
  //       readByAdmin: false,
  //       message: "tiene 14 horas de retraso en el curso Estrategias de Mantenimiento",
  //       date: +new Date(), // timestamp
  //       user: this.afs.collection<User>(User.collection).doc(this.users[3].uid as string).ref,
  //       empresaId: "companyId",
  //       type: 'alert' 
  //     },
  //     {
  //       id: "notId5",
  //       readByUsers: [],
  //       readByAdmin: false,
  //       message: "esta solicitando acceso al diplomado Diplomado de Mantenimiento 2023",
  //       date: +new Date(), // timestamp
  //       user: this.afs.collection<User>(User.collection).doc(this.users[0].uid as string).ref,
  //       empresaId: "companyId",
  //       type: "request"
  //     },
  //     {
  //       id: "notId6",
  //       readByUsers: [],
  //       readByAdmin: false,
  //       message: "tiene 14 horas de retraso en el curso Estrategias de Mantenimiento",
  //       date: +new Date(), // timestamp
  //       user: this.afs.collection<User>(User.collection).doc(this.users[1].uid as string).ref,
  //       empresaId: "companyId",
  //       type: 'alert' 
  //     },
  //     {
  //       id: "notId7",
  //       readByUsers: [],
  //       readByAdmin: false,
  //       message: "esta solicitando acceso al diplomado Diplomado de Mantenimiento 2023",
  //       date: +new Date(), // timestamp
  //       user: this.afs.collection<User>(User.collection).doc(this.users[2].uid as string).ref,
  //       empresaId: "companyId",
  //       type: "request"
  //     },
  //   ]
  //   for (const notification of notifications) {
  //     await this.notificationService.addNotification(notification)
  //   }
  // }

}

// class NotificationDataSource extends DataSource<Notification> {

//   // public data: User[]
//   // private dataSubject = new BehaviorSubject<User[]>([]);
//   private filterSubject = new BehaviorSubject<string>('');
//   private paginatorSubject = new Subject<void>();
//   private notificationSubscription: Subscription;

//   constructor(
//     // private users$: Observable<User[]>,
//     // private paginator: MatPaginator,
//     // private utilsService: UtilsService
//   ) {
//     super();
//     // this.paginator.pageSize = 5
//     // this.paginator.page.subscribe(() => this.paginatorSubject.next());
//     // this.sort.sortChange.subscribe(() => this.sortSubject.next());
//   }
  
//   connect(): Observable<Notification[]> {

//     this.userSubscription = this.users$.subscribe(users => {
//       this.data = users
//       this.dataSubject.next(users);
//     });

//     return merge(this.users$, this.filterSubject, this.paginatorSubject, this.sortSubject).pipe(
//       map(() => {
//         // Filtering
//         let users = this.dataSubject.value
//         let filteredUsers = users.filter(user => {
//           const searchStr = (user.name as string + user.email as string).toLowerCase();
//           return searchStr.indexOf(this.filterSubject.value.toLowerCase()) !== -1;
//         });

//         this.paginator.length = filteredUsers.length

  
//         // Sorting
//         if (this.sort.active && this.sort.direction !== '') {
//           filteredUsers = filteredUsers.sort((a, b) => {
//             const isAsc = this.sort.direction === 'asc';
//             console.log('this.sort.active')
//             console.log(this.sort.active)
//             switch (this.sort.active) {
//               case 'displayName': return this.utilsService.compare(a.displayName as string, b.displayName as string, isAsc);
//               // case 'status': return this.utilsService.compare(a.status as string, b.status as string, isAsc);
//               // case 'departament': return 0
//               // case 'profile': return 0
//               // case 'ratingPoints': return 0
//               // case 'performance': return 0
//               // Add more fields to sort by as needed.
//               default: return 0;
//             }
//           });
//         }
  
//         // Pagination
//         const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
//         return filteredUsers.splice(startIndex, this.paginator.pageSize);
//       }),
//       catchError(error => {
//         console.error('Error occurred:', error);
//         return of([]);  // Return an empty array as a fallback.
//       })
//     );
    
//   }

//   setFilter(filter: string) {
//     this.filterSubject.next(filter)
//     this.paginator.firstPage();
//   }

//   disconnect() {
//     this.userSubscription.unsubscribe();
//   }
// }