import { Component, Input, SimpleChanges } from '@angular/core';
import { DocumentReference } from '@angular/fire/compat/firestore';
import { Chart } from 'chart.js';
import { Observable, Subject, Subscription, combineLatest } from 'rxjs';
import { Category } from 'src/app/shared/models/category.model';
import { CourseByStudent } from 'src/app/shared/models/course-by-student';
import { Curso, CursoJson } from 'src/app/shared/models/course.model';
import { Profile } from 'src/app/shared/models/profile.model';
import { Skill } from 'src/app/shared/models/skill.model';
import { User, UserJson } from 'src/app/shared/models/user.model';
import { CategoryService } from 'src/app/shared/services/category.service';
import { CourseService } from 'src/app/shared/services/course.service';
import { IconService } from 'src/app/shared/services/icon.service';
import { SkillService } from 'src/app/shared/services/skill.service';
import { UserService } from 'src/app/shared/services/user.service';
import { firestoreTimestampToNumberTimestamp, roundNumber } from 'src/app/shared/utils';

interface CoursesForExplorer extends CursoJson {
  skills: Skill[],
  categories: Category[],
  inStudyPlan: boolean
}

interface Month {
  monthName: string;
  monthNumber: number
  yearNumber: number
  courses: any[];
}

@Component({
  selector: 'app-student-study-plan-and-competences',
  templateUrl: './student-study-plan-and-competences.component.html',
  styleUrls: ['./student-study-plan-and-competences.component.css']
})
export class StudentStudyPlanAndCompetencesComponent {

  constructor(
    public icon: IconService,
    private userService: UserService,
    private courseService: CourseService,
    private categoryService: CategoryService,
    private skillService: SkillService,
  ){}

  @Input() student: UserJson
  @Input() selectedProfile: Profile;

  coursesData: any

  combinedObservableSubscription: Subscription
  months: Month[]

  showInitForm = false
  hoursPermonthInitForm: number = 0
  startDateInitForm: {year: number, month: number, day: number} | null = null


  // -------------------------------- Competences
  coursesForExplorer: CoursesForExplorer[]
  serviceSubscription: Subscription
  categories: Category[]
  skills: Skill[]
  chart: Chart
  studyPlan = []
  courses


  ngOnInit() {
    console.log("this.student", this.student)
    const userRef = this.userService.getUserRefById(this.student.uid)
    // this.createStudyPlan()
    // if the student has a profile, get the data and show the study plan
    this.combinedObservableSubscription = combineLatest([ this.courseService.getCourses$(), this.courseService.getActiveCoursesByStudent$(userRef), this.categoryService.getCategories$(), this.skillService.getSkills$()]).
    subscribe(([coursesData, coursesByStudent, categories, skills]) => {
      this.categories = categories
      this.skills = skills
      this.studyPlan = []

      if (coursesData.length > 0) {
        this.coursesData = coursesData
        if (this.selectedProfile) {
          if (coursesByStudent.length > 0) {
            this.buildMonths(coursesByStudent, coursesData)
          } 
          else {
            this.showInitForm = true
            this.hoursPermonthInitForm = this.selectedProfile.hoursPerMonth
            console.log("El usuario no posee studyPlan");
          }
        }
      }
    });
  }

  async ngOnChanges(changes: SimpleChanges) {
    // setting profile for the first time
    if(changes.selectedProfile) {
      if (changes.selectedProfile.previousValue === null && changes.selectedProfile.currentValue) {
        this.showInitForm = true
        this.hoursPermonthInitForm = changes.selectedProfile.currentValue.hoursPerMonth
      }
      // setting new profile
      if (changes.selectedProfile.previousValue && changes.selectedProfile.currentValue && 
      (changes.selectedProfile.currentValue.id !== changes.selectedProfile.previousValue.id )) {
        // Set active = false in prev profile courses
        await this.courseService.setCoursesByStudentInactive(this.userService.getUserRefById(this.student.uid))
        //
        // calculate dates and create studyPlan using student.
        await this.createStudyPlan()
      }
    }

  }


