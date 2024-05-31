import { Component, Input, SimpleChanges } from "@angular/core";
import { AngularFirestore, DocumentReference,} from "@angular/fire/compat/firestore";
import { Chart } from "chart.js";
import { Subscription, combineLatest } from "rxjs";
import { Category } from "projects/shared/models/category.model";
import { CourseByStudent } from "projects/shared/models/course-by-student.model";
import { Curso, CursoJson } from "projects/shared/models/course.model";
import { Profile } from "projects/shared/models/profile.model";
import { Skill } from "projects/shared/models/skill.model";
import { User, UserJson } from "projects/shared/models/user.model";
import { CategoryService } from "projects/predyc-business/src/shared/services/category.service";
import { CourseService } from "projects/predyc-business/src/shared/services/course.service";
import { IconService } from "projects/predyc-business/src/shared/services/icon.service";
import { ProfileService } from "projects/predyc-business/src/shared/services/profile.service";
import { SkillService } from "projects/predyc-business/src/shared/services/skill.service";
import { UserService } from "projects/predyc-business/src/shared/services/user.service";
import { firestoreTimestampToNumberTimestamp } from "projects/shared/utils";
import annotationPlugin from "chartjs-plugin-annotation";
import { AlertsService } from "projects/predyc-business/src/shared/services/alerts.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { EnterpriseService } from "projects/predyc-business/src/shared/services/enterprise.service";


interface CoursesForExplorer extends CursoJson {
  skills: Skill[];
  categories: Category[];
  inStudyPlan: boolean;
}

interface Month {
  monthName: string;
  monthNumber: number;
  yearNumber: number;
  courses: any[];
}

@Component({
  selector: "app-student-study-plan-and-competences",
  templateUrl: "./student-study-plan-and-competences.component.html",
  styleUrls: ["./student-study-plan-and-competences.component.css"],
})
export class StudentStudyPlanAndCompetencesComponent {
  constructor(
    public icon: IconService,
    private userService: UserService,
    private courseService: CourseService,
    private categoryService: CategoryService,
    private profileService: ProfileService,
    private skillService: SkillService,
    private alertService: AlertsService,
    private afs: AngularFirestore,
    private modalService: NgbModal,
    private enterpriseService: EnterpriseService,


  ) {
    Chart.register(annotationPlugin);
  }

  @Input() student: UserJson;
  @Input() selectedProfile: Profile;

  coursesData: any;

  combinedObservableSubscription: Subscription;
  months: Month[];

  showInitForm = false;
  hoursPermonthInitForm: number = 0;
  startDateInitForm: { year: number; month: number; day: number } | null = null;

  // -------------------------------- Skills
  coursesForExplorer: CoursesForExplorer[];
  serviceSubscription: Subscription;
  categories: Category[];
  skills: Skill[];
  chart: Chart;
  studyPlan = [];
  courses;
  coursesByStudent;

  studyPlanView = true;
  enterprise

  ngOnInit() {

    this.enterpriseService.enterpriseLoaded$.subscribe(isLoaded => {
      if (isLoaded) {
        let enterpriseRef = this.enterpriseService.getEnterpriseRef();
        console.log(enterpriseRef)
        this.enterprise = this.enterpriseService.getEnterprise();
        console.log('this.enterprise ',this.enterprise )
      }
    })

    const userRef = this.userService.getUserRefById(this.student.uid);
    // if the student has a profile, get the data and show the study plan
    this.combinedObservableSubscription = combineLatest([
      this.courseService.getCourses$(),
      this.courseService.getActiveCoursesByStudent$(userRef),
      this.categoryService.getCategories$(),
      this.skillService.getSkills$(),
    ]).subscribe(([coursesData, coursesByStudent, categories, skills]) => {
      this.categories = categories;
      this.skills = skills;
      this.studyPlan = [];

      if (coursesData.length > 0) {
        this.coursesData = coursesData;
        if (this.selectedProfile) {
          this.getDiagnosticTestForProfile();
          if (coursesByStudent.length > 0) {
            this.showInitForm = false;
            this.hoursPermonthInitForm = this.student.studyHours;
            this.coursesByStudent = coursesByStudent.filter(x=>x.active && x.dateStartPlan); // active courses
            // Studyplan case
            // if (!coursesByStudent[0].isExtraCourse ||) {
            if(this.coursesByStudent.length>0){
              this.studyPlanView = this.showInitForm ? false : true;
              console.log('datos revisar',coursesByStudent,coursesData)
              this.buildMonths(this.coursesByStudent, coursesData);
            }
            // Extra courses case
            else {
              this.studyPlanView = false;
            }

            // think in the case when the student have both at the same time ....
          } else {
            // the student has a profile but hasnt completed initform yet
            this.showInitForm = true;
            this.alertService.infoAlert(
              "Debe indicar la fecha de inicio y la hora de dedicación para iniciar su plan de estudio"
            );
            this.hoursPermonthInitForm = this.selectedProfile.hoursPerMonth;
            // console.log("El usuario no posee studyPlan");
          }
        }
      }
    });
  }

