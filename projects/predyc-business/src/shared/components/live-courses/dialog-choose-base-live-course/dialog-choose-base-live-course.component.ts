import { Component, Input } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Subscription, filter, take } from "rxjs";
import { DialogService } from "../../../services/dialog.service";
import { IconService } from "../../../services/icon.service";
import { LiveCourseService } from "../../../services/live-course.service";
import { LiveCourse, LiveCourseJson, LiveCourseTemplateJson } from "projects/shared/models/live-course.model";
import { Session, SessionJson, SessionTemplate } from "projects/shared/models/session.model";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivityClassesService } from "../../../services/activity-classes.service";
import { Question } from "projects/shared/models/activity-classes.model";
import Swal from "sweetalert2";
import { AlertsService } from "../../../services/alerts.service";

interface LiveCourseTemplateWithSessionsTemplates extends LiveCourseTemplateJson {
  sessions: SessionTemplate[];
}

interface FormValue {
  baseCourse: LiveCourseTemplateWithSessionsTemplates;
  identifyingText: string;
  meetingLink: string;
  sessionsDates: {};
}

@Component({
  selector: "app-dialog-choose-base-live-course",
  templateUrl: "./dialog-choose-base-live-course.component.html",
  styleUrls: ["./dialog-choose-base-live-course.component.css"],
})
export class DialogChooseBaseLiveCourseComponent {
  constructor(private alertService: AlertsService, public activeModal: NgbActiveModal, public icon: IconService, public dialogService: DialogService, private liveCourseService: LiveCourseService, private fb: FormBuilder, public activityClassesService: ActivityClassesService) {}

  combinedServicesSubscription: Subscription;
  baseLiveCourses: LiveCourseTemplateWithSessionsTemplates[];
  sessions: SessionTemplate[];
  liveCourseDiagnosticTest;
  liveCourseFinalTest;
  liveCourseTestSubscription: Subscription;
  formNewCourse: FormGroup;

  textoBtnConfirmar = 'Agregar curso en vivo'

  @Input() datosCurso: any

  ngOnInit(): void {
    this.formNewCourse = this.fb.group({
      baseCourse: ["", Validators.required],
      meetingLink: ["", Validators.required],
      identifyingText: ["", Validators.required],
      sessionsDates: this.fb.group({}), // This will be dynamically added
    });

    this.liveCourseService.getAllLiveCoursesTemplatesWithSessionsTemplates$().subscribe((liveCoursesTemplates) => {
      this.baseLiveCourses = liveCoursesTemplates.map((x) => {
        return {
          ...x.liveCourseTemplate,
          sessions: x.sessionsTemplates,
        };
      });
      // console.log("baseLiveCourses", liveCoursesTemplates)
      if(this.datosCurso){
        this.textoBtnConfirmar = 'Configurar curso en vivo'
        console.log('datos',this.datosCurso,this.baseLiveCourses)
        let baseCurso = this.baseLiveCourses.find(x=>x.id ==this.datosCurso.curso.id )
        let  currentDate = null
        if(this.datosCurso.date){
          currentDate =  this.formatDateLiteral(this.datosCurso.date)
        }
        this.setBaseCourse(baseCurso, currentDate);
        this.formNewCourse.patchValue({ baseCourse: baseCurso });

        if(this.datosCurso?.meetingLink){
          this.formNewCourse.patchValue({ meetingLink: this.datosCurso.meetingLink });
        }

        if(this.datosCurso?.identifyingText){
          this.formNewCourse.patchValue({ identifyingText: this.datosCurso.identifyingText });
        }
      }
    });

  }

