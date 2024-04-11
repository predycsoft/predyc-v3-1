import { Component } from '@angular/core';
import { Observable, Subscription, combineLatest, map, of, switchMap } from 'rxjs';
import { CourseByStudent } from 'projects/shared/models/course-by-student.model';
import { User, UserJson } from 'projects/shared/models/user.model';
import { CourseService } from 'projects/predyc-business/src/shared/services/course.service';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { ProfileService } from 'projects/predyc-business/src/shared/services/profile.service';
import { UserService } from 'projects/predyc-business/src/shared/services/user.service';

interface UserRanking extends UserJson {
  profileName: string
  hours: number
  targetHours: number
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

  ranking: UserRanking[]
  listLength: number = 5
  showPointsTooltip = false
  combinedObservableSubscription: Subscription

  ngOnInit() {
    const userAndCoursesObservable: Observable<{user: User, courses: CourseByStudent[]}[]> = this.userService.getUsers$().pipe(
      switchMap(users => {
        // For each user, query their active courses
        const observables = users.map(user => {
          const userRef = this.userService.getUserRefById(user.uid)
          return this.courseService.getActiveCoursesByStudent$(userRef).pipe(
            map(courses => ({ user, courses })),
          );
        });
        return observables.length > 0 ? combineLatest(observables) : of([])
      }))
    this.combinedObservableSubscription = combineLatest([userAndCoursesObservable, this.profileService.getProfiles$(), this.courseService.getCourses$()]).subscribe(([usersAndCourses, profiles, allCourses]) => {
      this.ranking = usersAndCourses.map(({user, courses}) => {
        const profile = user.profile ? profiles.find(profile => profile.id === user.profile.id) : null
        let hours = 0
        let targetHours = 0
        courses.forEach(course => {
          hours += course?.progressTime ? course.progressTime : 0
          const courseJson = allCourses.find(item => item.id === course.courseRef.id)
          targetHours += courseJson?.duracion
        })
        const userPerformance: "no plan" | "high" | "medium" | "low"| "no iniciado" = this.userService.getPerformanceWithDetails(courses);
        const ratingPoints: number = this.userService.getRatingPointsFromStudyPlan(courses, allCourses);
          return {
            ...user,
            profileName: profile ? profile.name : 'Sin perfil',
            hours: hours,
            targetHours: targetHours,
            performance: userPerformance,
            ratingPoints: ratingPoints
          }
        }).sort((a, b) => b.ratingPoints - a.ratingPoints)
      })
  }

  ngOnDestroy() {
    if(this.combinedObservableSubscription) this.combinedObservableSubscription.unsubscribe()
  }

}
