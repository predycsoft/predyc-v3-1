import { Component, Input, SimpleChanges, ViewChild } from '@angular/core';
import { ComponentLog } from 'projects/shared/models/component-log.model';
import { GroupedLogs } from '../logs.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { firestoreTimestampToNumberTimestamp } from 'projects/shared/utils';

@Component({
  selector: 'app-logs-list',
  templateUrl: './logs-list.component.html',
  styleUrls: ['./logs-list.component.css']
})
export class LogsListComponent {
  @Input() logs: GroupedLogs[] = [];

  displayedColumns: string[] = [
    'ComponentName', 
    'NumberOfVisits', 
    // 'URL', 
    // 'UserID', 
    // 'UserName', 
    // 'Date'
  ];
  dataSource = new MatTableDataSource<GroupedLogs>();

  @ViewChild(MatPaginator) paginator: MatPaginator;
  
  ngOnChanges(changes: SimpleChanges) {
    if (changes.logs && changes.logs.currentValue) {
      this.dataSource.data = this.logs;
    }
  }

  ngOnInit() {
    this.dataSource.data = this.logs;
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }
}