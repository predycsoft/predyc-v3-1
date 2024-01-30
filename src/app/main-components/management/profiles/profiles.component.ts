import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Chart } from 'chart.js';
import { Observable, Subscription, combineLatest, map, startWith, BehaviorSubject } from 'rxjs';
import { Category } from 'src/app/shared/models/category.model';
import { Curso, CursoJson } from 'src/app/shared/models/course.model';
import { Skill } from 'src/app/shared/models/skill.model';
import { CategoryService } from 'src/app/shared/services/category.service';
import { CourseService } from 'src/app/shared/services/course.service';
import { IconService } from 'src/app/shared/services/icon.service';
import { SkillService } from 'src/app/shared/services/skill.service';
import { roundNumber } from 'src/app/shared/utils';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from 'src/app/shared/services/user.service';
import { ProfileService } from 'src/app/shared/services/profile.service';
import { Profile } from 'src/app/shared/models/profile.model';
import { DocumentReference } from '@angular/fire/compat/firestore';
import { AlertsService } from 'src/app/shared/services/alerts.service';
import { EnterpriseService } from 'src/app/shared/services/enterprise.service';

const MAIN_TITLE = 'Predyc - '

interface CoursesForExplorer extends CursoJson {
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
    private route: ActivatedRoute,
    private alertService: AlertsService,
    private categoryService: CategoryService,
    private courseService: CourseService,
    private enterpriseService: EnterpriseService,
    public icon: IconService,
    private profileService: ProfileService,
    private skillService: SkillService,
    private router: Router,
    private userService: UserService,
    private titleService: Title
  ) {}

  isEditing: boolean

  chart: Chart

  serviceSubscription: Subscription
  studyPlan = []

  categories: Category[]
  // courses: Curso[]
  skills: Skill[]
  profile: Profile

  coursesForExplorer: CoursesForExplorer[]
  filteredCourses: Observable<CoursesForExplorer[]>
  searchControl = new FormControl('');
  hoverItem$: Observable<any>; // This will hold the currently hovered item
  private hoverSubject = new BehaviorSubject<any>(null);

  profileName: string = ''
  profileDescription: string = ''
  profileHoursPerMonth: number = 8

  profileBackup

  id = this.route.snapshot.paramMap.get('id');

  ngOnInit() {
    this.hoverItem$ = this.hoverSubject.asObservable();
    const observablesArray: Observable<Category[] | Profile | Skill[] | Curso[]>[] = [this.categoryService.getCategories$(), this.skillService.getSkills$(), this.courseService.getCourses$()]
    if (this.id === 'new') {
      this.isEditing = true
      const title = MAIN_TITLE + 'Nuevo perfil'
      this.titleService.setTitle(title)
    } else {
      this.isEditing = false
      observablesArray.push(this.profileService.getProfile$(this.id))
    }
    this.serviceSubscription = combineLatest(observablesArray).subscribe((result) => {
      console.log("result", result)
      const categories = result[0] as Category[]
      const skills = result[1] as Skill[]
      const courses = result[2] as Curso[]
      if (result.length === 4) {
        this.profile = result[3] as Profile
      }
      this.categories = categories
      this.skills = skills
      if (this.profile) {
        const title = MAIN_TITLE + this.profile.name
        this.titleService.setTitle(title)
        this.profileName = this.profile.name
        this.profileDescription = this.profile.description
        this.profileHoursPerMonth = this.profile.hoursPerMonth
      }
      this.studyPlan = []
      // this.courses = courses
      this.coursesForExplorer = courses.map(course => {
        // Find skill object for each skill ref in course
        console.log(course)
        const skills = course.skillsRef.map(skillRef => {
          console.log(skillRef)
          return this.skills.find(skill => skill.id === skillRef.id)
        })
        const categories = skills.map(skill => {
          return this.categories.find(category => category.id === skill.category.id)
        })
        const inStudyPlan = this.profile && this.profile.coursesRef.map(courseRef => courseRef.id).includes(course.id)
        const courseForExplorer = {
          ...course,
          skills: skills,
          categories: categories,
          inStudyPlan: inStudyPlan
        }
        if (inStudyPlan) this.studyPlan.push(courseForExplorer)
        return courseForExplorer
      })
      this.updateWidgets()

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

  debug() {
    // console.log("studyPlan", this.studyPlan)
    // console.log("coursesForExplorer", this.coursesForExplorer.map(course => {return {name: course.titulo, inStudyPlan: course.inStudyPlan }}))
    // console.log("profileBackup", this.profileBackup)
    this.courseService.updateStudyPlans({added: [], removed: []})
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

  onEdit() {
    this.profileBackup = {
      name: this.profileName,
      description: this.profileDescription,
      selectedCourses: this.studyPlan.map(course => course.id)
    }
    this.isEditing = true
  }

  onCancel() {
    if (this.id === 'new') {
      this.router.navigate(['/management/students'])
    } else {
      this.profileName = this.profileBackup.name
      this.profileDescription = this.profileBackup.description
      let studyPlanChanged = false
      this.coursesForExplorer.forEach(course => {
        const initialValue = course.inStudyPlan
        const finalValue = this.profileBackup.selectedCourses.includes(course.id)
        course.inStudyPlan = finalValue
        if (initialValue !== finalValue) {
          studyPlanChanged = true
          if (finalValue) {
            this.studyPlan.push(course)
          } else {
            const targetIndex = this.studyPlan.findIndex(item => item.id === course.id)
            this.studyPlan.splice(targetIndex, 1)
          }
        }
      })
      if (studyPlanChanged) this.updateWidgets()
      this.isEditing = false
    }
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
    const accumulatedStudyPlanHours = this.studyPlan.reduce(function (accumulator, course) {
      return accumulator + course.duracion;
    }, 0)
    const data = this.categories.map(category => {
      let value = 0
      let skills = []
      if (this.studyPlan.length > 0) {
        const coursesWithThisCategory = this.studyPlan.filter(course => {
          return course.categories.filter(item => item.id === category.id).length
        })
        let totalDuration = 0
        coursesWithThisCategory.forEach(course => {
          course.skills.forEach(skill => {
            if (!skills.includes(skill.name)) skills.push(skill.name)
          })
          totalDuration += course.duracion
        })
        value = roundNumber(totalDuration * 100 / accumulatedStudyPlanHours)
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
    try {
      if (!this.profileName) throw new Error("Debe indicar un nombre para el perfil")
      const coursesRef: DocumentReference<Curso>[] = this.studyPlan.map(course => {
        return this.courseService.getCourseRefById(course.id)
      })
      const profile: Profile = Profile.fromJson({
        id: this.profile ? this.profile.id : null,
        name: this.profileName,
        description: this.profileDescription,
        coursesRef: coursesRef,
        enterpriseRef: this.enterpriseService.getEnterpriseRef(),
        permissions: this.profile ? this.profile.permissions : null,
        hoursPerMonth: this.profileHoursPerMonth
      })
      this.profileService.saveProfile(profile)
      let studyPlanChanged = false
      const changesInStudyPlan = {
        added: [],
        removed: []
      }
      this.coursesForExplorer.forEach(course => {
        const initialValue = course.inStudyPlan
        const finalValue = this.profileBackup.selectedCourses.includes(course.id)
        course.inStudyPlan = finalValue
        if (initialValue !== finalValue) {
          studyPlanChanged = true
          if (finalValue) {
            changesInStudyPlan.added.push(course.id)
          } else {
            changesInStudyPlan.removed.push(course.id)
          }
        }
      })
      this.courseService.updateStudyPlans(changesInStudyPlan)
      this.alertService.succesAlert("Success")
      this.isEditing = false;
    } catch (error) {
      this.alertService.errorAlert(error.message)
    }
  }

  ngOnDestroy() {
    if (this.serviceSubscription) this.serviceSubscription.unsubscribe()
    if (this.chart) this.chart.destroy()
  }

}
