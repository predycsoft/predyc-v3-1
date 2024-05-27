import { Component, Input, OnInit } from '@angular/core';
import { CalendarLiveCourseData } from '../live-courses/live-courses.component';
import { KeyValue } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-calendar-live-courses-selector',
  templateUrl: './calendar-live-courses-selector.component.html',
  styleUrls: ['./calendar-live-courses-selector.component.css']
})
export class CalendarLiveCoursesSelectorComponent implements OnInit {

  constructor(
    private router: Router,
  ) {}

  @Input() calendarLiveCourses: CalendarLiveCourseData[];
  groupedCourses: { [key: string]: CalendarLiveCourseData[] };

  ngOnInit() {
    this.groupCoursesByMonth();
    console.log("this.calendarLiveCourses", this.calendarLiveCourses);
  }

  groupCoursesByMonth() {
    this.groupedCourses = this.calendarLiveCourses.reduce((groups, course) => {
      const date = new Date(course.sessionSonDate);
      const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(course);
      return groups;
    }, {});

    console.log("this.groupedCourses", this.groupedCourses)
  }

  keyvalueAscOrder = (a: KeyValue<string, CalendarLiveCourseData[]>, b: KeyValue<string, CalendarLiveCourseData[]>) => {
    const [monthA, yearA] = a.key.split(' ');
    const [monthB, yearB] = b.key.split(' ');
    const dateA = new Date(`${yearA}-${new Date(`${monthA} 1, 2000`).getMonth() + 1}`);
    const dateB = new Date(`${yearB}-${new Date(`${monthB} 1, 2000`).getMonth() + 1}`);
    return dateA.getTime() - dateB.getTime();
  }

  onSelectCourse(selectedCourse) {
    console.log("selectedCourse", selectedCourse)
    // this.router.navigate([`/management/create-live/edit/${selectedCourse.id}`])

  }
}
