import { Component } from '@angular/core';
import { Subscription, Observable, take, combineLatest, mergeMap, map } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { CategoryService } from '../../../services/category.service';
import { CourseService } from '../../../services/course.service';
import { EnterpriseService } from '../../../services/enterprise.service';
import { IconService } from '../../../services/icon.service';
import { LicenseService } from '../../../services/license.service';
import { ProductService } from '../../../services/product.service';
import { SkillService } from '../../../services/skill.service';
import { Curso, Enterprise, License, Product, Subscription as SubscriptionClass, firestoreTimestampToNumberTimestamp } from 'projects/shared';
import { LiveCourseService } from '../../../services/live-course.service';
import { InstructorsService } from '../../../services/instructors.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DialogChooseBaseLiveCourseComponent } from '../dialog-choose-base-live-course/dialog-choose-base-live-course.component';

export class category {
  name: string = ""
  courses: any[] = []
  expanded: boolean = false
}

export interface CalendarLiveCourseData {
  baseCourseTitle: string
  baseCoursePhoto: string
  baseCourseId: string
  courseSonId: string
  courseSonIdentifierText: string
  courseSonMeetingLink: string
  sessionDuration: number
  sessionTitle: string
  sessionSonId: string
  sessionSonDate: number
  sessionSonVimeoId1: number
  sessionSonVimeoId2: string
}

@Component({
  selector: 'app-live-courses',
  templateUrl: './live-courses.component.html',
  styleUrls: ['./live-courses.component.css']
})
export class LiveCoursesComponent {

  constructor(
    public icon: IconService,
    public categoryService : CategoryService,
    public courseService : CourseService,
    public skillService: SkillService,
    private enterpriseService: EnterpriseService,
    private authService: AuthService,
    private productService: ProductService,
    public licenseService: LicenseService,
    public liveCourseService: LiveCourseService,
    public instructorService: InstructorsService,
		private modalService: NgbModal,

  ) {}

  subscriptionClass = SubscriptionClass

  cursos: Curso[] = []
  selectedCourse: any = null
  tab = 1
  detailCourseTab = 0
  searchValue = ""
  creatingCategory = false
  newCategory: category = new category
  categories

  user;
  enterprise: Enterprise
  product: Product

  licenses$: Observable<License[]> = this.licenseService.getCurrentEnterpriseLicenses$()

  licensesSubscription: Subscription;
  subscriptionObservableSubs: Subscription
  productServiceSubscription: Subscription

  calendarLiveCourses: CalendarLiveCourseData[] = []


  ngAfterViewInit() {
    this.handleImageError();
  }

  ngOnDestroy() {
    if (this.subscriptionObservableSubs) this.subscriptionObservableSubs.unsubscribe()
  }

  getFormattedDuration(): string {
    const hours = Math.floor(this.selectedCourse.duracion / 60);
    const minutes = this.selectedCourse.duracion % 60;
    return `${hours} hrs ${minutes} min`;
  }

