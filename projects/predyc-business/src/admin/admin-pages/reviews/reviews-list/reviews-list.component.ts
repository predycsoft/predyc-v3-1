import { Component, Input, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { combineLatest, Subscription } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { CourseService } from 'projects/predyc-business/src/shared/services/course.service';
import { DialogReviewsComponent } from './dialog-reviews/dialog-reviews.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

export interface CourseRatingData {
  courseName: string;
  courseId: string;
  averageRating: number;
  totalRatings: number;
  totalCompleted: number;
}

@Component({
  selector: 'app-reviews-list',
  templateUrl: './reviews-list.component.html',
  styleUrls: ['./reviews-list.component.css']
})
export class ReviewsListComponent {

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private courseService: CourseService,
    private _modalService: NgbModal
  ) {}

  @ViewChild(MatPaginator) paginator: MatPaginator;

  dataSource = new MatTableDataSource<CourseRatingData>();
  displayedColumns: string[] = [
    "courseName",
    "averageRating",
    "totalRatings",
  ];

  pageSize: number = 10
  totalLength: number
  
  queryParamsSubscription: Subscription
  reviewsSubscription: Subscription
  courseServiceSubscription: Subscription

  ngOnInit() {
    this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe(params => {
      const page = Number(params['page']) || 1;
      // const searchTerm = params['search'] || '';
      this.performSearch(page);
    })
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.paginator.pageSize = this.pageSize;
  }

  performSearch(page: number) {

    this.courseServiceSubscription = combineLatest([
      this.courseService.getCoursesRatings$(),
      this.courseService.getAllCourses$()  
    ]).subscribe(([ratings, courses]) => {
      console.log("courses", courses)
      const courseRatingsData = []
      courses.forEach(course => {
        // Filter ratings for the current course
        const courseRatings = ratings.filter(rating => rating.courseRef.id === course.id);

        // Calculate metrics
        const totalRatings = courseRatings.length;
        const averageRating = courseRatings.reduce((sum, rating) => sum + rating.valoracion.global, 0) / totalRatings || 0;
        const totalCompleted = courseRatings.filter(rating => rating.valoracion.completado).length;

        // Push the metrics to the courseRatings array
        courseRatingsData.push({
          courseName: course.titulo,
          courseId: course.id,
          averageRating: averageRating,
          totalRatings: totalRatings,
          totalCompleted: totalCompleted,
          courseRatings: courseRatings
        });
      });

    courseRatingsData.sort((a, b) => b.averageRating - a.averageRating);
    console.log("courseRatingsData", courseRatingsData)

    // console.log("courseRatingsData", this.courseRatingsData);

    this.paginator.pageIndex = page - 1;
    this.dataSource.data = courseRatingsData;
    this.totalLength = courseRatingsData.length;

    })
  }
  

  onPageChange(page: number): void {
    this.router.navigate([], {
      queryParams: { page },
      queryParamsHandling: 'merge'
    });
  }

  openCourseReviewsModal(courseRatingData: CourseRatingData) {
    const modalRef = this._modalService.open(DialogReviewsComponent, {
			animation: true,
			centered: true,
			size: "md",
			backdrop: "static",
			keyboard: false,
			// windowClass: 'modWidth'
		});

		modalRef.componentInstance.courseRatingData = courseRatingData;
  }

  ngOnDestroy() {
    if (this.courseServiceSubscription) this.courseServiceSubscription.unsubscribe();
  }



}
