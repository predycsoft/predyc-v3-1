import { Component } from '@angular/core';
import { Subscription, Observable, take, combineLatest } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { CategoryService } from '../../../services/category.service';
import { CourseService } from '../../../services/course.service';
import { EnterpriseService } from '../../../services/enterprise.service';
import { IconService } from '../../../services/icon.service';
import { LicenseService } from '../../../services/license.service';
import { ProductService } from '../../../services/product.service';
import { SkillService } from '../../../services/skill.service';
import { Curso, Enterprise, License, Product, Subscription as SubscriptionClass } from 'projects/shared';
import { LiveCourseService } from '../../../services/live-course.service';
import { InstructorsService } from '../../../services/instructors.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DialogChooseBaseLiveCourseComponent } from '../dialog-choose-base-live-course/dialog-choose-base-live-course.component';

export class category {
  name: string = ""
  courses: any[] = []
  expanded: boolean = false
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

    combineLatest([
      this.categoryService.getCategoriesObservable(), 
      this.skillService.getSkills$(), 
      this.liveCourseService.getAllLiveCoursesWithSessions$(),
      this.instructorService.getInstructors$()
    ]).subscribe(([categories, skills, coursesData, instructors]) => {
      this.categories = this.anidarCompetenciasInicial(categories, skills);

      let courses = coursesData.map(x => {
        return { 
          ...x.liveCourse, 
          sessions: x.sessions
        }
      })
      console.log('courses',courses)

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

  // test data
  // async createTestSessions() {
  //   function getRandomElements<T>(array: T[], numElements: number = 1): T[] {
  //     const shuffled = array.slice(); // Create a copy of the array
  //     for (let i = array.length - 1; i > 0; i--) {
  //       const j = Math.floor(Math.random() * (i + 1));
  //       [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  //     }
  //     return shuffled.slice(0, numElements);
  //   }

  //   console.log("started")

  //   const liveCoursesData: LiveCourseJson[] = [
  //     {
  //       id: null, companyName: "Pepsi", title: "Mantenimiento en bebidas", 
  //       photoUrl: "https://firebasestorage.googleapis.com/v0/b/predyc-learning.appspot.com/o/Cursos%2FAdministraci%C3%B3n-del-mantenimiento%2FadminMantenimiento.webp?alt=media&token=57ee864b-476b-4e7b-86fa-c1954b17f653", 
  //       meetingLink: null, description: "Importancia del mantenimiento", instructorRef: null, skillsRef: null, duration: 0, vimeoFolderId:"", proximamente: false
  //     },
  //     {
  //       id: null, companyName: "Nike", title: "Fabricacion de zapatos", 
  //       photoUrl: "https://firebasestorage.googleapis.com/v0/b/predyc-learning.appspot.com/o/Cursos%2FConstrucci%C3%B3n-de-Estrategias-para-Optimizar-una-Gerencia-de-Mantenimiento%2FCurso-Predyc-Construcci%C3%B3n%20de%20Estrategias%20para%20Optimizar%20una%20Gerencia%20de%20Mantenimiento.webp?alt=media&token=fdc54e7b-61ed-4b57-aa62-7c37d3ffc7cd", 
  //       meetingLink: null, description: "Como fabricar zapatos", instructorRef: null, skillsRef: null, duration: 0, vimeoFolderId:"", proximamente: false
  //     },
  //   ]

  //   combineLatest([this.skillService.getSkills$(), this.instructorService.getInstructors$()]).pipe(
  //     take(1)
  //   ).subscribe(async ([skills, instructors]) => {
  //     if (skills.length > 0 && instructors.length > 0) {
  //       const skillRefs = skills.map( skill => {return this.skillService.getSkillRefById(skill.id)} ) 
  //       const instructorsRefs = instructors.map( instructor => {return this.instructorService.getInstructorRefById(instructor.id)} ) 
  //       // live couse 
  //       for (let liveCourseData of liveCoursesData) {
  //         let liveCourse = LiveCourse.fromJson(liveCourseData)
  //         liveCourse.skillsRef = getRandomElements(skillRefs, 3); liveCourse.instructorRef = instructorsRefs[0]
  //         const liveCourseRef = this.afs.collection<LiveCourse>(LiveCourse.collection).doc().ref;
  //         await liveCourseRef.set({...liveCourse.toJson(), id: liveCourseRef.id}, { merge: true });
  //         liveCourse.id = liveCourseRef.id;
  //         // Live course session
  //         let sessions =[ 
  //           new Session("", "Primera sesion de prueba", new Date(1716879999999), "Descripcion de la 1erasesion de prueba", liveCourseRef, 5, null, null, []),
  //           new Session("", "Segunda sesion de prueba", new Date(1716990000000), "Descripcion de la 2da sesion de prueba", liveCourseRef, 8, null, null, []),
  //         ]
          
  //         for (let session of sessions) {
  //           const sessionRef = this.afs.collection<Session>(Session.collection).doc().ref;
  //           await sessionRef.set({...session.toJson(), id: sessionRef.id}, { merge: true });
  //           session.id = sessionRef.id;
  //         }
  //       };
    
  //       // live course by student doc
  //       // const querySnapshot = await this.afs.collection(User.collection).ref.where("email", "==", "aleja.c@test.com").get();
  //       // let userRef = null
  //       // if (!querySnapshot.empty) userRef = querySnapshot.docs[0].ref
  //       // let liveCourseByStudent = new LiveCourseByStudent("", false, userRef, liveCourseRef)
  //       // const liveCourseByStudentRef = this.afs.collection<LiveCourseByStudent>(LiveCourseByStudent.collection).doc().ref;
  //       // await liveCourseByStudentRef.set({...liveCourseByStudent.toJson(), id: liveCourseByStudentRef.id}, { merge: true });
  //       // liveCourseByStudent.id = liveCourseByStudentRef.id;
    
  //       console.log("Finished")
  //     }
  //   })



  // }


}
