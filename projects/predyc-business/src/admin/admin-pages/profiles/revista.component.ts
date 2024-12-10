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
  take,
  firstValueFrom,
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
import { UserService } from "projects/predyc-business/src/shared/services/user.service";
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
import { PDFService } from "projects/predyc-business/src/shared/services/pdf.service";
import { InstructorsService } from "projects/predyc-business/src/shared/services/instructors.service";

const MAIN_TITLE = "Predyc - ";

interface CoursesForExplorer extends CursoJson {
  skills: Skill[];
  categories: Category[];
  inStudyPlan: boolean;
}

@Component({
  selector: "app-revista",
  templateUrl: "./revista.component.html",
  styleUrls: ["./revista.component.css"],
})
export class RevistaComponent {
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
    private titleService: Title,
    private authService: AuthService,
    private afs: AngularFirestore,
    private instructorsService:InstructorsService,
    private pdfService: PDFService
  ) {}

  isEditing: boolean;

  chart: Chart;

  serviceSubscription: Subscription;
  studyPlan = [];

  categories: Category[];
  // courses: Curso[]
  skills: Skill[];
  profile: ProfileJson;

  coursesForExplorer: CoursesForExplorer[];
  filteredCourses: Observable<CoursesForExplorer[]>;
  searchControl = new FormControl("");
  hoverItem$: Observable<any>; // This will hold the currently hovered item
  private hoverSubject = new BehaviorSubject<any>(null);

  profileName: string = "";
  profileDescription: string = "";
  profileHoursPerMonth: number = 8;

  profileBackup;

  id = this.route.snapshot.paramMap.get("id");
  baseProfile: string;
  user;
  profileServiceSubscription: Subscription;
  profiles: Profile[] = [];
  instrcutores
  courses

  async ngOnInit() {

    this.authService.user$.subscribe((user) => {
      this.user = user;
    });

    if (this.id === "new") {
      this.isEditing = true;
      const title = MAIN_TITLE + "Nueva revista P21";
      this.titleService.setTitle(title);
    } else {
      this.isEditing = false;
    }

    this.coursesForExplorer = await this.courseService.getArticulosRevista() as any[]

    console.log('coursesForExplorer',this.coursesForExplorer)

    this.filteredCourses = combineLatest([
      this.searchControl.valueChanges.pipe(startWith(""))]).pipe(
      map(([searchText]) => {
        // Si no hay texto de búsqueda ni categoría seleccionada, devolver todo
        if (!searchText) return [];
    
        // Obtener los cursos disponibles
        let filteredCourses = this.coursesForExplorer;
    
        // Filtrar por categoría si existe
    
        // Filtrar por texto de búsqueda si existe
        if (searchText) {
          alert('aqui')
          const filterValue = this.removeAccents(searchText.toLowerCase());
          filteredCourses = filteredCourses.filter((course) =>
            this.removeAccents(course['title'].toLowerCase()).includes(filterValue)
          );
        }
    
        return filteredCourses;
      })
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

    let duracion = 0

    this.studyPlan?.forEach(curso => {
      duracion+=curso.duracion
    });
    return this.getFormattedDuration(duracion)
  }

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
    // this.updateWidgets();
  }

  onEdit() {
    if (this.user.isSystemUser || this.profile.enterpriseRef) {
      this.profileBackup = {
        name: this.profileName,
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
      let url = `/management/profiles/new?baseProfile=${this.profile.id}`;
      location.href = url;
    }
  }

  onCancel() {
    if (this.id === "new") {
      this.router.navigate(["/management/profiles"]);
    } else {
      this.profileName = this.profileBackup.name;
      this.profileDescription = this.profileBackup.description;
      let studyPlanChanged = false;
      this.coursesForExplorer.forEach((course) => {
        const isInStudyPlan = course.inStudyPlan;
        const wasInStudyPlan = this.profileBackup.selectedCourses.includes(
          course.id
        );
        course.inStudyPlan = wasInStudyPlan;
        if (isInStudyPlan !== wasInStudyPlan) {
          studyPlanChanged = true;
          if (wasInStudyPlan) {
            this.studyPlan.push(course);
          } else {
            const targetIndex = this.studyPlan.findIndex(
              (item) => item.id === course.id
            );
            this.studyPlan.splice(targetIndex, 1);
          }
        }
      });
      this.isEditing = false;
    }
  }

  roundNumber(number: number) {
    return roundNumber(number);
  }



  disableSaveButton: boolean = false;

  async onSave() {
    try {
      if (!this.profileName)
        throw new Error("Debe indicar un nombre para el perfil");

      if (
        this.profiles.find(
          (x) =>
            x.name.toLowerCase() == this.profileName.toLowerCase() &&
            x.id != this.profile?.id &&
            this.profile?.baseProfile.id != x.id
        )
      )
        throw new Error("El nombre del perfil se encuentra en uso");

      this.disableSaveButton = true;
      this.alertService.infoAlert(
        "Se procederá a actualizar los datos del plan de estudio del perfil y de sus usuarios relacionados, por favor espere hasta que se complete la operación"
      );

      Swal.fire({
        title: 'Editando plan de estudio...',
        text: 'Por favor, espera.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading()
        }
      });
      const coursesRef: {
        courseRef: DocumentReference<Curso>;
        studyPlanOrder: number;
      }[] = this.studyPlan.map((course) => {
        return {
          courseRef: this.courseService.getCourseRefById(course.id),
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
      let baseProfile = null;
      if (this.baseProfile) {
        baseProfile = this.afs
          .collection<Profile>(Profile.collection)
          .doc(this.baseProfile).ref;
      }

      const profile: Profile = Profile.fromJson({
        id: this.profile ? this.profile.id : null,
        name: this.profileName,
        description: this.profileDescription,
        coursesRef: coursesRef,
        baseProfile: this.profile?.baseProfile
          ? this.profile?.baseProfile
          : baseProfile,
        enterpriseRef: enterpriseRef,
        permissions: this.profile ? this.profile.permissions : null,
        hoursPerMonth: this.profileHoursPerMonth,
      });

      console.log('profile save',profile)
      const changesInStudyPlan = {
        added: [],
        removed: [],
        studyPlan: this.studyPlan,
        profileId: this.profile?.id ? this.profile?.id : null,
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

        const studyPlanHasBeenUpdated = await this.courseService.updateStudyPlans(changesInStudyPlan,this.profileHoursPerMonth);
        if (studyPlanHasBeenUpdated)
          await this.profileService.saveProfile(profile);
        else{
          Swal.close();
          throw new Error(
            "Ocurrió un error actualizando el plan de estudios de los estudiantes que poseen este perfil"
          );
        }

      } else {
        console.log("profile", profile);
        const profileId = await this.profileService.saveProfile(profile);
        this.id = profileId;
        this.profile = profile;
        this.router.navigate([`management/profiles/${profileId}`]);
        this.titleService.setTitle(MAIN_TITLE + this.profile.name);
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
  showNotification: boolean = false;
  notificationMessage: string = '';


  async downloadPdfStudyPlan(): Promise<void> {
    this.showNotification = true;
    this.notificationMessage = "Descargado archivo... Por favor, espera.";
    try {
      let cursosPDF = this.studyPlan
      let nombreArchivo = 'Ficha técnica perfil'
      if(this.profile?.name){
        nombreArchivo = `Ficha técnica ${this.profile.name}`
      }
      await this.pdfService.downloadFichaTecnicaMultiple(cursosPDF, nombreArchivo, false);
    } catch (error) {
      console.error(error);
    } finally {
      this.showNotification = false;
    }
  }
}
