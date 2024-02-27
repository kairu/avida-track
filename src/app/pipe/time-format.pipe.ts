import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'convertFrom24To12Format',
  standalone: true
})
export class TimeFormatPipe implements PipeTransform {

  transform(time: any): any {
    if (time === null || time === undefined) return null;
    const [hours, minutes] = time.split(':');
    const part = parseInt(hours) >= 12 ? 'PM' : 'AM';
    let convertedHours = (parseInt(hours) % 12) || 12;
    const formattedMinutes = minutes.padStart(2, '0');

    return `${convertedHours}:${formattedMinutes} ${part}`;
  }

}
