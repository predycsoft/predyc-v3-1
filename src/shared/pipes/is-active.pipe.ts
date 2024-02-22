import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'isActive',
  pure: true // El pipe puede permanecer puro
})
export class IsActivePipe implements PipeTransform {
  transform(link: string, currentUrl: string): boolean {

    if(currentUrl == '/' && link ==''){
      return true
    }
    else if(link =='management/students' && currentUrl.includes('students')){
      return true
    }
    else if(link =='management/courses' && currentUrl.includes('course')){
      return true
    }
    else if(link =='settings' && currentUrl.includes('settings')){
      return true
    }
    else if(link =='management/create-demo' && currentUrl.includes('create-demo')){
      return true
    }
    else if (link === '/admin' && currentUrl === '/admin') {
      return true;
    }
    else if (link == '/admin/create-demo' && currentUrl.includes('create-demo')) {
      return true;
    }
    return false

  }
}
