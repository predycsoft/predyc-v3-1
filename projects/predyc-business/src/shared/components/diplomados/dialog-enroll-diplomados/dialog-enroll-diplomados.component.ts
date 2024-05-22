import { Component, Inject } from '@angular/core';
import { DocumentReference } from '@angular/fire/compat/firestore';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DialogCreateChargeComponent } from '../../charges/dialog-create-charge/dialog-create-charge.component';
import { Observable, Subscription, combineLatest, filter, map, startWith } from 'rxjs';
import { CourseService } from '../../../services/course.service';
import { CategoryService } from '../../../services/category.service';
import { Category } from 'projects/shared/models/category.model';
import { Curso, CursoJson } from 'projects/shared/models/course.model';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource } from '@angular/material/table';
import { IconService } from '../../../services/icon.service';
import { FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DiplomadoService } from '../../../services/diplomado.service';

interface CoursesForExplorer extends CursoJson {
  // categories: Category[],
  inStudyPlan: boolean
}

@Component({
  selector: 'app-dialog-enroll-diplomados',
  templateUrl: './dialog-enroll-diplomados.component.html',
  styleUrls: ['./dialog-enroll-diplomados.component.css']
})
export class DialogEnrollDiplomadosComponent {

  constructor (
    public matDialogRef: MatDialogRef<DialogCreateChargeComponent>, 
    public courseService: CourseService, 
    private diplomadoService: DiplomadoService,
    public categoryService: CategoryService, 
    public icon: IconService,
    private activatedRoute: ActivatedRoute,
    @Inject(MAT_DIALOG_DATA) public data: {
      studentEnrolledDiplomados: DocumentReference[]
    },
  ) {}

  studentEnrolledDiplomados: DocumentReference[]
  combinedSubscription: Subscription

  diplomados: any[]
  categories: Category[]

  enrolledCourses: any[]
  nonEnrolledCourses: any[]

  queryParamsSubscription: Subscription
  filteredNonEnrolledCourses: Observable<any[]>

  // tables
  enrolleddataSource = new MatTableDataSource<any>();
  nonEnrolleddataSource = new MatTableDataSource<any>();

  enrolledDisplayedColumns: string[] = ["title","type"];
  nonEnrolledDisplayedColumns: string[] = ["checkbox", "title","type"];

  initialSelection: string[] = [];
  allowMultiSelect = true;
  selection: SelectionModel<string> = new SelectionModel<string>(
    this.allowMultiSelect,
    this.initialSelection
  );

  getTypeFullName(type){

    if(type == 'diplomado'){
      return 'Diplomado'
    }
    else if(type == 'pack'){
      return 'Pack de cursos'
    }
    else{
      return 'Plan de capacitación'
    }

  }


  ngOnInit() {
    this.studentEnrolledDiplomados = this.data.studentEnrolledDiplomados

    console.log("this.studentEnrolledDiplomados", this.studentEnrolledDiplomados)

    this.combinedSubscription = combineLatest([this.diplomadoService.getDiplomados$()]).subscribe(([diplomados]) => {

      
      this.diplomados = diplomados
      //this.categories = categories

      const coursesForExplorer: any[] = diplomados.map(diplomado => {
        const inStudyPlan = this.studentEnrolledDiplomados.map(courseRef => courseRef.id).includes(diplomado.id)
        let typeName = this.getTypeFullName(diplomado.type)
        return {
          ...diplomado,
          inStudyPlan,
          typeName
        }
      })

      // For enrolled diplomados list
      this.enrolledCourses = coursesForExplorer.filter(x=> (x.inStudyPlan))
      this.enrolleddataSource.data = this.enrolledCourses

      // For non enrolled diplomados list
      this.nonEnrolledCourses = coursesForExplorer.filter(x=> (!x.inStudyPlan))
      this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe(params => {
        // const page = Number(params['page']) || 1;
        const searchTerm = params['search'] || '';
        this.performSearch(searchTerm);
      })
    })

  }

  performSearch(searchTerm:string) {
      const filteredCourses = searchTerm ? this.nonEnrolledCourses.filter(diplomado => diplomado.name.toLowerCase().includes(searchTerm.toLowerCase())) : this.nonEnrolledCourses;
      // this.paginator.pageIndex = page - 1;
      this.nonEnrolleddataSource.data = filteredCourses
      // this.totalLength = filteredCharges.length;
  }

  salir(){
    this.matDialogRef.close(false)
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
