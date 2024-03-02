import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'decimalFormat',
  standalone: true
})
export class DecimalFormatPipe implements PipeTransform {

  transform(value: number): string {
    const formattedValue = value.toFixed(2); // Formats the number to at least two decimal places
    const withoutTrailingZeroes = formattedValue.replace(/\.00$/, ''); // Remove trailing ".00" if present
    return withoutTrailingZeroes.replace(/\B(?=(\d{3})+(?!\d))/g, ','); // Add commas as thousands separators
  }

}