  verCertificadoCourse(course) {
    this.afs
      .collection("userCertificate")
      .ref.where("cursoId", "==", course.id)
      .where("usuarioId", "==", this.student.uid)
      .get()
      .then((response) => {
        response.docs.forEach((doc) => {
          // console.log('doc.id', doc.id);

          // Construir la URL con el doc.id
          const url = `https://predyc-user.web.app/certificado/${doc.id}`;

          // Abrir la URL en una nueva pestaña del navegador
          window.open(url, "_blank");
        });
      });
  }

  async ngOnChanges(changes: SimpleChanges) {
    // console.log("changes", changes)
    if (changes.student && changes.student.previousValue) {
      this.student.studyHours = changes.student.previousValue.studyHours; //student.currentValue still has the initial studyHours = 0
    }
    if (changes.selectedProfile) {
      // setting profile for the first time
      if (
        changes.selectedProfile.previousValue === null &&
        changes.selectedProfile.currentValue
      ) {
        this.showInitForm = true;
        this.alertService.infoAlert(
          "Debe indicar la fecha de inicio y la hora de dedicación para iniciar su plan de estudio"
        );
        this.hoursPermonthInitForm =
          changes.selectedProfile.currentValue.hoursPerMonth;
      }
      // setting new profile
      if (
        changes.selectedProfile.previousValue &&
        changes.selectedProfile.currentValue &&
        changes.selectedProfile.currentValue.id !==
          changes.selectedProfile.previousValue.id
      ) {
        this.hoursPermonthInitForm = this.student.studyHours;
        this.getDiagnosticTestForProfile();
        // Set active = false in prev profile courses
        await this.courseService.setCoursesByStudentInactive(
          this.userService.getUserRefById(this.student.uid)
        );

        //
        if (this.studyPlanView) {
          // calculate dates and create studyPlan using student.
          console.log("Cambio de perfil como studyPlan");
          await this.createStudyPlan();
        } else {
          // Save profile courses as extra courses
          console.log("Cambio de perfil como extracurriculares");
          await this.saveAsExtracourses();
        }
      }
    }
  }

  diagnosticTestSubscription: Subscription;
  diagnosticTest;

  getDiagnosticTestForProfile() {
    if (this.diagnosticTestSubscription)
      this.diagnosticTestSubscription.unsubscribe();
    this.diagnosticTestSubscription = this.profileService
      .getDiagnosticTestForUser$(this.student)
      .subscribe((diagnosticTests) => {
        if (diagnosticTests.length === 0) return;

        let diagnosticTest

        let certificationTest = diagnosticTests.find(x=>x.diagnosticTests)

        if(certificationTest){

          certificationTest?.resultByClass?.forEach(element => {
            element.averageScore = element.score
          });
          diagnosticTest = certificationTest

        }
        else{
          diagnosticTest = diagnosticTests.find(x=>x.profileRef.id == this.student.profile.id)
        }



        this.diagnosticTest = {
          ...diagnosticTest,
          date: firestoreTimestampToNumberTimestamp(diagnosticTest.date),
        };
      });
  }

  studyPlanDuration=0;

