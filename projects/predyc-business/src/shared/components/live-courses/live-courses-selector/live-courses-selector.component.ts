import { Component, EventEmitter, Input, Output, SimpleChanges } from "@angular/core";
import { IconService } from "../../../services/icon.service";

@Component({
  selector: "app-live-courses-selector",
  templateUrl: "./live-courses-selector.component.html",
  styleUrls: ["./live-courses-selector.component.css"],
})
export class LiveCoursesSelectorComponent {
  @Input() categories;
  @Input() searchValue;
  @Output() selectedCourseOut = new EventEmitter<any>();

  processedCategories;
  selectedCourse;

  constructor(public icon: IconService) {}

  ngOnChanges(changes: SimpleChanges): void {
    // console.log("changes", changes)
    if (changes["categories"] && changes["categories"].currentValue) {
      // console.log('changes categories', changes['categories']);
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
    }

    // if (changes['categories'] && changes['searchValue'].currentValue) {

    // }
  }

  ngOnInit(): void {}

  getRounded(num: number): number {
    return Math.round(num);
  }

  selectCourse(course) {
    this.selectedCourse = course;
    this.getExamCourse(course);
  }

  getExamCourse(course) {
    // console.log('idCourse search activity', idCourse);
    // this.activityClassesService.getActivityCourse(course.id, false).pipe(take(1)).subscribe(data => {
    //   if (data) {
    //     data.questions.forEach(question => {
    //       question.competencias = question.skills
    //     });
    //     let examen = data;
    //     course.test = examen;
    //     course.testDuration = examen.questions.length>= 60 ? 60 : examen.questions.length
    //     this.selectedCourseOut.emit(course);
    //     //this.formatExamQuestions();
    //   }
    //   else{
    //     course.test = null;
    //     this.selectedCourseOut.emit(course);
    //   }
    // });

    // Fix this
    course.test = null;
    console.log("course", course);
    this.selectedCourseOut.emit(course);
  }

  filteredCourses(categoryCourses): any {
    // console.log('categoryCourses',categoryCourses)
    let displayedCourses = categoryCourses;
    if (this.searchValue && this.searchValue.length > 0) {
      displayedCourses = categoryCourses.filter((x) => x.title.toLocaleLowerCase().includes(this.searchValue.toLocaleLowerCase()));
      if (displayedCourses.length > 0) {
        let categoriesCourse = displayedCourses[0].categories;
        let categoryIds = [];
        categoriesCourse.forEach((skillRef) => {
          categoryIds.push(skillRef.id);
        });
        categoryIds.forEach((categoryId) => {
          let category = this.categories.find((x) => x.id == categoryId);
          category.expanded = true;
        });
      }
    }
    // console.log("displayedCourses", displayedCourses)
    return displayedCourses;
  }
}
