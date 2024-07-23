import { Component } from "@angular/core";
import { FormControl } from "@angular/forms";
import { Chart } from "chart.js";
import {
  Observable,
  Subscription,
  combineLatest,
  map,
  startWith,
  BehaviorSubject,
  finalize,
  firstValueFrom,
  retry,
} from "rxjs";
import { Category } from "projects/shared/models/category.model";
import { Curso, CursoJson } from "projects/shared/models/course.model";
import { Skill } from "projects/shared/models/skill.model";
import { CategoryService } from "projects/predyc-business/src/shared/services/category.service";
import { CourseService } from "projects/predyc-business/src/shared/services/course.service";
import { IconService } from "projects/predyc-business/src/shared/services/icon.service";
import { SkillService } from "projects/predyc-business/src/shared/services/skill.service";
import { roundNumber } from "projects/shared/utils";
import { Title } from "@angular/platform-browser";
import { ActivatedRoute, Router } from "@angular/router";
import { ProfileService } from "projects/predyc-business/src/shared/services/profile.service";
import { Profile, ProfileJson } from "projects/shared/models/profile.model";
import {
  AngularFirestore,
  DocumentReference,
} from "@angular/fire/compat/firestore";
import { AlertsService } from "projects/predyc-business/src/shared/services/alerts.service";
import { EnterpriseService } from "projects/predyc-business/src/shared/services/enterprise.service";
import { AuthService } from "projects/predyc-business/src/shared/services/auth.service";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import Swal from 'sweetalert2';
import { Diplomado, DiplomadoJson } from "projects/shared/models/diplomado.model";

import { LiveCourse, cleanFileName } from "projects/shared";
import { AngularFireStorage } from "@angular/fire/compat/storage";
import { ActivityClassesService } from "projects/predyc-business/src/shared/services/activity-classes.service";
import { Activity } from "projects/functions/dist/shared/models";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { DiplomadoService } from "projects/predyc-business/src/shared/services/diplomado.service";
import { LiveCourseService } from "projects/predyc-business/src/shared/services/live-course.service";
import { InstructorsService } from '../../../../services/instructors.service';
import { LiveDiplomado, LiveDiplomadoJson } from "projects/shared/models/live-diplomado.model";

import { DialogChooseBaseLiveCourseComponent } from "../../dialog-choose-base-live-course/dialog-choose-base-live-course.component";


const MAIN_TITLE = "Predyc - ";

interface CoursesForExplorer extends CursoJson {
  skills: Skill[];
  categories: Category[];
  inStudyPlan: boolean;
}