  async ngOnInit() {

    this.authService.user$.subscribe(user=> {
      if (user) {
        // console.log('user',user)
        this.user = user
        if(!user.isSystemUser){ // alterado por Arturo para buscar licencia activa de la empresa y no el usuario admin
          this.licensesSubscription = this.licenses$.subscribe(licenses => {
            let licenseActive = licenses.find(x=>x.status == 'active')
            // console.log('licenseActive',licenseActive)
            if(licenseActive){
              this.productServiceSubscription = this.productService.getProductById$(licenseActive.productRef.id).subscribe(product => {
                if (!product) return
                this.product = product
              })
              
            }
          })
        }
      }
    })

    this.cursos = []
    this.enterpriseService.enterpriseLoaded$.subscribe(isLoaded => {
      if (isLoaded) {
        this.enterprise = this.enterpriseService.getEnterprise();
      }
    })

    combineLatest(
      [
        this.categoryService.getCategoriesObservable(), 
        this.skillService.getSkills$(), 
        this.liveCourseService.getAllLiveCoursesWithSessions$(),
        this.instructorService.getInstructors$()
      ]
    ).subscribe(async ([categories, skills, coursesData, instructors]) => {
      this.categories = this.anidarCompetenciasInicial(categories, skills);

      let courses = coursesData.map(x => {
        return { 
          ...x.liveCourse, 
          sessions: x.sessions
        }
      })
      // console.log('courses',courses)

      // For "Lista Cursos"
      courses.forEach(course => {
        let skillIds = new Set();
        course.skillsRef.forEach(skillRef => {
          skillIds.add(skillRef.id);
        });
        let filteredSkills = skills.filter(skillIn => skillIds.has(skillIn.id));
        // console.log("filteredSkills", filteredSkills)
        let categoryIds = new Set();
        filteredSkills.forEach(skillRef => {
          categoryIds.add(skillRef.category.id);
        });
        let filteredCategories = categories.filter(categoryIn => categoryIds.has(categoryIn.id));
        course['skills'] = filteredSkills;
        course['categories'] = filteredCategories;

        const instructorData = instructors.find( x => x.id === course.instructorRef.id)
        // console.log("instructorData", instructorData)
        if (instructorData) {
          course['instructorPhoto'] = instructorData.foto;
          course['instructorName'] = instructorData.nombre;
          course['instructorSummary'] = instructorData.resumen;
        }

      });

      this.categories.forEach(category => {
        let filteredCourses = courses.filter(course => 
          course['categories'].some(cat => cat.id === category.id)
        );
        category.expanded = false;
        category.courses = filteredCourses;
      });
      // console.log("this.categories", this.categories)
      // ---------


      // For Calendario (Observables)
      combineLatest(
        courses.map(course => 
          this.liveCourseService.getLiveCourseSonsByLiveCourseId$(course.id).pipe(
            mergeMap(coursesSons => 
              combineLatest(
                course.sessions.map(session => 
                  this.liveCourseService.getSessionSonsBySessionId$(session.id).pipe(
                    map(sessionsSons => ({
                      course,
                      session,
                      sessionsSons,
                      coursesSons
                    }))
                  )
                )
              )
            )
          )
        )
      ).pipe(
        mergeMap(results => results)
      ).subscribe((results: any[]) => {
        // console.log(`results`, results)
        let newCalendarLiveCourses: CalendarLiveCourseData[] = [];
        results.forEach(({ course, session, sessionsSons, coursesSons }) => {
          sessionsSons.forEach(sessionSon => {
            const courseSon = coursesSons.find(x => x.id === sessionSon.liveCourseSonRef.id);
            const calendarLiveCourseData: CalendarLiveCourseData = {
              baseCourseTitle: course.title,
              baseCoursePhoto: course.photoUrl,
              baseCourseId: course.id,
              courseSonId: courseSon.id,
              courseSonIdentifierText: courseSon?.identifierText,
              courseSonMeetingLink: courseSon.meetingLink,
              sessionTitle: session.title,
              sessionDuration: session.duration,
              sessionSonId: sessionSon.id,
              sessionSonDate: firestoreTimestampToNumberTimestamp(sessionSon.date),
              sessionSonVimeoId1: sessionSon.vimeoId1,
              sessionSonVimeoId2: sessionSon.vimeoId2,

            };
            newCalendarLiveCourses.push(calendarLiveCourseData);
          });
          this.calendarLiveCourses = newCalendarLiveCourses.sort((a, b) => a.sessionSonDate - b.sessionSonDate);
          console.log("calendarLiveCourses in live-course component", this.calendarLiveCourses);
        });
      });

      
    })
  }

  anidarCompetenciasInicial(categorias: any[], skills: any[]): any[] {
    return categorias.map(categoria => {
      let filteredSkills = skills.filter(x => x.category.id === categoria.id)
        .map(skill => {
          // Por cada skill, retornamos un nuevo objeto sin la propiedad category,
          // pero añadimos la propiedad categoryId con el valor de category.id
          const { category, ...rest } = skill;
          return {
            ...rest,
            categoriaId: category.id
          };
        });
  
      return {
        ...categoria,
        competencias: filteredSkills
      };
    });
  }

  getFloor(num: number): number {
    return Math.floor(num);
  }

  getUniqueCategoria(array) {
    let distinc = []
    for (let index = 0; index < array.length; index++) {
      if (!distinc.includes(array[index].categoria)) {
        distinc.push(array[index].categoria)
      }
    }
    return distinc
  }

  filteredCourses(categoryCourses) {
    //console.log('categoryCourses',categoryCourses)
    let displayedCourses = categoryCourses
    if (this.searchValue) {
      displayedCourses= categoryCourses.filter(x => x.titulo.toLocaleLowerCase().includes(this.searchValue.toLocaleLowerCase()))
      if(displayedCourses.length > 0){
        // console.log('search',displayedCourses);
        let categoriesCourse = displayedCourses[0].categories
        let categoryIds =[]
        categoriesCourse.forEach(skillRef => {
          categoryIds.push(skillRef.id); // Assuming skillRef has an id property
        });
        categoryIds.forEach(categoryId => {
          let category = this.categories.find(x => x.id == categoryId);
          category.expanded = true;
        });
       // this.categories.find(x => displayedCourses[0].categoria == x.name).expanded = true
      }
    }
    return displayedCourses
  }

  saveNewCategory() {
    this.categories.push(this.newCategory)
    this.creatingCategory=false
    this.newCategory = new category
  }

  handleImageError() {
    if (this.selectedCourse) {
      this.selectedCourse['imagen_instructor'] = 'assets/images/default/default-user-image.jpg';
    }
  }

  openModal() {
    const modalRef = this.modalService.open(DialogChooseBaseLiveCourseComponent, {
			animation: true,
			centered: true,
			size: "md",
			backdrop: "static",
			keyboard: false,
			// windowClass: 'modWidth'
		});

  }


}
