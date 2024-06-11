import { Component, Input, OnInit, SimpleChanges } from "@angular/core";
import { CalendarLiveCourseData } from "../live-courses/live-courses.component";
import { KeyValue } from "@angular/common";
import { Router } from "@angular/router";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { VimeoComponent } from "../../vimeo/vimeo.component";
import { IconService } from "../../../services/icon.service";

@Component({
  selector: "app-calendar-live-courses-selector",
  templateUrl: "./calendar-live-courses-selector.component.html",
  styleUrls: ["./calendar-live-courses-selector.component.css"],
})
export class CalendarLiveCoursesSelectorComponent implements OnInit {
  constructor(private router: Router, private modalService: NgbModal, public icon: IconService) {}

  @Input() calendarLiveCourses: CalendarLiveCourseData[];
  groupedCourses: { [key: string]: CalendarLiveCourseData[] };

  ngOnInit() {
    this.groupCoursesByMonth();
    // console.log("this.calendarLiveCourses", this.calendarLiveCourses);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.calendarLiveCourses) {
      this.groupCoursesByMonth();
    }
  }

  groupCoursesByMonth() {
    this.groupedCourses = this.calendarLiveCourses.reduce((groups, course) => {
      if (course.sessionDate) {
        const date = new Date(course.sessionDate);
        const monthYear = date.toLocaleString("default", { month: "long", year: "numeric" });
        if (!groups[monthYear]) {
          groups[monthYear] = [];
        }
        groups[monthYear].push(course);
      }
      return groups;
    }, {});

    // console.log("this.groupedCourses", this.groupedCourses)
  }

  keyvalueAscOrder = (a: KeyValue<string, CalendarLiveCourseData[]>, b: KeyValue<string, CalendarLiveCourseData[]>) => {
    const [monthA, yearA] = a.key.split(" ");
    const [monthB, yearB] = b.key.split(" ");
    const dateA = new Date(`${yearA}-${new Date(`${monthA} 1, 2000`).getMonth() + 1}`);
    const dateB = new Date(`${yearB}-${new Date(`${monthB} 1, 2000`).getMonth() + 1}`);
    return dateA.getTime() - dateB.getTime();
  };

  onSelectCourse(selectedCourse: CalendarLiveCourseData) {
    // console.log("selectedCourse", selectedCourse)
    this.router.navigate([`/admin/live-sessions/${selectedCourse.courseId}/${selectedCourse.courseId}`]);
  }

  verVideoVimeo(course: CalendarLiveCourseData): NgbModalRef {
    const modalRef = this.modalService.open(VimeoComponent, {
      animation: true,
      centered: true,
      size: "lg",
    });

    const dataForModal = {
      vimeoId1: course.sessionVimeoId1,
      vimeoId2: course.sessionVimeoId2,
    };

    modalRef.componentInstance.clase = dataForModal;
    return modalRef;
  }
}
