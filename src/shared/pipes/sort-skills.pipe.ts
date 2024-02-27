import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sortSkills'
})
export class SortSkillsPipe implements PipeTransform {

  transform(array: any[], field: string): any[] {
    if (!Array.isArray(array)) {
      return [];
    }
    array.sort((a, b) => {
      if (a[field] < b[field]) {
        return -1;
      } else if (a[field] > b[field]) {
        return 1;
      } else {
        return 0;
      }
    });
    return array;
  }

}
