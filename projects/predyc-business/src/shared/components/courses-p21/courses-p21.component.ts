import { AfterViewInit, Component } from '@angular/core';
import { AfterOnInitResetLoading } from 'projects/predyc-business/src/shared/decorators/loading.decorator';
import { LoaderService } from 'projects/predyc-business/src/shared/services/loader.service';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { Curso } from 'projects/shared/models/course.model';
import { CategoryService } from 'projects/predyc-business/src/shared/services/category.service';

import { AngularFirestore } from '@angular/fire/compat/firestore';
import { SkillService } from 'projects/predyc-business/src/shared/services/skill.service';
import { EnterpriseService } from 'projects/predyc-business/src/shared/services/enterprise.service';
import { take, Subscription, Observable, combineLatest } from 'rxjs';
import { CourseService } from 'projects/predyc-business/src/shared/services/course.service';

import { cursosProximos } from 'projects/predyc-business/src/assets/data/proximamente.data'
import { AuthService } from 'projects/predyc-business/src/shared/services/auth.service';
import { InstructorsService } from 'projects/predyc-business/src/shared/services/instructors.service';
import { SubscriptionService } from 'projects/predyc-business/src/shared/services/subscription.service';
import { UserService } from 'projects/predyc-business/src/shared/services/user.service';
import { License, Product, Subscription as SubscriptionClass } from 'projects/shared';
import { ProductService } from 'projects/predyc-business/src/shared/services/product.service';
import { LicenseService } from 'projects/predyc-business/src/shared/services/license.service';
import { PDFService } from '../../services/pdf.service';


export class category {
  name: string = ""
  courses: any[] = []
  expanded: boolean = false
}

@Component({
  selector: 'app-courses-p21',
  templateUrl: './courses-p21.component.html',
  styleUrls: ['./courses-p21.component.css']
})
export class CoursesP21Component {

  constructor(
    public icon: IconService,
    public categoryService : CategoryService,
    public courseService : CourseService,
    public skillService: SkillService,
    private authService: AuthService,
    public licenseService: LicenseService,
    private pdfService:PDFService,
    private instructorsService:InstructorsService,

  ) {}

  subscriptionClass = SubscriptionClass

  cursos: Curso[] = []
  selectedCourse: Curso = null
  //categories: category[] = []
  tab = 0
  searchValue = ""
  creatingCategory = false
  newCategory: category = new category
  categories

  categoriesPredyc;
  categoriesPropios;
  courses;
  user;
  enterpriseRef
  subscription: SubscriptionClass

  subscriptionObservableSubs: Subscription
  productServiceSubscription: Subscription

  enterprise
  product: Product


