import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Notification } from '../../models/notification.model';

const ELEMENT_DATA: Notification[] = [
  {
    id: '1',
    readByUsers: [],
    readByAdmin: false,
    message: 'Mensaje de prueba',
    date: 123456,
    userId: '1',
    empresaId: '1',
    type: 'alert',
  },
  {
    id: '2',
    readByUsers: [],
    readByAdmin: false,
    message: 'Mensaje de prueba1',
    date: 123456,
    userId: '1',
    empresaId: '1',
    type: 'activity',
  },
  {
    id: '3',
    readByUsers: [],
    readByAdmin: false,
    message: 'Mensaje de prueba2',
    date: 123456,
    userId: '1',
    empresaId: '1',
    type: 'request',
  },
];

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent {
  displayedColumns: string[] = [
    'position',
    'name',
  ]
  dataSource = new MatTableDataSource(ELEMENT_DATA);
  
  // filteredData: Element[] = [...this.dataSource];

  // applyFilter(filterValue: string) {
  //   this.filteredData = this.dataSource.filter(element => element.hiddenAttribute.includes(filterValue));
  // }

}
