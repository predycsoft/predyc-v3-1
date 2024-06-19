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
    });
  }

  setBaseCourse(baseCourse: LiveCourseTemplateWithSessionsTemplates) {
    // console.log("baseCourse", baseCourse);
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
    Swal.fire({
      title: "Generando curso en vivo...",
      text: "Por favor, espera.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    // console.log("this.formNewCourse", this.formNewCourse)
    if (this.formNewCourse.valid) {
      const formValue: FormValue = this.formNewCourse.value;
      // console.log('Form Value:', formValue);
      // copy the template data
      const liveCourseTemplateData = { ...formValue.baseCourse };
      delete liveCourseTemplateData.sessions;
      // Save live course
      let liveCourse: any = {
        ...liveCourseTemplateData,
        id: null,
        liveCourseTemplateRef: this.liveCourseService.getLiveCourseTemplateRefById(liveCourseTemplateData.id),
        meetingLink: formValue.meetingLink,
        identifierText: formValue.identifyingText,
        emailLastDate: null,
      };
      // console.log("liveCourse", liveCourse)
      const liveCourseId = await this.liveCourseService.saveLiveCourse(liveCourse);
      const liveCourseRef = this.liveCourseService.getLiveCourseRefById(liveCourseId);
      // Save first session with date
      const firstSessionDate = this.parseDateString(formValue.sessionsDates[this.sessions[0].id]);
      // copy the template data
      const sessionTemplateData = { ...this.sessions[0] };
      delete sessionTemplateData.liveCourseTemplateRef;
      const firstSession: any = {
        ...sessionTemplateData,
        id: null,
        date: firstSessionDate,
        liveCourseRef: liveCourseRef,
        sessionTemplateRef: this.liveCourseService.getSessionTemplateRefById(sessionTemplateData.id),
        vimeoId1: null,
        vimeoId2: null,
        weeksToKeep: 2,
      };
      // console.log("firstSession", firstSession)
      await this.liveCourseService.saveSession(firstSession);
      // Save rest of sessions without date
      for (let i = 1; i < this.sessions.length; i++) {
        const followingSessionTemplateData = { ...this.sessions[i] };
        delete followingSessionTemplateData.liveCourseTemplateRef;
        const followingSession: any = {
          ...followingSessionTemplateData,
          id: null,
          date: null,
          liveCourseRef: liveCourseRef,
          sessionTemplateRef: this.liveCourseService.getSessionTemplateRefById(followingSessionTemplateData.id),
          vimeoId1: null,
          vimeoId2: null,
          weeksToKeep: 2,
        };
        // console.log("followingSession", followingSession)
        await this.liveCourseService.saveSession(followingSession);
      }

      // Save tests
      if (this.liveCourseDiagnosticTest) {
        this.liveCourseDiagnosticTest.id = null;
        this.liveCourseDiagnosticTest.coursesRef = [liveCourseRef];
        const activityId = await this.activityClassesService.saveActivity(this.liveCourseDiagnosticTest);

        let questions: Question[] = [];
        questions = structuredClone(this.liveCourseDiagnosticTest.questions);
        for (let pregunta of questions) {
          delete pregunta["competencias_tmp"];
          delete pregunta["competencias"];
          delete pregunta["isInvalid"];
          delete pregunta["InvalidMessages"];
          delete pregunta["expanded_categorias"];
          delete pregunta["expanded"];
          delete pregunta["uploading_file_progress"];
          delete pregunta["uploading"];
          await this.activityClassesService.saveQuestion(pregunta, activityId);
        }
      }
      if (this.liveCourseFinalTest) {
        this.liveCourseFinalTest.id = null;
        this.liveCourseFinalTest.coursesRef = [liveCourseRef];
        const activityId = await this.activityClassesService.saveActivity(this.liveCourseFinalTest);

        let questions: Question[] = [];
        questions = structuredClone(this.liveCourseFinalTest.questions);
        for (let pregunta of questions) {
          delete pregunta["competencias_tmp"];
          delete pregunta["competencias"];
          delete pregunta["isInvalid"];
          delete pregunta["InvalidMessages"];
          delete pregunta["expanded_categorias"];
          delete pregunta["expanded"];
          delete pregunta["uploading_file_progress"];
          delete pregunta["uploading"];
          await this.activityClassesService.saveQuestion(pregunta, activityId);
        }
      }
      this.alertService.succesAlert("El curso en vivo se ha guardado exitosamente");
      this.closeDialog();
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
    this.activeModal.dismiss("Cross click");
  }
}
