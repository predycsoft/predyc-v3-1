import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'customDate'
})
export class CustomDatePipe implements PipeTransform {
  private months: string[] = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
    'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  transform(value: any): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    const day = date.getDate();
    const month = this.months[date.getMonth()];
    const year = date.getFullYear();

    return `${day} de ${month} de ${year}`;
  }
}
