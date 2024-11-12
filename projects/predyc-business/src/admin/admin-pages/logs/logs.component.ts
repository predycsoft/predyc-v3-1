import { Component } from '@angular/core';
import { LoggingService } from 'projects/predyc-business/src/shared/services/logging.service';
import { ComponentLog } from 'projects/shared/models/component-log.model';
import { firestoreTimestampToNumberTimestamp } from 'projects/shared/utils';

export interface GroupedLogs {
  componentName: string;
  componentsData: ComponentLog[];
}

@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.css']
})
export class LogsComponent {
  constructor(
    private loggingService: LoggingService,
  ) {}

  groupedLogs: GroupedLogs[] = [];
  filteredLogs: GroupedLogs[] = [];
  customDate: any;
  selectedOption = 'Seleccionar dia';

  async ngOnInit() {
    const logsData: ComponentLog[] = await this.loggingService.getLogs();
    // console.log("logsData", logsData)
    logsData.forEach(log => {
      if (log.date) {
        log.date = firestoreTimestampToNumberTimestamp(log.date) as number;
      }
    });
    this.groupedLogs = Object.values(
      logsData.reduce((acc, log) => {
        const { componentName } = log;
        if (!acc[componentName]) {
            acc[componentName] = { componentName, componentsData: [] };
        }
        acc[componentName].componentsData.push(log);
        return acc;
      }, {} as { [key: string]: { componentName: string; componentsData: ComponentLog[] } })
    );
    // console.log("this.groupedLogs", this.groupedLogs)
  }

  onOptionChange() {
    switch (this.selectedOption) {
      case 'Seleccionar dia':
        this.customDate = null
        this.filteredLogs = [];
        break;
      case 'Ultimos 7 dias':
        this.filterLastNDays(7);
        break;
      case 'Mes actual':
        this.monthSelected();
        break;
      case 'Todos':
        this.filteredLogs = [...this.groupedLogs];
        console.log("this.filteredLogs", this.filteredLogs)
        break;
    }
  }

  onCustomDateChange() {
    if (!this.customDate) return;
    
    const [year, month, day] = this.customDate.split('-').map(Number);
    const startOfDay = new Date(year, month - 1, day).getTime();
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999).getTime();

    this.filteredLogs = this.groupedLogs.map(group => ({
      ...group,
      componentsData: group.componentsData.filter(log => log.date >= startOfDay && log.date <= endOfDay)
    })).filter(group => group.componentsData.length > 0);

    console.log("this.filteredLogs", this.filteredLogs)

  }

  filterLastNDays(days: number) {
    const now = Date.now();
    const startDate = now - days * 24 * 60 * 60 * 1000;

    this.filteredLogs = this.groupedLogs.map(group => ({
      ...group,
      componentsData: group.componentsData.filter(log => log.date >= startDate && log.date <= now)
    })).filter(group => group.componentsData.length > 0);

    console.log("this.filteredLogs", this.filteredLogs)

  }

  monthSelected() {
    const today = new Date();
  
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999).getTime();

    // Filter logs within the current month
    this.filteredLogs = this.groupedLogs.map(group => ({
      ...group,
      componentsData: group.componentsData.filter(log => log.date >= startOfMonth && log.date <= endOfMonth)
    })).filter(group => group.componentsData.length > 0);

    console.log("this.filteredLogs", this.filteredLogs)
    
  }
  
}

