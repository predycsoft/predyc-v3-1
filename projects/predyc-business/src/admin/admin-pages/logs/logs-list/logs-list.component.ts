import { Component, Input, SimpleChanges, ViewChild } from '@angular/core';
import { ComponentLog } from 'projects/shared/models/component-log.model';
import { GroupedLogs } from '../logs.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { firestoreTimestampToNumberTimestamp } from 'projects/shared/utils';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DialogComponentLogsDetailComponent } from '../dialog-component-logs-detail/dialog-component-logs-detail.component';

@Component({
  selector: 'app-logs-list',
  templateUrl: './logs-list.component.html',
  styleUrls: ['./logs-list.component.css']
})
export class LogsListComponent {
  @Input() logs: GroupedLogs[] = [];

  constructor(
		private modalService: NgbModal,
  ){}

  displayedColumns: string[] = [
    'ComponentName',
    'NumberOfVisits',
    'TotalReadCount'
  ];
  
  dataSource = new MatTableDataSource<GroupedLogs>();

  @ViewChild(MatPaginator) paginator: MatPaginator;
  
  totalReadCountSum = 0
  
  ngOnChanges(changes: SimpleChanges) {
    if (changes.logs && changes.logs.currentValue) {
      this.dataSource.data = this.logs;
      this.totalReadCountSum = this.dataSource.data.reduce((sum, log) => sum + (log.totalReadCount || 0), 0);
    }
  }

  ngOnInit() {
    this.dataSource.data = this.logs;
    this.totalReadCountSum = this.dataSource.data.reduce((sum, log) => sum + (log.totalReadCount || 0), 0);
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  async onSelect(selectedComponentLogs: GroupedLogs) {
		const modalRef = this.modalService.open(DialogComponentLogsDetailComponent, {
			animation: true,
			centered: true,
			size: "xl",
			// backdrop: "static",
			keyboard: false,
			// windowClass: 'modWidth'
		});

		modalRef.componentInstance.componentLogs = selectedComponentLogs;
	}
}