  buildMonths(coursesByStudent: CourseByStudent[], coursesData) {
    const months = {};
    coursesByStudent.forEach((courseByStudent) => {
      // console.log("courseByStudent.id", courseByStudent.id)
      const courseData = coursesData.find(
        (courseData) => courseData.id === courseByStudent.courseRef.id
      );
      const skills = courseData.skillsRef.map((skillRef) => {
        return this.skills.find((skill) => skill.id === skillRef.id);
      });
      const categories = skills.map((skill) => {
        return this.categories.find(
          (category) => category.id === skill.category.id
        );
      });
      const courseForExplorer = {
        ...courseData,
        skills: skills,
        categories: categories,
      };
      this.studyPlan.push(courseForExplorer);

      if (courseData) {
        this.studyPlanDuration+=courseData.duracion ;
        const studyPlanData = {
          duration: courseData.duracion / 60,
          courseTitle: courseData.titulo,
          dateStartPlan: firestoreTimestampToNumberTimestamp(
            courseByStudent.dateStartPlan
          ),
          dateEndPlan: firestoreTimestampToNumberTimestamp(
            courseByStudent.dateEndPlan
          ),
          dateStart: firestoreTimestampToNumberTimestamp(
            courseByStudent.dateStart
          ),
          dateEnd: firestoreTimestampToNumberTimestamp(courseByStudent.dateEnd),
          progress:courseByStudent.progress,
          finalScore: courseByStudent.finalScore,
          id: courseByStudent.courseRef.id,
        };

        const monthName = new Date(studyPlanData.dateEndPlan).toLocaleString(
          "es",
          { month: "long", year: "2-digit" }
        );

        if (!months[monthName]) {
          months[monthName] = [];
        }

        // Add course to the related month
        months[monthName].push(studyPlanData);
      } else {
        console.log("No exite el curso");
        return;
      }
    });
    // Transform data to the desired structure
    this.months = Object.keys(months).map((monthName) => {
      const date = new Date(months[monthName][0].dateEndPlan);
      const monthNumber = date.getUTCMonth();
      const yearNumber = date.getUTCFullYear();
      const realMonthname = date.toLocaleString("es", { month: "long" });
      const sortedCourses = months[monthName].sort((a, b) => {
        return a.dateEndPlan - b.dateEndPlan;
      });

      return {
        monthName: realMonthname,
        monthNumber,
        yearNumber,
        courses: sortedCourses,
      };
    });
    this.months.sort((a, b) => {
      const yearDiff = a.yearNumber - b.yearNumber;
      if (yearDiff !== 0) return yearDiff;
      return a.monthNumber - b.monthNumber;
    });

    this.updateWidgets();
  }

  async createStudyPlan() {
    const coursesRefs: DocumentReference[] = this.selectedProfile.coursesRef
      .sort(
        (
          b: { courseRef: DocumentReference<Curso>; studyPlanOrder: number },
          a: { courseRef: DocumentReference<Curso>; studyPlanOrder: number }
        ) => b.studyPlanOrder - a.studyPlanOrder
      )
      .map((item) => item.courseRef);
    let dateStartPlan: number;
    let dateEndPlan: number;
    let now = new Date();
    let hoy = +new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const hoursPermonth = (this.hoursPermonthInitForm = 0
      ? this.student.studyHours
      : this.hoursPermonthInitForm);
    // console.log("hoursPermonth", hoursPermonth)

    const userRef: DocumentReference | DocumentReference<User> =
      this.userService.getUserRefById(this.student.uid);
    for (let i = 0; i < coursesRefs.length; i++) {
      const courseData = this.coursesData.find(
        (courseData) => courseData.id === coursesRefs[i].id
      );
      const courseDuration = courseData.duracion;

      if (this.startDateInitForm) {
        dateStartPlan = +new Date(
          this.startDateInitForm.year,
          this.startDateInitForm.month - 1,
          this.startDateInitForm.day
        );
        this.startDateInitForm = null;
      } else dateStartPlan = dateEndPlan ? dateEndPlan : hoy;

      dateEndPlan = this.courseService.calculatEndDatePlan(
        dateStartPlan,
        courseDuration,
        hoursPermonth
      );
      //  ---------- if it already exists, activate it as studyPlan, otherwise, create it as studyPlan ----------
      const courseByStudent: CourseByStudent | null =
        await this.courseService.getCourseByStudent(
          userRef as DocumentReference<User>,
          coursesRefs[i] as DocumentReference<Curso>
        );
      // console.log("courseByStudent", courseByStudent)
      if (courseByStudent) {
        await this.courseService.setCourseByStudentActive(
          courseByStudent.id,
          new Date(dateStartPlan),
          new Date(dateEndPlan)
        );
      } else {
        await this.courseService.saveCourseByStudent(
          coursesRefs[i],
          userRef,
          new Date(dateStartPlan),
          new Date(dateEndPlan),
          false,
          i
        );
      }
    }
  }

