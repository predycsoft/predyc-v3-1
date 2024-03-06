import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';

import { cursosProximos } from 'projects/predyc-business/src/assets/data/proximamente.data'



@Component({
  selector: 'app-course-selector',
  templateUrl: './course-selector.component.html',
  styleUrls: ['./course-selector.component.css']
})
export class CourseSelectorComponent {


  @Input() categories
  @Input() type = 'propios'
  @Input() searchValue
  @Output() selectedCourseOut = new EventEmitter<any>();
  

  processedCategories
  selectedCourse

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['categories'] && changes['categories'].currentValue) {
      console.log('changes categories',changes['categories']);
      this.processedCategories = this.structuredClone(changes['categories'].currentValue);
      let cursosProxmosIn = cursosProximos
      console.log('cursosProxmos',cursosProximos,cursosProxmosIn)
      let proximamente = {
        name:'Proximamente'
      }
      this.processedCategories.push(proximamente)

      let proximos = this.processedCategories.find(x=> x.name == 'Proximamente')
      proximos.coursesPredyc = cursosProxmosIn
      proximos.courses = cursosProxmosIn

      console.log('proximos',proximos)


      console.log('this.processedCategories',this.processedCategories)


    }
  }

  structuredClone(categories) {

    return categories

    console.log('categories original',categories)

    let categoriesOut = JSON.stringify(categories);
    categoriesOut = JSON.parse(categoriesOut)
    
    return categoriesOut;

  }

  
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
    //console.log('categoryCourses',categoryCourses)
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
          if(this.type == 'propios'){
            category.expandedPropios = true;
          }
          else{
            category.expandedPredyc = true;
          }
        });
       // this.categories.find(x => displayedCourses[0].categoria == x.name).expanded = true
      }
    }
    return displayedCourses
  }

}
