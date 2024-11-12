import { Component, Input } from '@angular/core';
import { GroupedLogs } from '../logs.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-dialog-component-logs-detail',
  templateUrl: './dialog-component-logs-detail.component.html',
  styleUrls: ['./dialog-component-logs-detail.component.css']
})
export class DialogComponentLogsDetailComponent {
  
  @Input() componentLogs: GroupedLogs;

  displayedColumns: string[] = [
    'URL', 
    'AuthUser', 
    'AuthUserId', 
    'enterpriseName',
    'enterpriseId',
    'Date', 
  ];

  constructor(
    public activeModal: NgbActiveModal,
  ) {}

  ngOnInit(): void {
    this.componentLogs.componentsData = this.componentLogs.componentsData.sort((a, b) => b.date - a.date);
    console.log("this.componentLogs", this.componentLogs);
  }

  closeDialog() {
    this.activeModal.dismiss('Cross click');
  }
}
