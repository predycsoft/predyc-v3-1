import { Component, Input } from '@angular/core';
import { Observable, Subscription, combineLatest, firstValueFrom, map, of, switchMap } from 'rxjs';
import { CourseByStudent } from 'projects/shared/models/course-by-student.model';
import { User, UserJson } from 'projects/shared/models/user.model';
import { CourseService } from 'projects/predyc-business/src/shared/services/course.service';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { ProfileService } from 'projects/predyc-business/src/shared/services/profile.service';
import { UserService } from 'projects/predyc-business/src/shared/services/user.service';
import { ClassByStudent } from 'shared';

interface UserRanking extends UserJson {
  profileName: string
  hours: number
  targetHours: number
  hours30Days: number
}

@Component({
  selector: 'app-ranking-list',
  templateUrl: './ranking-list.component.html',
  styleUrls: ['./ranking-list.component.css']
})
export class RankingListComponent {

  constructor(
    private userService: UserService,
    public icon: IconService,
    private profileService: ProfileService,
    private courseService: CourseService
  ){}
  @Input() classes
  @Input() profiles
  @Input() courses
  @Input() allUsers
  ranking: UserRanking[]
  listLength: number = 15
  showPointsTooltip = false
  combinedObservableSubscription: Subscription

  async ngOnInit() {
    const users = this.allUsers
    // console.log("users promise", users)
    const usersAndCourses = await Promise.all(
      users.map(async user => {
        const userRef = this.userService.getUserRefById(user.uid);
        const courses = await this.courseService.getActiveCoursesByStudent(userRef);
        const classes = await firstValueFrom(this.courseService.getClassesByStudent$(userRef));
        return { user, courses, classes };
      })
    );

    // console.log("usersAndCourses", usersAndCourses);

    const profiles = this.profiles
    const allCourses = this.courses
    const allClasses = this.classes
    // console.log("allClasses", allClasses)
  
    this.ranking = usersAndCourses.map(({ user, courses, classes }) => {
      // console.log('revisar', user, courses, classes,allClasses);

      const currentDate = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(currentDate.getDate() - 30);

      const profile = user.profile ? profiles.find(profile => profile.id === user.profile.id) : null;
      let hours = 0;
      let targetHours = 0;

      // Filtrar clases completadas en los últimos 30 días
      const recentClasses = classes.filter(classStudent => {
      if (classStudent.dateEnd && classStudent.dateEnd.seconds) {
        const classDate = new Date(classStudent.dateEnd.seconds * 1000);
        return classDate >= thirtyDaysAgo && classDate <= currentDate;
      }
        return false;
      });

      let minutesLast30Days = 0

      // console.log("recentClasses", recentClasses)

      recentClasses.forEach(classStudent => {
        let classe = allClasses.find(x=>x.id == classStudent.classRef.id)
        // console.log("classStudent", classStudent)
        if (classe) minutesLast30Days+=classe.duracion
        else {
          // console.log("Class not found: ", classStudent)
        } 
      });

      let hours30Days = minutesLast30Days/60

      courses.forEach(course => {
        hours += course?.progressTime ? course.progressTime : 0;
        const courseJson = allCourses.find(item => item.id === course.courseRef.id);
        targetHours += courseJson?.duracion;
        course.courseTime = courseJson.duracion;
      });
      const userPerformance: "no plan" | "high" | "medium" | "low" | "no iniciado" = this.userService.getPerformanceWithDetails(courses);
      const ratingPoints: number = this.userService.getRatingPointsFromStudyPlan(courses, allCourses);
      return {
        ...user,
        profileName: profile ? profile.name : 'Sin perfil',
        hours: hours,
        hours30Days: hours30Days,
        targetHours: targetHours,
        performance: userPerformance,
        ratingPoints: ratingPoints,
        classesCompleted: classes // Agregar las clases completadas al objeto del usuario
      };
    }).sort((a, b) => b.hours30Days - a.hours30Days);

    // console.log("this.ranking", this.ranking)
  }
  
  ngOnDestroy() {
    if(this.combinedObservableSubscription) this.combinedObservableSubscription.unsubscribe()
  }

}