@Component({
  selector: "app-diplomado-form",
  templateUrl: "./diplomado-form.component.html",
  styleUrls: ["./diplomado-form.component.css"],
})
export class DiplomadoLiveFormComponent {
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
    private titleService: Title,
    private authService: AuthService,
    private afs: AngularFirestore,
    private storage: AngularFireStorage,
    private activityClassesService:ActivityClassesService,
    private modalService: NgbModal,
    private diplomadoService: DiplomadoService,
    private liveCourseService:LiveCourseService,
    private instructorsService:InstructorsService,
  ) {}

  isEditing: boolean;

  chart: Chart;

  serviceSubscription: Subscription;
  studyPlan = [];

  categories: Category[];
  // courses: Curso[]
  skills: Skill[];
  diplomado: LiveDiplomadoJson;

  coursesForExplorer: CoursesForExplorer[];
  filteredCourses: Observable<CoursesForExplorer[]>;
  searchControl = new FormControl("");
  hoverItem$: Observable<any>; // This will hold the currently hovered item
  private hoverSubject = new BehaviorSubject<any>(null);

  diplomadoName: string = "";
  diplomadoDate:string
  profileDescription: string = "";

  profileBackup;

  id = this.route.snapshot.paramMap.get("id");
  baseDiplomado: string;
  user;
  profileServiceSubscription: Subscription;
  diplomados: LiveDiplomado[] = [];

  activitySubscription: Subscription;
  activities = []

  activityId = null;
  activityRef;

  type = 'diplomado'

  formatDate(seconds: number): string {
    if (!seconds) return '';

    // Convertir los segundos a un objeto Date de JavaScript
    const jsDate = new Date(seconds * 1000);

    const year = jsDate.getFullYear();
    const month = (jsDate.getMonth() + 1).toString().padStart(2, '0');
    const day = jsDate.getDate().toString().padStart(2, '0');

    return `${year}-${month}-${day}`;
  }


  ngOnInit() {


    this.activitySubscription = this.activityClassesService.getActivityCertifications().subscribe(activities => {
      //let activitiesFiltered = activities.filter(x=>x.subType !="initTest")
      let activitiesFiltered = activities
      console.log('activitiesFiltered',activitiesFiltered)
      this.activities = activitiesFiltered

    })

    this.profileServiceSubscription = this.liveCourseService.getDiplomados$()
      .subscribe((diplomados) => {
        if (diplomados) {
          // console.log('diplomados',diplomados)
          let profilesBase = [];
          diplomados.forEach((element) => {
            if (element?.baseDiplomado?.id) {
              profilesBase.push(element?.baseDiplomado?.id);
            }
          });

          this.diplomados = diplomados;
          console.log('perfiles', this.diplomados);
        }
      });

    this.authService.user$.subscribe((user) => {
      this.user = user;
    });

    this.hoverItem$ = this.hoverSubject.asObservable();
    this.baseDiplomado = this.route.snapshot.queryParams["baseDiplomado"] || null;
    const observablesArray: Observable<
      Category[] | Diplomado | Skill[] | Curso[] | any[] | LiveDiplomado
    >[] = [
      this.categoryService.getCategories$(),
      this.skillService.getSkills$(),
      this.liveCourseService.getAllLiveCoursesTemplatesWithSessionsTemplates$(),
      this.instructorsService.getInstructorsObservable()
    ];
    if (this.id === "new") {
      this.isEditing = true;
      const title = MAIN_TITLE + "Nuevo diplomado";
      this.titleService.setTitle(title);
      if (this.baseDiplomado) {
        observablesArray.push(
          this.liveCourseService.getDiplomado$(this.baseDiplomado)
        );
      }
    } else {
      this.isEditing = false;
      observablesArray.push(this.liveCourseService.getDiplomado$(this.id));
      observablesArray.push(this.liveCourseService.getLiveCoursesWithSessionsByDiplomadoId$(this.id));

    }
    this.serviceSubscription = combineLatest(observablesArray).subscribe(
      (result) => {
        const categories = result[0] as Category[];
        const skills = result[1] as Skill[];
        let coursesData = result[2] as any[];
        let instrcutorsData = result[3] as any[];
        let courses = coursesData.map((x) => {
          //console.log(x.liveCourseTemplate.instructorRef.id)
          let idInstructor = x.liveCourseTemplate.instructorRef.id
          return {
            idInstructor,
            instructorData:instrcutorsData.find(x=>x.id == idInstructor),
            duracion:x.liveCourseTemplate.duration,
            imagen:x.liveCourseTemplate.photoUrl,
            titulo:x.liveCourseTemplate.title,
            ...x.liveCourseTemplate,
            sessions: x.sessionsTemplates,
          };
        });
        console.log('courses',courses,instrcutorsData)
        //courses = courses.filter((x) => !x.proximamente);
        let cursosLive = null
        if (result.length === 6) {
          cursosLive = result[5]
          const diplomado = result[4] as LiveDiplomadoJson;
          this.diplomado = {
            ...diplomado,
            name: this.baseDiplomado ? "" : diplomado.name,
            id: this.baseDiplomado ? null : diplomado.id,
          } as LiveDiplomadoJson;
        }
        this.categories = categories;
        this.skills = skills;
        if (this.diplomado) {
          const title = MAIN_TITLE + this.diplomado.name;
          this.titleService.setTitle(title);
          this.diplomadoName = this.diplomado.name;
          this.diplomadoDate = this.diplomado.startDate;
          this.photoUrl = this.diplomado.photoUrl;
          this.type = this.diplomado.type ? this.diplomado.type : 'diplomado' ;
          this.duration = this.diplomado.duration;

          this.activityRef = this.diplomado.activityRef;
          if(this.activityRef){
            this.activityId = this.activityRef.id
          }

          this.profileDescription = this.diplomado.description;
        }
        this.studyPlan = [];
        // this.courses = courses
        this.coursesForExplorer = courses.map((course) => {
          const skills = course.skillsRef.map((skillRef) => {
            return this.skills.find((skill) => skill.id === skillRef.id);
          });
          const categories = [];
          skills.forEach((skill) => {
            const category = this.categories.find(
              (category) => category.id === skill.category.id
            );
            if (!categories.map((item) => item.id).includes(category.id))
              categories.push(category);
          });
          const studyPlanItemCourseRefItem = this.diplomado
            ? this.diplomado.coursesRef.find((x: any) => {
                return x.courseRef.id === course.id;
              })
            : null;
          const inStudyPlan = studyPlanItemCourseRefItem ? true : false;
          const courseForExplorer = {
            ...course,
            skills: skills,
            categories: categories,
            inStudyPlan: inStudyPlan,
            studyPlanOrder: studyPlanItemCourseRefItem
              ? studyPlanItemCourseRefItem.studyPlanOrder
              : null,
          };
          console.log('courseForExplorer',courseForExplorer)
          if (inStudyPlan){
            if(cursosLive){
              console.log('cursosLive',cursosLive,courseForExplorer.id)
              let curso = cursosLive.find(x=>x.liveCourse?.liveCourseTemplateRef?.id == courseForExplorer.id)
              console.log('curso',curso)
              courseForExplorer.titulo = curso.liveCourse.title
              let datosLive = {
                date:curso.sessions[0].date.seconds * 1000,
                curso:curso
              }
              courseForExplorer.datosLive = datosLive
            }
            this.studyPlan.push(courseForExplorer)
          }
          return courseForExplorer;
        });

        console.log('studyPlan',this.studyPlan)

        //this.studyPlan.sort((a, b) => a.studyPlanOrder - b.studyPlanOrder);

        this.studyPlan.sort((a, b) => {
          const dateA = a.datosLive?.date;
          const dateB = b.datosLive?.date;
      
          if (dateA && dateB) {
            return dateA - dateB;
          } else if (dateA) {
            return -1;
          } else if (dateB) {
            return 1;
          } else {
            return 0;
          }
        });

        this.updateWidgets();

        this.categories = this.categories.filter((category) => {
          const coursesWithThisCategory = this.coursesForExplorer.filter(
            (course) => {
              const categories = course.categories.map(
                (category) => category.name
              );
              return categories.includes(category.name);
            }
          );
          return coursesWithThisCategory.length > 0;
        });
        this.filteredCourses = combineLatest([
          this.searchControl.valueChanges.pipe(startWith("")),
          this.hoverItem$,
        ]).pipe(
          map(([searchText, hoverCategory]) => {
            if (!searchText && !hoverCategory) return [];
            let filteredCourses = this.coursesForExplorer;
            if (hoverCategory) {
              filteredCourses = filteredCourses.filter((course) => {
                const categories = course.categories.map(
                  (category) => category.name
                );
                return categories.includes(hoverCategory.name);
              });
            }
            if (searchText) {
              const filterValue = this.removeAccents(searchText.toLowerCase());filteredCourses = filteredCourses.filter((course) => (this.removeAccents(course['instructorData']['nombre'].toLowerCase()).includes(filterValue) || this.removeAccents(course.titulo.toLowerCase()).includes(filterValue))
              );
            }
            return filteredCourses;
          })
        );
      }
    );
  }

  removeAccents(str: string): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  onCategoryHover(item: any) {
    this.hoverSubject.next(item);
  }

  onCategoryLeave() {
    this.hoverSubject.next(null);
  }

  getStudyPlanLength(){
    //console.log(this.studyPlan)

    let duracion = 0

    this.studyPlan?.forEach(curso => {
      duracion+=curso.duracion
    });
    this.duration = duracion;
    return this.getFormattedDuration(duracion)
  }

  duration = 0

  getFormattedDuration(duracion) {
    const hours = Math.floor(duracion / 60);
    const minutes = duracion % 60;
    return `${hours} hrs ${minutes} min`;
  }

  toggleCourseInPlan(course) {
    console.log(this.studyPlan);
    course.inStudyPlan = !course.inStudyPlan;
    if (course.inStudyPlan) {
      this.studyPlan.push({
        ...course,
        studyPlanOrder: this.studyPlan.length + 1,
      });
    } else {
      const targetIndex = this.studyPlan.findIndex(
        (item) => item.id === course.id
      );
      this.studyPlan.splice(targetIndex, 1);
    }
    this.studyPlan.forEach((course, idx) => {
      course.studyPlanOrder = idx + 1;
    });
    this.updateWidgets();
  }

  onEdit() {
    if (this.user.isSystemUser || this.diplomado.enterpriseRef) {
      this.profileBackup = {
        name: this.diplomadoName,
        startDate:this.diplomadoDate,
        photoUrl:this.photoUrl,
        type:this.type,
        duration:this.duration,
        activityRef:this.activityRef,
        description: this.profileDescription,
        selectedCourses: this.studyPlan.map((item) => {
          return {
            courseId: item.id,
            studyPlanOrder: item.studyPlanOrder,
          };
        }),
      };
      this.isEditing = true;
    } else {
      let url = `/management/profiles/new?baseDiplomado=${this.diplomado.id}`;
      location.href = url;
    }
  }

  onCancel() {
    if (this.id === "new") {
      this.router.navigate(["/admin/live"]);
    } else {
      window.location.reload();
    }
  }

  roundNumber(number: number) {
    return roundNumber(number);
  }

  updateWidgets() {
    const chartData = this.getChartData();
    this.getChart(chartData);
    this.updateCategoriesAndSkillsWidget(chartData);
  }

  getChartData() {
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

  getChart(chartData) {
    // console.log('chartData',chartData)
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
          legend: {
            display: false,
            position: "bottom",
            labels: {
              boxWidth: 10, // Tamaño de la caja de color
              padding: 10, // Espacio entre los elementos de la leyenda
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
  }

  disableSaveButton: boolean = false;

  async onSave() {

    try {
      if (!this.diplomadoDate)
        throw new Error("Debe indicar la fecha inicial diplomado");
      if (!this.diplomadoDate)
        throw new Error("Debe indicar un nombre para el diplomado");
      if (
        this.diplomados.find(
          (x) =>
            x.name.toLowerCase() == this.diplomadoName.toLowerCase() &&
            x.id != this.diplomado?.id &&
            this.diplomado?.baseDiplomado.id != x.id
        )
      )
        throw new Error("El nombre del diplomado se encuentra en uso");

      if (this.studyPlan.find((x) => !x.datosLive) && this.id == 'new') throw new Error("Hay cursos con datos incompletos");

      this.disableSaveButton = true;
      this.alertService.infoAlert(
        "Se procederá a actualizar los datos del plan de estudio del perfil y de sus usuarios relacionados, por favor espere hasta que se complete la operación"
      );

      Swal.fire({
        title: 'Editando diplomado...',
        text: 'Por favor, espera.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading()
        }
      });
      const coursesRef: {
        courseRef: DocumentReference<LiveCourse>;
        studyPlanOrder: number;
      }[] = this.studyPlan.map((course) => {
        return {
          courseRef: this.liveCourseService.getCourseRefById(course.id),
          studyPlanOrder: course.studyPlanOrder,
        };
      });

      //console.log('coursesRef',coursesRef)

      if (!coursesRef || coursesRef.length == 0){
        Swal.close();
        throw new Error("Debe indicar los cursos del plan de estudio");
      }
      

      let enterpriseRef = this.enterpriseService.getEnterpriseRef();
      if (this.user.isSystemUser) {
        enterpriseRef = null;
      }
      let baseDiplomado = null;

      let diplomadoDate =this.diplomadoDate;

      const diplomado: LiveDiplomado = LiveDiplomado.fromJson({
        id: this.diplomado ? this.diplomado.id : null,
        name: this.diplomadoName,
        startDate: diplomadoDate,
        photoUrl: this.photoUrl ? this.photoUrl : null,
        duration: this.duration,
        type: this.type,
        activityRef: this.activityRef ? this.activityRef : null,
        description: this.profileDescription,
        coursesRef: coursesRef,
        baseDiplomado: this.diplomado?.baseDiplomado
          ? this.diplomado?.baseDiplomado
          : baseDiplomado,
        enterpriseRef: enterpriseRef,
        emailLastDate: null
      });

      console.log('diplomado save',diplomado)
      const changesInStudyPlan = {
        added: [],
        removed: [],
        studyPlan: this.studyPlan,
        profileId: this.diplomado?.id ? this.diplomado?.id : null,
      };
      if (this?.id !== "new") {
        this.coursesForExplorer.forEach((course) => {
          const studyPlanItem = this.studyPlan.find(
            (item) => item.id === course.id
          );
          const isInStudyPlan = studyPlanItem?.id ? true : false;
          const studyPlanItemBackup = this.profileBackup.selectedCourses.find(
            (item) => item.courseId === course.id
          );
          const wasInStudyPlan = studyPlanItemBackup?.courseId ? true : false;
          if (isInStudyPlan !== wasInStudyPlan) {
            // Study Plan changed
            if (isInStudyPlan) {
              changesInStudyPlan.added.push({
                id: course.id,
                studyPlanOrder: studyPlanItem.studyPlanOrder,
              });
            } else {
              changesInStudyPlan.removed.push({
                id: course.id,
              });
            }
          }
        });

        await this.liveCourseService.saveDiplomado(diplomado);
      } else {
        console.log("diplomado", diplomado);
        const diplomadoId = await this.liveCourseService.saveDiplomado(diplomado);
        this.diplomado = diplomado;
        
        if(this.id == 'new'){
          for (let cursoEnVivo of this.studyPlan) {
            try {
              await this.liveCourseService.saveLiveCourseComplete(
                this.activityClassesService,
                cursoEnVivo.datosLive.formValue,
                cursoEnVivo.datosLive.sessions,
                cursoEnVivo.datosLive.liveCourseDiagnosticTest,
                cursoEnVivo.datosLive.liveCourseFinalTest,
                diplomado.id
              );
            } catch (error) {
              console.error('Error saving live course:', error);
            }
          }
        }
        this.id = diplomadoId;
        
        this.router.navigate([`/admin/live-sessions/diplomates-live/form/${diplomadoId}`]);
        this.titleService.setTitle(MAIN_TITLE + this.diplomado.name);
      }
      Swal.close();
      this.alertService.succesAlert("Completado");
      this.disableSaveButton = false;
      this.isEditing = false;
    } catch (error) {
      Swal.close();
      console.error(error);
      this.alertService.errorAlert(error.message);
      this.disableSaveButton = false;
    }
  }

  ngOnDestroy() {
    if (this.serviceSubscription) this.serviceSubscription.unsubscribe();
    if (this.chart) this.chart.destroy();
  }

  getAdditionalSkillsTooltip(skills: string[]): string {
    // Toma las habilidades a partir de la quinta y las une con comas.
    return skills.slice(4).join(",\n");
  }

  onDrop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.studyPlan, event.previousIndex, event.currentIndex);
    this.studyPlan.forEach((course, idx) => {
      course.studyPlanOrder = idx + 1;
    });
  }


  onFileSelected(event, type) {
		const input = event.target as HTMLInputElement;
		if (!input || !input.files || !input.files[0]) {
			this.alertService.errorAlert(`Debe seleccionar un archivo`);
			return;
		}
		const file = input.files[0];

		/* checking size here - 10MB */
		if (type === "photoUrl") {
			const imageMaxSize = 10000000;
			if (file.size > imageMaxSize) {
				this.alertService.errorAlert(`El archivo es mayor a 1MB por favor incluya una imagen de menor tamaño`);
				return;
			}
		} else if (type === "file") {
			// Do something
		} else {
			return;
		}

		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = (_event) => {
			if (type === "photoUrl") {
				this.photoUrl = reader.result;
				this.uploadedImage = file;
        this.savePhotoUrl();
			} else if (type === "file") {
				this.uploadedFile = file;
				const fileName = cleanFileName(this.uploadedFile.name);
				this.uploadedFileName = fileName
			}
		};
	}

	photoUrl;
	uploadedImage;
	uploadedFile;
	uploadedFileName


  async savePhotoUrl() {
		if (this.uploadedImage) {
			// Upload new image
			const fileName = cleanFileName(this.uploadedImage.name);
			const filePath = `Diplomados-Live/${this.diplomadoName}`;
			const fileRef = this.storage.ref(filePath);
			const task = this.storage.upload(filePath, this.uploadedImage);
			await new Promise<void>((resolve, reject) => {
				task.snapshotChanges()
					.pipe(
						finalize(async () => {
							const photoUrl = await firstValueFrom(fileRef.getDownloadURL());
							console.log("photoUrl has been uploaded!",photoUrl);
							this.photoUrl = photoUrl;
							this.uploadedImage = null;
							resolve();
						})
					)
					.subscribe({
						next: () => {},
						error: (error) => reject(error),
					});
			});
		}
	}

  changedActivity(){

    console.log('activityId',this.activityId)

    if(this.activityId){
      const activityRef = this.afs.collection(Activity.collection).doc(this.activityId).ref;
      this.activityRef = activityRef
    }
    else{
      this.activityRef = null

    }


  }

  getActivityName(){
    if(this.activityId){
      let activity = this.activities.find(x=>x.id == this.activityId)
      return 'Examen final - '+activity.title
    }

    return "Sin Examen"

  }
  showImport = false

  modalExamen
  questions;

  showExamenDetails(modal){
    
    let activity = this.activities.find(x=>x.id == this.activityId)
    this.questions = activity.questions
    console.log(activity,this.questions)


    this.modalExamen = this.modalService.open(modal, {
      ariaLabelledBy: "modal-basic-title",
      centered: true,
      size: "md",
    });

  }


  importUsers(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e: any) => {
        try {
          const json = JSON.parse(e.target.result);
          console.log('Imported JSON:', json);
          // Aquí puedes manejar los datos JSON como necesites

          for (let i = 0; i < json.length; i++) {
            const userEnroll = json[i];
            let enrollDate = new Date()
            if(userEnroll.fechaInscripcion){
              enrollDate = new Date(userEnroll.fechaInscripcion)
            }
            await this.diplomadoService.enrollUserDiplomadoWithMail(this.id, userEnroll.id,enrollDate);
          }
          console.log('all data migrated');

        } catch (error) {
          console.error('Error parsing JSON:', error);
        }
      };
      reader.readAsText(file);
    }
  }




  openModalCurso(curso) {

    if (this.id != 'new'){
      const id = curso.datosLive.curso.liveCourse.id;
      const url = this.router.serializeUrl(this.router.createUrlTree([`/admin/live-sessions/${id}/${id}`]));
      window.open(url, '_blank');
      return;
    }
    const modalRef = this.modalService.open(DialogChooseBaseLiveCourseComponent, {
      animation: true,
      centered: true,
      //size: 'lg',
      backdrop: "static",
      keyboard: false,
    });

    let data = {
      curso: curso,
      date:curso?.datosLive?.date ? curso.datosLive.date : null,
      meetingLink:curso?.datosLive?.formValue?.meetingLink ? curso.datosLive.formValue.meetingLink : null,
      identifyingText:curso?.datosLive?.formValue?.identifyingText ? curso.datosLive.formValue.identifyingText : null
    };

    modalRef.componentInstance.datosCurso = data;
    modalRef.result.then(async (result) => {
        if (result) {
          try {
            console.log(result)
            curso.datosLive = result
            curso.datosLive.date = this.parseDateString(result.formValue.sessionsDates[result.sessions[0].id]);
            //studyPlan
            this.studyPlan.sort((a, b) => {
              const dateA = a.datosLive?.date;
              const dateB = b.datosLive?.date;
          
              if (dateA && dateB) {
                return dateA - dateB;
              } else if (dateA) {
                return -1;
              } else if (dateB) {
                return 1;
              } else {
                return 0;
              }
            });

          } catch (error) {
            console.error(error);
          }
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }


  parseDateString(date: string): Date {
    date = date.replace("T", "-");
    let parts = date.split("-");
    let timeParts = parts[3].split(":");

    // new Date(year, month [, day [, hours[, minutes[, seconds[, ms]]]]])
    return new Date(+parts[0], +parts[1] - 1, +parts[2], +timeParts[0], +timeParts[1]); // Note: months are 0-based
  }


  

 
}
