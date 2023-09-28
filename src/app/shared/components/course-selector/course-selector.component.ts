import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IconService } from '../../../shared/services/icon.service';


@Component({
  selector: 'app-course-selector',
  templateUrl: './course-selector.component.html',
  styleUrls: ['./course-selector.component.css']
})
export class CourseSelectorComponent {


  @Input() categories
  @Input() searchValue
  @Output() selectedCourseOut = new EventEmitter<any>();

  selectedCourse

  
  constructor(    
    public icon: IconService,
    ){
    
  }

  ngOnInit(): void {

    console.log('categories select course component',this.categories)
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    
  }

  getRounded(num: number): number {
    return Math.round(num);
  }

  selectCourse(course){

    this.selectedCourse = course
    this.selectedCourseOut.emit(course);

  }

  filteredCourses(categoryCourses) {
    console.log('categoryCourses',categoryCourses)
    let displayedCourses = categoryCourses
    if (this.searchValue) {
      displayedCourses= categoryCourses.filter(x => x.titulo.toLocaleLowerCase().includes(this.searchValue.toLocaleLowerCase()))
      if(displayedCourses.length > 0){
        console.log('search',displayedCourses);
        let categoriesCourse = displayedCourses[0].categories
        let categoryIds =[]
        categoriesCourse.forEach(skillRef => {
          categoryIds.push(skillRef.id); // Assuming skillRef has an id property
        });
        categoryIds.forEach(categoryId => {
          let category = this.categories.find(x => x.id == categoryId);
          category.expanded = true;
        });
       // this.categories.find(x => displayedCourses[0].categoria == x.name).expanded = true
      }
    }
    return displayedCourses
  }

}