  async saveAsExtracourses() {
    const coursesRefs: DocumentReference[] =
      this.selectedProfile.coursesRef.map((item) => item.courseRef);

    const userRef: DocumentReference | DocumentReference<User> =
      this.userService.getUserRefById(this.student.uid);
    for (let i = 0; i < coursesRefs.length; i++) {
      //  ---------- if it already exists, activate it as extra course, otherwise, create it as extra course ----------
      const courseByStudent: CourseByStudent | null =
        await this.courseService.getCourseByStudent(
          userRef as DocumentReference<User>,
          coursesRefs[i] as DocumentReference<Curso>
        );
      if (courseByStudent) {
        await this.courseService.setCourseByStudentActive(
          courseByStudent.id,
          null,
          null
        );
      } else {
        await this.courseService.saveCourseByStudent(
          coursesRefs[i],
          userRef,
          null,
          null,
          true,
          i
        );
      }
    }
  }

  isMonthCompleted(month: Month): boolean {
    return month.courses.every((course) => course.dateEnd !== null);
  }

  isMonthPast(month: any): boolean {
    const currentMonth = new Date().getUTCMonth();
    // const currentMonth = 2; // testing with march
    const currentYear = new Date().getUTCFullYear();
    return (
      month.yearNumber < currentYear ||
      (month.yearNumber === currentYear && month.monthNumber < currentMonth)
    );
  }


  clickEditUser(){

    let link = document.getElementById('linkEditUser');
    if(link){
      link.click()
    } 
  }
  
  getDelayedMonthsCount(): number {
    return this.months
      ? this.months.filter(
          (month) => this.isMonthPast(month) && !this.isMonthCompleted(month)
        ).length
      : null;
  }

  async saveInitForm() {
    await this.userService.saveStudyPlanHoursPerMonth(
      this.student.uid,
      this.hoursPermonthInitForm
    );
    this.student.studyHours = this.hoursPermonthInitForm;
    this.showInitForm = false;
    // calculate dates and create studyplan using this.startDateInitForm
    await this.createStudyPlan();
  }


  ngOnDestroy() {
    if (this.combinedObservableSubscription)
      this.combinedObservableSubscription.unsubscribe();
    if (this.diagnosticTestSubscription)
      this.diagnosticTestSubscription.unsubscribe();
  }

  // ---------------------------------------------------- Skills

  updateWidgets() {
    const chartData = this.getChartData();
    // console.log("chartData", chartData)
    this.getChart(chartData);
    this.updateCategoriesAndSkillsWidget(chartData);
  }

  roundNumber = (num: number): number => {
    return Math.round(num);
  };

  _getChartData() {
    const accumulatedStudyPlanHours = this.studyPlan.reduce(function (
      accumulator,
      course
    ) {
      return accumulator + course.duracion;
    },
    0);
    const roundUpToNextMultipleOfTen = (value) => {
      return Math.ceil(value / 10) * 10;
    };

    const data = this.categories.map((category) => {
      let value = 0;
      let skills = [];
      if (this.studyPlan.length > 0) {
        const coursesWithThisCategory = this.studyPlan.filter((course) => {
          return course.categories.filter((item) => item.id === category.id)
            .length;
        });
        let totalDuration = 0;
        coursesWithThisCategory.forEach((course) => {
          course.skills.forEach((skill) => {
            if (!skills.includes(skill.name)) skills.push(skill.name);
          });
          totalDuration += course.duracion;
        });
        value = roundUpToNextMultipleOfTen(
          this.roundNumber((totalDuration * 100) / accumulatedStudyPlanHours)
        );
      }
      return {
        label: category.name,
        skills: skills,
        value: value,
      };
    });
    return data;
  }