  formatDateLiteral(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses en JS son 0-indexados
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
  
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  setBaseCourse(baseCourse: any, startDate?: string) {
    this.sessions = baseCourse.sessions;

    const sessionGroup = this.formNewCourse.get("sessionsDates") as FormGroup;

    Object.keys(sessionGroup.controls).forEach((key) => {
      sessionGroup.removeControl(key);
    });

    const firstSession = baseCourse.sessions[0];
    sessionGroup.addControl(firstSession.id, this.fb.control(startDate || "", Validators.required));

    this.liveCourseDiagnosticTest = null;
    this.liveCourseFinalTest = null;
    this.getExamCourse(baseCourse.id);
  }

  _setBaseCourse(baseCourse: LiveCourseTemplateWithSessionsTemplates) {
    console.log("baseCourse", baseCourse);
    this.sessions = baseCourse.sessions;

    const sessionGroup = this.formNewCourse.get("sessionsDates") as FormGroup;

    Object.keys(sessionGroup.controls).forEach((key) => {
      sessionGroup.removeControl(key);
    });

    const firstSession = baseCourse.sessions[0];
    sessionGroup.addControl(firstSession.id, this.fb.control("", Validators.required));

    this.liveCourseDiagnosticTest = null;
    this.liveCourseFinalTest = null;
    this.getExamCourse(baseCourse.id);
  }

  getExamCourse(idCourse: string) {
    //console.log('idCourse search activity', idCourse);
    if (this.liveCourseTestSubscription) this.liveCourseTestSubscription.unsubscribe();
    this.liveCourseTestSubscription = this.activityClassesService
    .getCourseActivities(idCourse, "liveCourseTemplate")
    .pipe(
      filter((data) => data != null),
      take(1)
    )
    .subscribe((courseActivities) => {
      if (courseActivities) {
        // console.log('Activity:', courseActivities);
        const diagnosticTest = courseActivities.filter(x => x.type == "test")[0]
        const finalTest = courseActivities.filter(x => x.type == "final-test")[0]


        //console.log('Questions:', data.questions);
        diagnosticTest.questions.forEach((question) => {
          // //console.log('preguntas posibles test',question)
          question.competencias = question.skills;
        });
        this.liveCourseDiagnosticTest = diagnosticTest;
        // console.log('examen data edit',this.liveCourseDiagnosticTest)

        //console.log('Questions:', data.questions);
        finalTest.questions.forEach((question) => {
          // //console.log('preguntas posibles test',question)
          question.competencias = question.skills;
        });
        this.liveCourseFinalTest = finalTest;
        // console.log('examen data edit',this.examen)
      }
    });
  }

  getOptionText(option: LiveCourseTemplateWithSessionsTemplates) {
    return option.title;
  }

  async onSave() {
    // console.log("this.formNewCourse", this.formNewCourse)
    if (this.formNewCourse.valid) {
      const formValue: FormValue = this.formNewCourse.value;
      if(!this.datosCurso){

        Swal.fire({
          title: "Generando curso en vivo...",
          text: "Por favor, espera.",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });
        
        await this.liveCourseService.saveLiveCourseComplete(this.activityClassesService,formValue,this.sessions,this.liveCourseDiagnosticTest,this.liveCourseFinalTest)
        this.alertService.succesAlert("El curso en vivo se ha guardado exitosamente");
        this.activeModal.close();
      }
      else{
        let datos = {
          formValue:formValue,
          sessions:this.sessions,
          liveCourseDiagnosticTest:this.liveCourseDiagnosticTest,
          liveCourseFinalTest:this.liveCourseFinalTest
        }
        this.activeModal.close(datos);
      }
      //this.closeDialog();
    } else console.log("Form is invalid");
  }

  parseDateString(date: string): Date {
    date = date.replace("T", "-");
    let parts = date.split("-");
    let timeParts = parts[3].split(":");

    // new Date(year, month [, day [, hours[, minutes[, seconds[, ms]]]]])
    return new Date(+parts[0], +parts[1] - 1, +parts[2], +timeParts[0], +timeParts[1]); // Note: months are 0-based
  }

  closeDialog() {
    this.activeModal.dismiss();
  }
}
