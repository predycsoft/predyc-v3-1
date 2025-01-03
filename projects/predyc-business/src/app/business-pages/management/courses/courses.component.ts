import { AfterViewInit, Component } from '@angular/core';
import { AfterOnInitResetLoading } from 'projects/predyc-business/src/shared/decorators/loading.decorator';
import { LoaderService } from 'projects/predyc-business/src/shared/services/loader.service';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { Curso } from 'projects/shared/models/course.model';
import { CategoryService } from 'projects/predyc-business/src/shared/services/category.service';

import { AngularFirestore } from '@angular/fire/compat/firestore';
import { SkillService } from 'projects/predyc-business/src/shared/services/skill.service';
import { EnterpriseService } from 'projects/predyc-business/src/shared/services/enterprise.service';
import { take, Subscription } from 'rxjs';
import { CourseService } from 'projects/predyc-business/src/shared/services/course.service';

import { cursosProximos } from 'projects/predyc-business/src/assets/data/proximamente.data'
import { AuthService } from 'projects/predyc-business/src/shared/services/auth.service';
import { InstructorsService } from 'projects/predyc-business/src/shared/services/instructors.service';
import { SubscriptionService } from 'projects/predyc-business/src/shared/services/subscription.service';
import { UserService } from 'projects/predyc-business/src/shared/services/user.service';
import { Product, Subscription as SubscriptionClass } from 'projects/shared';
import { ProductService } from 'projects/predyc-business/src/shared/services/product.service';


export class category {
  name: string = ""
  courses: any[] = []
  expanded: boolean = false
}


@AfterOnInitResetLoading
@Component({
  selector: 'app-courses',
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.css']
})
export class CoursesComponent implements AfterViewInit {

  constructor(
    private instructorsService:InstructorsService,
    private loaderService: LoaderService,
    public icon: IconService,
    public categoryService : CategoryService,
    public courseService : CourseService,

    public skillService: SkillService,
    private afs: AngularFirestore,
    private enterpriseService: EnterpriseService,
    private authService: AuthService,
    private subscriptionService: SubscriptionService,
    private userService: UserService,
    private productService: ProductService
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


  ngAfterViewInit() {
  this.handleImageError();

  }

  enterprise
  product: Product

  ngOnDestroy() {
    if (this.subscriptionObservableSubs) this.subscriptionObservableSubs.unsubscribe()
  }


  getFormattedDuration() {
    const hours = Math.floor(this.selectedCourse.duracion / 60);
    const minutes = this.selectedCourse.duracion % 60;
    return `${hours} hrs ${minutes} min`;
  }

  async ngOnInit() {

    this.authService.user$.subscribe(user=> {
      if (user) {
        console.log('user',user)
        this.user = user
        if (this.subscriptionObservableSubs) this.subscriptionObservableSubs.unsubscribe()
        this.subscriptionObservableSubs = this.subscriptionService.getUserSubscriptions$(this.userService.getUserRefById(this.user.uid)).subscribe(items => {
          const subscriptions = items.filter(x => x.status === this.subscriptionClass.STATUS_ACTIVE)
          if (subscriptions.length > 0) {
            this.subscription = subscriptions[0]
            if (this.productServiceSubscription) this.productServiceSubscription.unsubscribe()
            this.productServiceSubscription = this.productService.getProductById$(this.subscription.productRef.id).subscribe(product => {
              if (!product) return
              this.product = product
            })
          }
        })
      }
    })
    
    this.cursos = []
    this.buildCategories()
    this.enterpriseService.enterpriseLoaded$.subscribe(isLoaded => {
      if (isLoaded) {
        let enterpriseRef = this.enterpriseService.getEnterpriseRef();
        console.log(enterpriseRef)
        this.enterpriseRef = enterpriseRef
        this.enterprise = this.enterpriseService.getEnterprise();
      }
    })

    this.categoryService.getCategoriesObservable().subscribe(category => {
      console.log('category from service',category);
      this.skillService.getSkillsObservable().pipe(
        take(2)
      ).subscribe(skill => {
        this.categories = this.anidarCompetenciasInicial(category, skill);
        //this.competenciasEmpresa = this.obtenerCompetenciasAlAzar(5);
        this.courseService.getCoursesObservable().subscribe(courses => {
          console.log('courses',courses)

          if(!this.user.isSystemUser){
            courses = courses.filter(x=> (!x.enterpriseRef && !x.proximamente || x.enterpriseRef))
          }

          courses.forEach(curso => {
            //curso.foto = '../../../../assets/images/cursos/placeholder1.jpg'
            let skillIds = new Set();
            curso.skillsRef.forEach(skillRef => {
              skillIds.add(skillRef.id); // Assuming skillRef has an id property
            });
            let filteredSkills = skill.filter(skillIn => skillIds.has(skillIn.id));
            let categoryIds = new Set();
            filteredSkills.forEach(skillRef => {
              categoryIds.add(skillRef.category.id); // Assuming skillRef has an id property
            });
            let filteredCategories = category.filter(categoryIn => categoryIds.has(categoryIn.id));
            curso['skills'] = filteredSkills;
            curso['categories'] = filteredCategories;

            curso['modules'].sort((a, b) => a.numero - b.numero);


            let modulos = curso['modules']

            let duracionCourse = 0;
            modulos.forEach(modulo => {
              //console.log('modulo',modulo)
              //modulo.clases.sort((a, b) => b.date - a.date);

              modulo.expanded = false;
              let duracion = 0;
              modulo.clases.forEach(clase => {
                duracion+=clase?.duracion? clase?.duracion : 0 
              });
              modulo.duracion = duracion
              duracionCourse+=duracion
            });
            curso['duracion'] = duracionCourse;

          });
          this.categories.forEach(category => {
            let filteredCourses = courses.filter(course => 
              course['categories'].some(cat => cat.id === category.id)
            );
            let filteredCoursesPropios = courses.filter(course => 
              course['categories'].some(cat => cat.id === category.id) && course.enterpriseRef!=null
            );
            let filteredCoursesPredyc = courses.filter(course => 
              course['categories'].some(cat => cat.id === category.id) && course.enterpriseRef==null
            );
            category.expanded = false;
            category.expandedPropios = false;
            category.expandedPredyc = false;

            category.courses = filteredCourses;
            category.coursesPropios = filteredCoursesPropios;
            category.coursesPredyc = filteredCoursesPredyc;
          });

          // let proximos = this.categories.find(x=> x.name == 'Proximamente')
          // if(proximos){
          //   proximos.coursesPredyc = cursosProximos
          //   proximos.courses = cursosProximos
          // }
        })
      });
    })
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

  getRounded(num: number): number {
    return Math.round(num);
  }

  getFloor(num: number): number {
    return Math.floor(num);
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

  handleImageError() {
    if (this.selectedCourse) {
      this.selectedCourse['imagen_instructor'] = 'assets/images/default/default-user-image.jpg';
    }
  }

}