  progreso: number = 0;

  getChartData() {
    let horasPlanDeEstudio = 0;
    let horasCompletadas = 0;

    let cursosdataComplete = this.coursesByStudent.map((curso) => {
      let datosCurso = this.studyPlan.find((x) => x.id == curso.courseRef.id);
      return { ...datosCurso, ...curso };
    });

    // console.log('this.studyPlan', this.coursesData,this.coursesByStudent,this.studyPlan,cursosdataComplete);

    cursosdataComplete.forEach((curso) => {
      horasPlanDeEstudio += curso.duracion;
      horasCompletadas += curso?.progressTime ? curso?.progressTime : 0;
    });

    this.progreso =
      (horasCompletadas * 100) /
      (horasPlanDeEstudio == 0 ? 1 : horasPlanDeEstudio);

    let cursosRadarDone = this.coursesByStudent.filter(
      (x) => x.progress == 100
    );
    let cursosRadarReady = cursosRadarDone.map((curso) => {
      let datosCurso = this.studyPlan.find((x) => x.id == curso.courseRef.id);
      return { ...datosCurso, ...curso };
    });
    const accumulatedStudyPlanHours = this.studyPlan.reduce(function (
      accumulator,
      course
    ) {
      return accumulator + course.duracion;
    },
    0);
    const roundUpToNextMultipleOfTen = (value) => {
      return Math.ceil(value / 10) * 10;
    };

    const data = this.categories.map((category) => {
      let value = 0;
      let valueComplete = 0;
      let skills = [];
      if (this.studyPlan.length > 0) {
        const coursesWithThisCategory = this.studyPlan.filter((course) => {
          return course.categories.filter((item) => item.id === category.id)
            .length;
        });
        let totalDuration = 0;
        coursesWithThisCategory.forEach((course) => {
          horasPlanDeEstudio += course.duracion;
          course.skills.forEach((skill) => {
            if (!skills.includes(skill.name)) skills.push(skill.name);
          });
          totalDuration += course.duracion;
        });
        value = roundUpToNextMultipleOfTen(
          this.roundNumber((totalDuration * 100) / accumulatedStudyPlanHours)
        );

        if (cursosRadarReady.length > 0) {
          const coursesWithThisCategory = cursosRadarReady.filter((course) => {
            return course.categories.filter((item) => item.id === category.id)
              .length;
          });
          let totalDuration = 0;
          coursesWithThisCategory.forEach((course) => {
            course.skills.forEach((skill) => {
              if (!skills.includes(skill.name)) skills.push(skill.name);
            });
            totalDuration += course.duracion;
          });
          valueComplete = roundUpToNextMultipleOfTen(
            this.roundNumber((totalDuration * 100) / accumulatedStudyPlanHours)
          );
        }
      }
      return {
        label: category.name,
        skills: skills,
        value: value,
        valueComplete: valueComplete,
      };
    });
    return data;
  }

