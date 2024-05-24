import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { DialogService } from '../../../services/dialog.service';
import { IconService } from '../../../services/icon.service';
import { LiveCourseService } from '../../../services/live-course.service';
import { LiveCourse, LiveCourseJson, LiveCourseSon, LiveCourseSonJson } from 'projects/shared/models/live-course.model';
import { Session, SessionSonJson } from 'projects/shared/models/session.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

interface LiveCourseWithSessions extends LiveCourseJson {
  sessions: Session[]
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
    private fb: FormBuilder
  ) {}

  combinedServicesSubscription: Subscription;
  baseLiveCourses: LiveCourseWithSessions[];
  sessions: Session[];
  formNewCourse: FormGroup;

  ngOnInit(): void {
    this.formNewCourse = this.fb.group({
      baseCourse: ['', Validators.required],
      meetingLink: ['', Validators.required],
      identifyingText: ['', Validators.required],
      sessionsDates: this.fb.group({})  // This will be dynamically added
    });

    this.liveCourseService.getAllLiveCoursesWithSessions$().subscribe(baseLiveCourses => {
      this.baseLiveCourses = baseLiveCourses.map(x => {
        return { 
          ...x.liveCourse, 
          sessions: x.sessions
        }
      });
    });
  }

  setBaseCourse(baseCourse: LiveCourseWithSessions) {
    console.log("baseCourse", baseCourse);
    this.sessions = baseCourse.sessions;
  
    const sessionGroup = this.formNewCourse.get('sessionsDates') as FormGroup;

    Object.keys(sessionGroup.controls).forEach(key => {
      sessionGroup.removeControl(key);
    });

    baseCourse.sessions.forEach(session => {
      sessionGroup.addControl(session.id, this.fb.control('', Validators.required));
    });
  }

  getOptionText(option: LiveCourseWithSessions) {
    return option.title;
  }

  async onSubmit(): Promise<void> {
    this.closeDialog();
  }

  async onSave() {
    // console.log("this.formNewCourse", this.formNewCourse)
    if (this.formNewCourse.valid) {
      const formValue = this.formNewCourse.value;
      console.log('Form Value:', formValue);

      // Save live course son
      const liveCourseSon: LiveCourseSonJson = {
        id: null, 
        meetingLink: formValue.meetingLink, 
        identifierText: formValue.identifyingText
      }
      await this.liveCourseService.saveLiveCourseSon(formValue.baseCourse.id, liveCourseSon)

      // Save sessions sons
      Object.keys(formValue.sessionsDates).forEach(async key => {
        const sessionSon: SessionSonJson = {
          id: null,
          date: this.parseDateString(formValue.sessionsDates[key])
        }
        await this.liveCourseService.saveLiveCourseSessionSon(key, sessionSon)
      });
      
    } else {
      console.log('Form is invalid');
    }
  }

  private parseDateString(date: string): Date {
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