  buildMonths(coursesByStudent: CourseByStudent[], coursesData) {
    const months = {}; 
    coursesByStudent.forEach(courseByStudent => {
      // console.log("courseByStudent.id", courseByStudent.id)
      const courseData = coursesData.find(courseData => courseData.id === courseByStudent.courseRef.id);
      const skills = courseData.skillsRef.map(skillRef => { return this.skills.find(skill => skill.id === skillRef.id) })
      const categories = skills.map(skill => {return this.categories.find(category => category.id === skill.category.id)})
      const courseForExplorer = {
        ...courseData,
        skills: skills,
        categories: categories,
      }
      this.studyPlan.push(courseForExplorer)

      if (courseData) {
        const studyPlanData = {
          duration: courseData.duracion / 60,
          courseTitle: courseData.titulo,
          dateStartPlan: firestoreTimestampToNumberTimestamp(courseByStudent.dateStartPlan),
          dateEndPlan: firestoreTimestampToNumberTimestamp(courseByStudent.dateEndPlan),
          dateStart: firestoreTimestampToNumberTimestamp(courseByStudent.dateStart),
          dateEnd: firestoreTimestampToNumberTimestamp(courseByStudent.dateEnd),
        };
        
        const monthName = new Date(studyPlanData.dateEndPlan).toLocaleString('es', { month: 'long' });

        if (!months[monthName]) {
          months[monthName] = [];
        }

        // Add course to the related month
        months[monthName].push(studyPlanData);
      }
      else { 
        console.log("No exite el curso")
        return
      }
    });
    // Transform data to the desired structure 
    this.months = Object.keys(months).map(monthName => {
      const date = new Date(months[monthName][0].dateEndPlan);
      const monthNumber = date.getUTCMonth()
      const yearNumber = date.getUTCFullYear();

      const sortedCourses = months[monthName].sort((a, b) => {
        return a.dateEndPlan - b.dateEndPlan;
      });

      return {
        monthName,
        monthNumber,
        yearNumber,
        courses: sortedCourses
      };
    });
    this.months.sort((a, b) => {
      const yearDiff = a.yearNumber - b.yearNumber;
      if (yearDiff !== 0) return yearDiff;
      return a.monthNumber - b.monthNumber;
    });

    this.updateWidgets()

  }

  async createStudyPlan() {
    const coursesRefs: DocumentReference[] = this.selectedProfile.coursesRef
    let dateStartPlan: number
    let dateEndPlan: number
    let now = new Date()
    let hoy = +new Date(now.getFullYear(), now.getMonth(), now.getDate())
    for (let i = 0; i < coursesRefs.length; i++) {
      const userRef: DocumentReference | DocumentReference<User> = this.userService.getUserRefById(this.student.uid)
      const courseData = this.coursesData.find(courseData => courseData.id === coursesRefs[i].id);
      const courseDuration = courseData.duracion
      let hoursPermonth = this.hoursPermonthInitForm ? this.hoursPermonthInitForm : this.student.studyHours

      if (this.startDateInitForm){
        dateStartPlan = +new Date(this.startDateInitForm.year, this.startDateInitForm.month - 1, this.startDateInitForm.day);
        this.startDateInitForm = null
      }
      else dateStartPlan = dateEndPlan ? dateEndPlan : hoy;

      dateEndPlan = this.courseService.calculatEndDatePlan(dateStartPlan, courseDuration, hoursPermonth)
      //  ---------- if it already exists, activate it, otherwise, create it ---------- 
      const courseByStudent: CourseByStudent | null = await this.courseService.getCourseByStudent(userRef as DocumentReference<User>, coursesRefs[i] as DocumentReference<Curso>)
      console.log("courseByStudent", courseByStudent)
      if (courseByStudent) {
        await this.courseService.setCourseByStudentActive(courseByStudent.id, new Date(dateStartPlan), new Date(dateEndPlan))
      } else {
        await this.courseService.saveCourseByStudent(coursesRefs[i], userRef, new Date(dateStartPlan), new Date(dateEndPlan))
      }
    }
  }
  
