import { Component } from '@angular/core';
import { CourseService } from 'projects/predyc-business/src/shared/services/course.service';
import { combineLatest, Subscription } from 'rxjs';

interface CourseRatingData {
  courseName: string;
  courseId: string;
  averageRating: number;
  totalRatings: number;
  totalCompleted: number;
}


@Component({
  selector: 'app-reviews',
  templateUrl: './reviews.component.html',
  styleUrls: ['./reviews.component.css']
})
export class ReviewsComponent {

  constructor(
    private courseService: CourseService,
  ) {}

  courseServiceSubscription: Subscription
  courseRatings: CourseRatingData[] = []

  ngOnInit() {
    this.courseServiceSubscription = combineLatest([
      this.courseService.getCoursesRatings$(),
      this.courseService.getAllCourses$()  
    ]).subscribe(([ratings, courses]) => {
      console.log("ratings", ratings)
      
      courses.forEach(course => {
        // Filter ratings for the current course
        const courseRatings = ratings.filter(rating => rating.courseRef.id === course.id);

        // Calculate metrics
        const totalRatings = courseRatings.length;
        const averageRating = courseRatings.reduce((sum, rating) => sum + rating.valoracion.global, 0) / totalRatings || 0;
        const totalCompleted = courseRatings.filter(rating => rating.valoracion.completado).length;

        // Push the metrics to the courseRatings array
        this.courseRatings.push({
            courseName: course.titulo,
            courseId: course.id,
            averageRating: averageRating,
            totalRatings: totalRatings,
            totalCompleted: totalCompleted
        });
      });

    this.courseRatings.sort((a, b) => b.averageRating - a.averageRating);

    console.log("courseRatings", this.courseRatings);

    })
  }
}