  getChart(chartData, score = this.progreso) {
    chartData.sort((a, b) => b.value - a.value);

    let labels = [];
    let values = [];
    let valuesComplete = [];

    chartData.forEach((data) => {
      labels.push(data.label);
      values.push(data.value);
      valuesComplete.push(data.valueComplete);
    });
    if (this.chart) {
      this.chart.destroy();
    }
    let pilares = [];
    let data = null;

    // Definimos un objeto para mapear los pilares originales a los nuevos valores
    const mapeoNombres: { [key: string]: string } = {
      Confiabilidad: "Confiabilidad",
      Eléctrica: "Eléctrica",
      "Gestión de activos": "Gest. Activos",
      "Gestión de mantenimiento": "Gest. Mant.",
      "Gestión de proyectos": "Proyectos",
      HSE: "HSE",
      Instrumentación: "Instrum",
      Integridad: "Integridad",
      "Mantenimiento predictivo": "Predictivo",
      Mecánico: "Mecánico",
      "Sistemas y procesos": "Sist. & Proc.",
      "Soporte a mantenimiento": "Soporte Mant",
    };

    // Nuevo arreglo para los nombres resumidos
    let nombresResumidos: string[] = [];

    // Recorrer el arreglo actual y crear el nuevo con nombres resumidos
    labels.forEach((pilar) => {
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

    data = {
      labels: nombresResumidos,
      datasets: [
        {
          data: valuesComplete,
          label: "Progreso", // Texto para la leyenda
          fill: true,
          backgroundColor: "#BCE8DF",
          borderColor: "#00BF9C",
          pointBackgroundColor: "#00BF9C",
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "#00BF9C",
          pointRadius: 3,
        },
        {
          data: values,
          label: "Plan de Estudio", // Texto para la leyenda
          fill: true,
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          borderColor: "rgb(54, 162, 235)",
          pointBackgroundColor: "rgb(54, 162, 235)",
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "rgb(54, 162, 235)",
          pointRadius: 3, // Los puntos están invisibles
        },
      ],
    };

    const canvas = document.getElementById("chart") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");

    this.chart = new Chart(ctx, {
      type: "radar",
      data: data,

      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            enabled: false,
          },
          legend: {
            display: false,
            position: "bottom",
            labels: {
              boxWidth: 10, // Tamaño de la caja de color
              padding: 10, // Espacio entre los elementos de la leyenda
            },
          },
          annotation: {
            annotations: {
              label1: {
                type: "label",
                xValue: 2.5,
                yValue: 60,
                backgroundColor: "rgba(255,255,255,0.8)",
                borderRadius: 16,
                content: `${score > 0 ? score.toFixed(0) : ""}`,
                font: {
                  size: 14,
                },
              },
            },
          },
        },
        elements: {
          line: {
            borderWidth: 1,
          },
        },
        scales: {
          r: {
            beginAtZero: true,
            ticks: {
              display: false,
              stepSize: 20,
            },
          },
        },
      },
    });
  }

  _getChart(chartData) {
    let labels = [];
    let values = [];
    chartData
      .filter((item) => item.value !== 0)
      .forEach((data) => {
        labels.push(data.label);
        values.push(data.value);
      });
    const canvas = document.getElementById("chart") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    // const horizontalMargin = this.horizontalMargin
    if (this.chart) {
      this.chart.destroy();
    }
    this.chart = new Chart(ctx, {
      type: "radar",
      data: {
        labels: labels,
        datasets: [
          {
            data: values,
            fill: true,
            backgroundColor: "rgba(54, 162, 235, 0.2)",
            borderColor: "rgb(54, 162, 235)",
            pointBackgroundColor: "rgb(54, 162, 235)",
            pointBorderColor: "#fff",
            pointHoverBackgroundColor: "#fff",
            pointHoverBorderColor: "rgb(54, 162, 235)",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        elements: {
          line: {
            borderWidth: 3,
          },
        },
        scales: {
          r: {
            // max: 100,
            beginAtZero: true,
            ticks: {
              display: false,
              stepSize: 20,
            },
          },
        },
      },
    });
  }

  categoriesAndSkillsWidgetData = [];

  updateCategoriesAndSkillsWidget(chartData) {
    this.categoriesAndSkillsWidgetData = chartData.filter(
      (category) => category.skills.length > 0
    );
    // console.log("this.categoriesAndSkillsWidgetData", this.categoriesAndSkillsWidgetData)
  }

  getAdditionalSkillsTooltip(skills: string[]): string {
    // Toma las habilidades a partir de la quinta y las une con comas.
    return skills.slice(4).join(",\n");
  }

  modalResult
  makeChart


  showResult(modal){

    if(this.diagnosticTest.certificationTest){
      console.log('diagnosticTest',this.diagnosticTest)

      this.diagnosticTest.resultByClass.sort((a, b) => b['score'] - a['score']);
      this.modalResult = this.modalService.open(modal, {
        ariaLabelledBy: "modal-basic-title",
        centered: true,
        size: "lg",
      });

      setTimeout(() => {
        this.makeChart=this.makeChart+1
      }, 200)
    }
    else{
      console.log('diagnosticTest',this.diagnosticTest)
      console.log('no valid')
    }

  }
}
