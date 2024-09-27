import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'numberAbbreviate'
})
export class NumberAbbreviatePipe implements PipeTransform {

  transform(value: number, currencySymbol: string = 'USD'): string {
    if (value >= 1e6) {
      return (value / 1e6).toFixed(2) + 'M ' + currencySymbol;
    } else if (value >= 1e3) {
      return (value / 1e3).toFixed(2) + 'K ' + currencySymbol;
    } else {
      return value.toFixed(0) + ' ' + currencySymbol;
    }
  }
}
