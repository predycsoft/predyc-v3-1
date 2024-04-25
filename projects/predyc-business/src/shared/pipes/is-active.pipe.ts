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

    else if(link =='management/certifications' && currentUrl.includes('certifications')){
      return true
    }

    else if (link === '/admin' && currentUrl === '/admin') {
      return true;
    }
    else if (link == '/admin/create-demo' && currentUrl.includes('create-demo')) {
      return true;
    }
    else if (link == '/admin/students' && currentUrl.includes('students')) {
      return true;
    }
    else if (link == '/admin/enterprises' && currentUrl.includes('enterprises')) {
      return true;
    }
    else if (link == '/admin/products' && currentUrl.includes('products')) {
      return true;
    }
    else if (link == '/admin/licenses-and-subscriptions' && currentUrl.includes('licenses-and-subscriptions')) {
      return true;
    }
    else if (link == '/admin/royalties' && currentUrl.includes('royalties')) {
      return true;
    }
    else if (link == '/admin/sales' && currentUrl.includes('sales')) {
      return true;
    }
    else if (link == '/admin/courses' && currentUrl.includes('courses')) {
      return true;
    }
    else if (link == '/admin/freebies' && currentUrl.includes('freebies')) {
      return true;
    }
    else if (link == '/admin/questions' && currentUrl.includes('questions')) {
      return true;
    }
    else if (link == '/admin/certifications' && currentUrl.includes('certifications')) {
      return true;
    }
    return false

  }
}
