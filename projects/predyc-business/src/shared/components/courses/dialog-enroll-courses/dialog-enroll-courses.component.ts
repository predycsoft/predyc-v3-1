import { Component, Inject } from '@angular/core';
import { DocumentReference } from '@angular/fire/compat/firestore';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DialogCreateChargeComponent } from '../../charges/dialog-create-charge/dialog-create-charge.component';
import { Subscription, combineLatest } from 'rxjs';
import { CourseService } from '../../../services/course.service';
import { CategoryService } from '../../../services/category.service';
import { Category } from 'projects/shared/models/category.model';
import { Curso, CursoJson } from 'projects/shared/models/course.model';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource } from '@angular/material/table';
import { IconService } from '../../../services/icon.service';

interface CoursesForExplorer extends CursoJson {
  // categories: Category[],
  inStudyPlan: boolean
}

@Component({
  selector: 'app-dialog-enroll-courses',
  templateUrl: './dialog-enroll-courses.component.html',
  styleUrls: ['./dialog-enroll-courses.component.css']
})
export class DialogEnrollCoursesComponent {

  constructor (
    public matDialogRef: MatDialogRef<DialogCreateChargeComponent>, 
    public courseService: CourseService, 
    public categoryService: CategoryService, 
    public icon: IconService,
    @Inject(MAT_DIALOG_DATA) public data: {
      studentEnrolledCourses: DocumentReference[]
    },
  ) {}

  studentEnrolledCourses: DocumentReference[]
  combinedSubscription: Subscription

  courses: Curso[]
  categories: Category[]

  enrolledCourses: CoursesForExplorer[]
  nonEnrolledCourses: CoursesForExplorer[]

  // tables
  enrolleddataSource = new MatTableDataSource<CoursesForExplorer>();
  nonEnrolleddataSource = new MatTableDataSource<CoursesForExplorer>();

  enrolledDisplayedColumns: string[] = ["title"];
  nonEnrolledDisplayedColumns: string[] = ["checkbox", "title"];

  initialSelection: string[] = [];
  allowMultiSelect = true;
  selection: SelectionModel<string> = new SelectionModel<string>(
    this.allowMultiSelect,
    this.initialSelection
  );


  ngOnInit() {
    this.studentEnrolledCourses = this.data.studentEnrolledCourses

    console.log("this.studentEnrolledCourses", this.studentEnrolledCourses)

    this.combinedSubscription = combineLatest([this.categoryService.getCategories$(), this.courseService.getCourses$()]).subscribe(([categories, courses]) => {
      this.courses = courses.filter(x=> (!x.proximamente))
      this.categories = categories

      const coursesForExplorer: CoursesForExplorer[] = courses.map(course => {
        const inStudyPlan = this.studentEnrolledCourses.map(courseRef => courseRef.id).includes(course.id)
        return {
          ...course,
          inStudyPlan
        }
      })

      this.enrolledCourses = coursesForExplorer.filter(x=> (x.inStudyPlan))
      this.nonEnrolledCourses = coursesForExplorer.filter(x=> (!x.inStudyPlan))

      // this.filteredCourses = combineLatest([
      //   this.searchControl.valueChanges.pipe(startWith('')),
      //   this.hoverItem$
      // ]).pipe(
      //   map(([searchText, hoverCategory]) => {
      //     if (!searchText && !hoverCategory) return []
      //     let filteredCourses = this.coursesForExplorer
      //     if (hoverCategory) {
      //       filteredCourses = filteredCourses.filter(course => {
      //         const categories = course.categories.map(category => category.name)
      //         return categories.includes(hoverCategory.name)
      //       })
      //     }
      //     if (searchText) {
      //       const filterValue = searchText.toLowerCase();
      //       filteredCourses = filteredCourses.filter(course => course.titulo.toLowerCase().includes(filterValue));
      //     }
      //     return filteredCourses
      //   }
      // ))

      this.enrolleddataSource.data = this.enrolledCourses
      this.nonEnrolleddataSource.data = this.nonEnrolledCourses


    })

  }



    /** Whether the number of selected elements matches the total number of rows. */
    isAllSelected() {
      const numSelected = this.selection.selected.length;
      const numRows = this.nonEnrolleddataSource.data.length;
      return numSelected == numRows;
    }
  
    /** Selects all rows if they are not all selected; otherwise clear selection. */
    toggleAllRows() {
      this.isAllSelected()
        ? this.selection.clear()
        : this.nonEnrolleddataSource.data.forEach((row) => this.selection.select(row.id));
    }

    onSubmit() {
      console.log("this.selection.selected", this.selection.selected)
      this.matDialogRef.close(this.selection.selected);
    }
    
  
    
}
