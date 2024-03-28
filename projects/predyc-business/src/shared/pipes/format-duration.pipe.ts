import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatDuration'
})
export class FormatDurationPipe implements PipeTransform {
  transform(value: number): string {
    const hours = Math.floor(value / 60);
    const minutes = Math.round(value % 60);

    if (hours > 0) {
      let formattedMinutes = minutes.toString().padStart(2, '0');
      return `${hours}:${formattedMinutes} horas`;
    } else {
      return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
    }
  }
}
