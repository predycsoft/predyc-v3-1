import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { DialogService } from '../../../services/dialog.service';
import { IconService } from '../../../services/icon.service';
import { LiveCourseService } from '../../../services/live-course.service';
import { LiveCourse, LiveCourseJson, LiveCourseTemplateJson } from 'projects/shared/models/live-course.model';
import { Session, SessionJson, SessionTemplate } from 'projects/shared/models/session.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

interface LiveCourseTemplateWithSessionsTemplates extends LiveCourseTemplateJson {
  sessions: SessionTemplate[]
}

interface FormValue {
  baseCourse: LiveCourseTemplateWithSessionsTemplates
  identifyingText: string
  meetingLink: string
  sessionsDates: {}
}

@Component({
  selector: 'app-dialog-choose-base-live-course',
  templateUrl: './dialog-choose-base-live-course.component.html',
  styleUrls: ['./dialog-choose-base-live-course.component.css']
})
export class DialogChooseBaseLiveCourseComponent {

  constructor(
    public activeModal: NgbActiveModal,
    public icon: IconService,
    public dialogService: DialogService,
    private liveCourseService: LiveCourseService,
    private fb: FormBuilder,
  ) {}

  combinedServicesSubscription: Subscription;
  baseLiveCourses: LiveCourseTemplateWithSessionsTemplates[];
  sessions: SessionTemplate[];
  formNewCourse: FormGroup;


  ngOnInit(): void {
    this.formNewCourse = this.fb.group({
      baseCourse: ['', Validators.required],
      meetingLink: ['', Validators.required],
      identifyingText: ['', Validators.required],
      sessionsDates: this.fb.group({})  // This will be dynamically added
    });

    this.liveCourseService.getAllLiveCoursesTemplatesWithSessionsTemplates$().subscribe(liveCoursesTemplates => {
      this.baseLiveCourses = liveCoursesTemplates.map(x => {
        return { 
          ...x.liveCourseTemplate, 
          sessions: x.sessionsTemplates
        }
      });
      // console.log("baseLiveCourses", liveCoursesTemplates)
    });
  }

  setBaseCourse(baseCourse: LiveCourseTemplateWithSessionsTemplates) {
    // console.log("baseCourse", baseCourse);
    this.sessions = baseCourse.sessions;
  
    const sessionGroup = this.formNewCourse.get('sessionsDates') as FormGroup;

    Object.keys(sessionGroup.controls).forEach(key => {
      sessionGroup.removeControl(key);
    });

    const firstSession = baseCourse.sessions[0];
    sessionGroup.addControl(firstSession.id, this.fb.control('', Validators.required));
 
  }

  getOptionText(option: LiveCourseTemplateWithSessionsTemplates) {
    return option.title;
  }

  async onSave() {
    // console.log("this.formNewCourse", this.formNewCourse)
    if (this.formNewCourse.valid) {
      const formValue: FormValue = this.formNewCourse.value;
      // console.log('Form Value:', formValue);
      // copy the template data
      const liveCourseTemplateData = {...formValue.baseCourse}
      delete liveCourseTemplateData.sessions
      // Save live course son
      let liveCourse: LiveCourseJson = {
        ...liveCourseTemplateData,
        id: null,
        liveCourseTemplateRef: this.liveCourseService.getLiveCourseTemplateRefById(liveCourseTemplateData.id),
        meetingLink: formValue.meetingLink, 
        identifierText: formValue.identifyingText,
        emailLastDate: null
      }
      // console.log("liveCourse", liveCourse)
      const liveCourseId = await this.liveCourseService.saveLiveCourse(liveCourse)

      // Save first session with date
      const firstSessionDate = this.parseDateString(formValue.sessionsDates[this.sessions[0].id]);
      // copy the template data
      const sessionTemplateData = {...this.sessions[0]}
      delete sessionTemplateData.liveCourseTemplateRef
      const firstSession: SessionJson = {
        ...sessionTemplateData,
        id: null,
        date: firstSessionDate,
        liveCourseRef: this.liveCourseService.getLiveCourseRefById(liveCourseId),
        sessionTemplateRef: this.liveCourseService.getSessionTemplateRefById(sessionTemplateData.id),
        vimeoId1: null,
        vimeoId2: null,
        weeksToKeep: 2,
      }
      // console.log("firstSession", firstSession)
      await this.liveCourseService.saveSession(firstSession);
      // Save rest of sessions without date
      for (let i = 1; i < this.sessions.length; i++) {
        const followingSessionTemplateData = {...this.sessions[i]}
        delete followingSessionTemplateData.liveCourseTemplateRef
        const followingSession: SessionJson = {
          ...followingSessionTemplateData,
          id: null,
          date: null,
          liveCourseRef: this.liveCourseService.getLiveCourseRefById(liveCourseId),
          sessionTemplateRef: this.liveCourseService.getSessionTemplateRefById(followingSessionTemplateData.id),
          vimeoId1: null,
          vimeoId2: null,
          weeksToKeep: 2,
        }
        // console.log("followingSession", followingSession)
        await this.liveCourseService.saveSession(followingSession);
      }

      this.closeDialog();
    } 
    else console.log('Form is invalid');
  }

  parseDateString(date: string): Date {
    date = date.replace("T", "-");
    let parts = date.split("-");
    let timeParts = parts[3].split(":");

    // new Date(year, month [, day [, hours[, minutes[, seconds[, ms]]]]])
    return new Date(
      +parts[0],
      +parts[1] - 1,
      +parts[2],
      +timeParts[0],
      +timeParts[1]
    ); // Note: months are 0-based
  }

  closeDialog() {
    this.activeModal.dismiss('Cross click');
  }
}