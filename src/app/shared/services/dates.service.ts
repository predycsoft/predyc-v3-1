import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DatesService {

  constructor() { }


  dateFromCalendarToTimestamp(date: string): number {
    let [año, mes, día] = date.split('-').map(Number);
    let timestamp = Date.UTC(año, mes - 1, día); 
    return timestamp
  }

  timestampToDateNumbers(timestamp: number): object {
    const date: Date = new Date(timestamp); 
    const minutes: number = date.getUTCMinutes()
    const hours: number = date.getUTCHours();
    const day: number = date.getUTCDate();
    const month: number = date.getUTCMonth() + 1;
    const year: number = date.getUTCFullYear();
    return {minutes, hours, day, month, year}
  }
}