  getFormattedDuration() {
    const hours = Math.floor(this.selectedCourse.duracion / 60);
    const minutes = this.selectedCourse.duracion % 60;
    return `${hours} hrs ${minutes} min`;
  }
  ngOnInit() {

    this.authService.user$.subscribe(user=> {
      if (user) {
        console.log('user',user)
        this.user = user
      }
    })

    this.buildCategories()

    combineLatest([
      this.categoryService.getCategoriesObservable().pipe(take(2)),
      this.skillService.getSkillsObservable().pipe(take(2)),
      this.courseService.getCoursesObservableP21().pipe(take(2)),
      this.instructorsService.getInstructorsObservable().pipe(take(2)),
    ]).subscribe(([categories, skills, courses,instructors]) => {
      console.log('categories from service', categories);
      console.log('skills from service', skills);
      console.log('courses from service', courses);
      console.log('instructors from service', instructors);

    
      this.categories = this.anidarCompetenciasInicial(categories, skills);
    
      if (!this.user.isSystemUser) {
        courses = courses.filter(x => (!x.enterpriseRef && !x.proximamente || x.enterpriseRef));
      }
    
      courses.forEach(curso => {
        let skillIds = new Set();
        curso.skillsRef.forEach(skillRef => {
          skillIds.add(skillRef.id); // Assuming skillRef has an id property
        });
        let filteredSkills = skills.filter(skillIn => skillIds.has(skillIn.id));
        let categoryIds = new Set();
        filteredSkills.forEach(skillRef => {
          categoryIds.add(skillRef.category.id); // Assuming skillRef has an id property
        });
        let filteredCategories = categories.filter(categoryIn => categoryIds.has(categoryIn.id));
        curso['skills'] = filteredSkills;
        curso['categories'] = filteredCategories;
        curso.modules = curso['modulos']
        curso['modules'].sort((a, b) => a.numero - b.numero);
    
        let modulos = curso['modules'];
        let duracionCourse = 0;
        modulos.forEach(modulo => {
          modulo.expanded = false;
          let duracion = 0;
          modulo.clases.forEach(clase => {
            duracion += clase?.duracion ? clase?.duracion : 0;
          });
          modulo.duracion = duracion;
          duracionCourse += duracion;
        });
        if (!curso['duracion']) {
          curso['duracion'] = duracionCourse;
        }

        // if(curso.duracion>=duracionCourse){
        //   if(!curso['modules'].find(x=>x.titulo == 'Examen Final'))
        //   curso['modules'].push({dontshow:true, titulo:'Examen Final',clases:[{titulo:'Examen Final',duracion:curso.duracion-duracionCourse}]})
        // }
        // else{
        //   if(!curso['modules'].find(x=>x.titulo == 'Examen Final'))
        //   curso['modules'].push({dontshow:true, titulo:'Examen Final',clases:[{titulo:'Examen Final',duracion:null}]})
        // }
        curso['instructorData'] = instructors.find(x=>x.id == curso.instructorRef.id)
      });
      this.courses = courses;
    
      this.categories.forEach(category => {
        let filteredCourses = courses.filter(course =>
          course['categories'].some(cat => cat.id === category.id)
        );
        let filteredCoursesPropios = courses.filter(course =>
          course['categories'].some(cat => cat.id === category.id) && course.enterpriseRef != null
        );
        let filteredCoursesPredyc = courses.filter(course =>
          course['categories'].some(cat => cat.id === category.id) && course.enterpriseRef == null
        );
        category.expanded = false;
        category.expandedPropios = false;
        category.expandedPredyc = false;
    
        category.courses = filteredCourses;
        category.coursesPropios = filteredCoursesPropios;
        category.coursesPredyc = filteredCoursesPredyc;
      });
    });



  }

  anidarCompetenciasInicial(categorias: any[], competencias: any[]): any[] {
    return categorias.map(categoria => {
      let skills = competencias
        .filter(comp => comp.category.id === categoria.id)
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
        competencias: skills
      };
    });
  }


  downloadPDFCourse(){
    console.log(this.selectedCourse)
    this.pdfService.downloadFichaTecnica(this.selectedCourse,this.selectedCourse['instructorData'],null,null,false)
  }

  showNotification: boolean = false;
  notificationMessage: string = '';


  async downloadPDFAllCourse(): Promise<void> {
    this.showNotification = true;
    this.notificationMessage = "Descargado archivo... Por favor, espera.";
    try {
      let cursosPDF = this.courses.filter(x=>!x.proximamente)
      await this.pdfService.downloadFichaTecnicaMultiple(cursosPDF, 'Catálogo cursos', false,false);
    } catch (error) {
      console.error(error);
    } finally {
      this.showNotification = false;
    }
  }

  getRounded(num: number): number {
    return Math.round(num);
  }

  getFloor(num: number): number {
    return Math.floor(num);
  }

  handleImageError() {
    if (this.selectedCourse) {
      this.selectedCourse['imagen_instructor'] = 'assets/images/default/default-user-image.jpg';
    }
  }

  filteredCourses(categoryCourses) {
    //console.log('categoryCourses',categoryCourses)
    let displayedCourses = categoryCourses
    if (this.searchValue) {
      displayedCourses= categoryCourses.filter(x => x.titulo.toLocaleLowerCase().includes(this.searchValue.toLocaleLowerCase()))
      if(displayedCourses.length > 0){
        console.log('search',displayedCourses);
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
  

  buildCategories(){
    let categories: category[] = []
    let categoriasStrings = this.getUniqueCategoria(this.cursos)
    categoriasStrings.forEach(cat => {
      let category: category = {
        name: cat,
        courses: this.cursos.filter(x => x['categoria'] == cat),
        expanded: false
      }
      categories.push(category)
    })
    this.categories = categories
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



  

}
