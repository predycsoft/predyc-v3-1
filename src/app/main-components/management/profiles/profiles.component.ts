import { Component, ElementRef, ViewChild } from '@angular/core';
import { NgbDropdown, NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { Chart } from 'chart.js';
import { Observable, OperatorFunction, Subject, Subscription, combineLatest, debounceTime, distinctUntilChanged, filter, map, merge } from 'rxjs';
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

  @ViewChild('containerElement') containerElement: ElementRef;
  isModalOpen: boolean = false

  chart: Chart

  serviceSubscription: Subscription
  studyPlan = [
    {
      title: 'Curso',
      duration: 120
    },
    {
      title: 'Curso',
      duration: 120
    },
    {
      title: 'Curso',
      duration: 120
    },
    {
      title: 'Curso',
      duration: 120
    },
    {
      title: 'Curso',
      duration: 120
    },
    {
      title: 'Curso',
      duration: 120
    },
    {
      title: 'Curso',
      duration: 120
    },
    {
      title: 'Curso',
      duration: 120
    },
    {
      title: 'Curso',
      duration: 120
    },
    {
      title: 'Curso',
      duration: 120
    },
    {
      title: 'Curso',
      duration: 120
    },
    {
      title: 'Curso',
      duration: 120
    },
    {
      title: 'Curso',
      duration: 120
    },
    {
      title: 'Curso',
      duration: 120
    },
  ]

  categories: Category[]
  courses: Curso[]
  skills: Skill[]

  @ViewChild('dropdown') dropdown: NgbDropdown;
  coursesForExplorer: CoursesForExplorer[]
  searchForExplorer: String = ''
  filteredCourses: CoursesForExplorer[] = []

  ngOnInit() {
    this.getChart()
    this.serviceSubscription = combineLatest([this.categoryService.getCategories$(), this.skillService.getSkills$(), this.courseService.getCourses$()]).subscribe(([categories, skills, courses]) => {
      this.categories = categories
      this.skills = skills
      this.courses = courses
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
    })
  }

  @ViewChild('instance', { static: true }) instance: NgbTypeahead;

	focus$ = new Subject<string>();
	click$ = new Subject<string>();

	search = (text$: Observable<string>) => {
		const debouncedText$ = text$.pipe(debounceTime(200), distinctUntilChanged());
		const clicksWithClosedPopup$ = this.click$.pipe(filter(() => !this.instance.isPopupOpen()));
		const inputFocus$ = this.focus$;

		return merge(debouncedText$, inputFocus$, clicksWithClosedPopup$).pipe(
			map((term) =>
				(term === '' ? this.coursesForExplorer : this.coursesForExplorer.filter((v) => v.titulo.toLowerCase().indexOf(term.toLowerCase()) > -1)).slice(0, 10),
			),
		);
	};

  onCategoryHover(category) {
    this.filteredCourses = this.coursesForExplorer.filter(course => {
      const categories = course.categories.map(category => category.name)
      return categories.includes(category.name)
    })
  }

  toggleCourseInPlan(course) {
    course.inStudyPlan = !course.inStudyPlan
  }

  onCancel() {
    this.isEditing = false
  }

  roundNumber(number: number) {
    return roundNumber(number)
  }

  removeItemFromPlan() {
    console.log("Remove item from plan")
  }

  getChartData() {
    const data = [
      {
        label: 'Mantenimientos',
        value: 28
      },
      {
        label: 'Proyectos',
        value: 48
      },
      {
        label: 'Petróleo',
        value: 40
      },
      {
        label: 'Confiabilidad',
        value: 19
      },
      {
        label: 'Manufactura',
        value: 96
      },
      {
        label: 'Equipos dinámicos',
        value: 27
      },
      {
        label: 'Procesos',
        value: 100
      },
      {
        label: 'Industria 4.0',
        value: 50
      }
    ]
    return data
  }

  getChart() {
    const chartData = this.getChartData()
    let labels = []
    let values = []
    chartData.forEach(data => {
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
            ticks: {
              display: false,
              stepSize: 20
            }
          }
        }
      }
    })
  }

  openCourseExplorerDialog() {}

  onSave() {
    this.isEditing = false;
    console.log("Save")
  }

  ngOnDestroy() {
    this.serviceSubscription.unsubscribe()
  }

}