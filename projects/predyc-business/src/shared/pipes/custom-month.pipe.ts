import { Pipe, PipeTransform } from '@angular/core';
import { capitalizeFirstLetter } from 'projects/shared/utils';

@Pipe({
  name: 'customMonth'
})
export class CustomMonthPipe implements PipeTransform {

  private months: string[] = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
    'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  transform(value: number): string {
    const month = this.months[value];

    return capitalizeFirstLetter(month);
  }

}
