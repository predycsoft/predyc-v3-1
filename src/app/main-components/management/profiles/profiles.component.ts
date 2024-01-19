import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Chart } from 'chart.js';
import { Observable, Subscription, combineLatest, map, startWith, BehaviorSubject } from 'rxjs';
import { Category } from 'src/app/shared/models/category.model';
import { Curso } from 'src/app/shared/models/course.model';
import { Skill } from 'src/app/shared/models/skill.model';
import { CategoryService } from 'src/app/shared/services/category.service';
import { CourseService } from 'src/app/shared/services/course.service';
import { IconService } from 'src/app/shared/services/icon.service';
import { SkillService } from 'src/app/shared/services/skill.service';
import { roundNumber } from 'src/app/shared/utils';

interface CoursesForExplorer extends Curso {
  skills: Skill[],
  categories: Category[],
  inStudyPlan: boolean
}

@Component({
  selector: 'app-profiles',
  templateUrl: './profiles.component.html',
  styleUrls: ['./profiles.component.css']
})
export class ProfilesComponent {

  constructor(
    private categoryService: CategoryService,
    private courseService: CourseService,
    public icon: IconService,
    private skillService: SkillService,
  ) {}

  isEditing: boolean = true

  chart: Chart

  serviceSubscription: Subscription
  studyPlan = []

  categories: Category[]
  // courses: Curso[]
  skills: Skill[]

  coursesForExplorer: CoursesForExplorer[]
  filteredCourses: Observable<CoursesForExplorer[]>
  searchControl = new FormControl('');
  hoverItem$: Observable<any>; // This will hold the currently hovered item
  private hoverSubject = new BehaviorSubject<any>(null);

  profileDescription: string = ''

  ngOnInit() {
    this.hoverItem$ = this.hoverSubject.asObservable();
    this.serviceSubscription = combineLatest([this.categoryService.getCategories$(), this.skillService.getSkills$(), this.courseService.getCourses$()]).subscribe(([categories, skills, courses]) => {
      this.categories = categories
      this.skills = skills
      this.updateWidgets()
      // this.courses = courses
      this.coursesForExplorer = courses.map(course => {
        // Find skill object for each skill ref in course
        const skills = course.skillsRef.map(skillRef => {
          return this.skills.find(skill => skill.id === skillRef.id)
        })
        const categories = skills.map(skill => {
          return this.categories.find(category => category.id === skill.category.id)
        })
        return {
          ...course,
          skills: skills,
          categories: categories,
          inStudyPlan: false
        }
      })
      console.log("categories", categories)
      console.log("skills", skills)
      console.log("courses", courses)
      console.log("coursesForExplorer", this.coursesForExplorer)
      this.filteredCourses = combineLatest([
        this.searchControl.valueChanges.pipe(startWith('')),
        this.hoverItem$
      ]).pipe(
        map(([searchText, hoverCategory]) => {
          // console.log('searchText', searchText)
          // console.log('hoverCategory', hoverCategory)
          if (!searchText && !hoverCategory) return []
          let filteredCourses = this.coursesForExplorer
          if (hoverCategory) {
            filteredCourses = filteredCourses.filter(course => {
              const categories = course.categories.map(category => category.name)
              return categories.includes(hoverCategory.name)
            })
          }
          if (searchText) {
            const filterValue = searchText.toLowerCase();
            filteredCourses = filteredCourses.filter(course => course.titulo.toLowerCase().includes(filterValue));
          }
          return filteredCourses
        }
      ))
    })
  }

  onCategoryHover(item: any) {
    this.hoverSubject.next(item);
  }
  
  onCategoryLeave() {
    this.hoverSubject.next(null);
  }

  toggleCourseInPlan(course) {
    course.inStudyPlan = !course.inStudyPlan
    if(course.inStudyPlan) {
      this.studyPlan.push(course)
    } else {
      const targetIndex = this.studyPlan.findIndex(item => item.id === course.id)
      this.studyPlan.splice(targetIndex, 1)
    }
    this.updateWidgets()
  }

  onCancel() {
    this.isEditing = false
  }

  roundNumber(number: number) {
    return roundNumber(number)
  }

  updateWidgets() {
    const chartData = this.getChartData()
    this.getChart(chartData)
    this.updateCategoriesAndSkillsWidget(chartData)
  }

  getChartData() {
    const data = this.categories.map(category => {
      let value = 0
      let skills = []
      if (this.studyPlan.length > 0) {
        const coursesWithThisCategory = this.studyPlan.filter(course => {
          return course.categories.filter(item => item.id === category.id).length
        })
        coursesWithThisCategory.forEach(course => {
          course.skills.forEach(skill => {
            if (!skills.includes(skill.name)) skills.push(skill.name)
          })
        })
        value = roundNumber(coursesWithThisCategory.length * 100 / this.studyPlan.length)
      }
      return {
        label: category.name,
        skills: skills,
        value: value
      }
    })
    return data
  }

  getChart(chartData) {
    let labels = []
    let values = []
    chartData.filter(item => item.value !== 0).forEach(data => {
      labels.push(data.label)
      values.push(data.value)
    });
    const canvas = document.getElementById("chart") as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')
    // const horizontalMargin = this.horizontalMargin
    if (this.chart) {
      this.chart.destroy();
    }
    this.chart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          fill: true,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgb(54, 162, 235)',
          pointBackgroundColor: 'rgb(54, 162, 235)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(54, 162, 235)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
              display: false
          },
        },
        elements: {
          line: {
            borderWidth: 3
          }
        },
        scales: {
          r: {
            // max: 100,
            beginAtZero: true,
            ticks: {
              display: false,
              stepSize: 20,
            }
          }
        }
      }
    })
  }

  categoriesAndSkillsWidgetData = []

  updateCategoriesAndSkillsWidget(chartData) {
    this.categoriesAndSkillsWidgetData = chartData.filter(category => category.skills.length > 0)
  }

  onSave() {
    this.isEditing = false;
    console.log("Save")
  }

  ngOnDestroy() {
    this.serviceSubscription.unsubscribe()
    if (this.chart) {
      this.chart.destroy();
    }
  }

}
