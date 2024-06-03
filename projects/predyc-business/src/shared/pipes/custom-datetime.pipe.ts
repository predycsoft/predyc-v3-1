import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'customDatetime'
})
export class CustomDatetimePipe implements PipeTransform {

  transform(value: any, ...args: any[]): any {
    if (!value) return '';
    let date: Date
    if (value.seconds) date = new Date(value.seconds * 1000);
    else date = new Date(value);

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} a las ${hours}:${minutes}`;
  }

}