  isMonthCompleted(month: Month): boolean {
    return month.courses.every(course => course.dateEnd !== null);
  }
  
  isMonthPast(month: any): boolean {
    const currentMonth = new Date().getUTCMonth();
    // const currentMonth = 2; // testing with march
    const currentYear = new Date().getUTCFullYear();
    return (month.yearNumber < currentYear || (month.yearNumber === currentYear && month.monthNumber < currentMonth));
  }

  getDelayedMonthsCount(): number {
    return this.months ? this.months.filter(month => this.isMonthPast(month) && !this.isMonthCompleted(month)).length : null;
  }
  
  async saveInitForm() {
    await this.userService.saveStudyPlanHoursPerMonth(this.student.uid, this.hoursPermonthInitForm)
    this.showInitForm = false
    // calculate dates and create studyplan using this.startDateInitForm
    await this.createStudyPlan()
  }

  ngOnDestroy() {
    this.combinedObservableSubscription ? this.combinedObservableSubscription.unsubscribe() : null
  }

  // ---------------------------------------------------- Skills

  updateWidgets() {
    const chartData = this.getChartData()
// console.log("chartData", chartData)
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
    chartData.sort((a, b) => b.value - a.value);

    let labels = []
    let values = []
    let valuesComplete = []

    chartData.forEach(data => {
      labels.push(data.label)
      values.push(data.value)
      valuesComplete.push(data.valueComplete)
    });
    if (this.chart) {
      this.chart.destroy();
    }
    let pilares=[]
    let data = null
    
    // Definimos un objeto para mapear los pilares originales a los nuevos valores
    const mapeoNombres : { [key: string]: string } = {
      "Confiabilidad": "Confiabilidad",
      "Eléctrica": "Eléctrica",
      "Gestión de activos": "Gest. Activos",
      "Gestión de mantenimiento": "Gest. Mant.",
      "Gestión de proyectos": "Proyectos",
      "HSE": "HSE",
      "Instrumentación": "Instrumentación",
      "Integridad": "Integridad",
      "Mantenimiento predictivo": "Predictivo",
      "Mecánico": "Mecánico",
      "Sistemas y procesos": "Sist. & Proc.",
      "Soporte a mantenimiento": "Soporte Mant"
    };

    // Nuevo arreglo para los nombres resumidos
    let nombresResumidos: string[] = [];

    // Recorrer el arreglo actual y crear el nuevo con nombres resumidos
    labels.forEach(pilar => {
      const nombreResumido = mapeoNombres[pilar]; // Obtener el nombre resumido
      if (nombreResumido) {
        nombresResumidos.push(nombreResumido); // Añadir al nuevo arreglo
      } else {
        // Si el pilar actual no tiene un nombre resumido en el mapeo,
        // se podría añadir el nombre original o manejarlo como un error.
        nombresResumidos.push(pilar); // O manejar el caso de que no exista mapeo como se prefiera
      }
    });

    // console.log('nombresResumidos',nombresResumidos);

    data =  {
      labels: nombresResumidos,
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
    }

    const canvas = document.getElementById("chart") as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')
    

    this.chart = new Chart(ctx, {
      type: 'radar',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
            position: 'bottom',
            labels: {
              boxWidth: 10, // Tamaño de la caja de color
              padding: 10 // Espacio entre los elementos de la leyenda
            }
          }
        },
        elements: {
          line: {
            borderWidth: 1
          }
        },
        scales: {
          r: {
            beginAtZero: true,
            ticks: {
              display: false,
              stepSize: 20,
            }
          }
        }
      }
    });
  }

  _getChart(chartData) {
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
    console.log("this.categoriesAndSkillsWidgetData", this.categoriesAndSkillsWidgetData)
  }
}
