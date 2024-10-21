import { Component, EventEmitter, Input, Output, SimpleChanges } from "@angular/core";
import { IconService } from "projects/predyc-business/src/shared/services/icon.service";

import { cursosProximos } from "projects/predyc-business/src/assets/data/proximamente.data";
import { ActivityClassesService } from "../../services/activity-classes.service";
import { filter, take } from "rxjs";

@Component({
  selector: "app-course-selector",
  templateUrl: "./course-selector.component.html",
  styleUrls: ["./course-selector.component.css"],
})
export class CourseSelectorComponent {
  @Input() categories;
  @Input() type = "propios";
  @Input() searchValue;
  @Output() selectedCourseOut = new EventEmitter<any>();
  @Input() user
  @Input() showTitle = true


  processedCategories;
  selectedCourse;

  constructor(public icon: IconService, public activityClassesService: ActivityClassesService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["categories"] && changes["categories"].currentValue) {
      // console.log('changes categories',changes['categories']);
      this.processedCategories = changes["categories"].currentValue;
      let cursosProxmosIn = [];
      // console.log('cursosProxmos',cursosProximos,cursosProxmosIn)
      let proximamente = {
        name: "Proximamente",
      };
      this.processedCategories.push(proximamente);

      let proximos = this.processedCategories.find((x) => x.name == "Proximamente");
      proximos.coursesPredyc = cursosProxmosIn;
      proximos.courses = cursosProxmosIn;

      // console.log('proximos',proximos)
      // console.log('this.processedCategories',this.processedCategories)
    }
  }

  ngOnInit(): void {
    // console.log('categories select course component',this.categories)
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
  }

  hasOwnCourses() {
    for (let category of this.processedCategories) {
      if (category.coursesPropios?.length > 0) {
        return true;
      }
    }

    return false;
  }

  getRounded(num: number): number {
    return Math.round(num);
  }

  selectCourse(course) {
    this.selectedCourse = course;
    this.getExamCourse(course);
  }

  getExamCourse(course) {
    //console.log('idCourse search activity', idCourse);
    this.activityClassesService
      .getActivityCourse(course.id, "course")
      .pipe(take(1))
      .subscribe((data) => {
        if (data) {
          ////console.log('Activity:', data);
          ////console.log('Questions:', data.questions);
          data.questions.forEach((question) => {
            // //console.log('preguntas posibles test',question)
            question.competencias = question.skills;
          });
          let examen = data;
          course.test = examen;
          course.testDuration = examen.questions.length >= 60 ? 60 : examen.questions.length;
          this.selectedCourseOut.emit(course);
          //this.formatExamQuestions();
        } else {
          course.test = null;
          this.selectedCourseOut.emit(course);
        }
      });
  }

  filteredCourses(categoryCourses) {
    //console.log('categoryCourses',categoryCourses)
    let displayedCourses = categoryCourses;
    if (this.searchValue && this.searchValue.length > 0) {
      displayedCourses = categoryCourses?.filter((x) => x.titulo.toLocaleLowerCase().includes(this.searchValue.toLocaleLowerCase()));
      if (displayedCourses?.length > 0) {
        let categoriesCourse = displayedCourses[0].categories;
        let categoryIds = [];
        categoriesCourse.forEach((skillRef) => {
          categoryIds.push(skillRef.id); // Assuming skillRef has an id property
        });
        categoryIds.forEach((categoryId) => {
          let category = this.categories.find((x) => x.id == categoryId);
          if (this.type == "propios") {
            category.expandedPropios = true;
          } else {
            category.expandedPredyc = true;
          }
        });
        // this.categories.find(x => displayedCourses[0].categoria == x.name).expanded = true
      }
    }
    return displayedCourses;
  }
}
