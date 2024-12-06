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
import Swal from "sweetalert2";
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { AlertsService } from '../../services/alerts.service';


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
    private storage: AngularFireStorage,
    private alertService: AlertsService
  ) {}

  subscriptionClass = SubscriptionClass

  cursos: Curso[] = []
  selectedCourse: Curso = null
  //categories: category[] = []
  tab = 0
  tabP21 = 0
  searchValue = ""
  creatingCategory = false
  newCategory: category = new category
  categories

  categoriesPredyc;
  categoriesPropios;
  courses;
  categoriesDiplomado
  diplomados;
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
  async ngOnInit() {

    this.authService.user$.subscribe(user=> {
      if (user) {
        console.log('user',user)
        this.user = user
      }
    })

    this.buildCategories()


    let p21Settings = await this.courseService.fetchLatestSettingsP21()

    if(p21Settings){
      this.previewImageBanner = p21Settings?.bannerDesktop ? p21Settings?.bannerDesktop : null
      this.previewImageBannerMovil = p21Settings?.bannerMovil ?  p21Settings?.bannerMovil : null
      this.showBanner= p21Settings?.bannerShow ? p21Settings?.bannerShow : null
      this.enlaceBanner= p21Settings?.bannerUrl ?  p21Settings?.bannerUrl : null
    }

    console.log('p21Settings',p21Settings)

    combineLatest([
      this.categoryService.getCategoriesObservable().pipe(take(2)),
      this.skillService.getSkillsObservable().pipe(take(2)),
      this.courseService.getCoursesObservableP21().pipe(take(2)),
      this.instructorsService.getInstructorsObservable().pipe(take(2)),
      this.courseService.getDiplomadoObservableP21().pipe(take(2))
    ]).subscribe(([categories, skills, courses,instructors,diplomados]) => {
      console.log('categories from service', categories);
      console.log('skills from service', skills);
      console.log('courses from service', courses);
      console.log('instructors from service', instructors);
      console.log('diplomados from service', diplomados);
    
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

        curso['instructorData'] = instructors.find(x=>x.id == curso.instructorRef.id)
      });

      diplomados.forEach(curso => {
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
        curso.modules.forEach(modulo => {
          modulo.expanded = false;
        });
        curso['modules'].sort((a, b) => a.numero - b.numero);    
      });


      this.courses = courses;
      this.diplomados = diplomados;
    
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


        let filteredDiplomados = diplomados.filter(course =>
          course['categories'].some(cat => cat.id === category.id)
        );
        let filteredDiplomadosPropios = diplomados.filter(course =>
          course['categories'].some(cat => cat.id === category.id) && course.enterpriseRef != null
        );
        let filteredDiplomadosPredyc = diplomados.filter(course =>
          course['categories'].some(cat => cat.id === category.id) && course.enterpriseRef == null
        );
        
        category.expanded = false;
        category.expandedPropios = false;
        category.expandedPredyc = false;
    
        category.courses = filteredCourses;
        category.coursesPropios = filteredCoursesPropios;
        category.coursesPredyc = filteredCoursesPredyc;

        category.diplomados = filteredDiplomados;
        category.diplomadosPropios = filteredDiplomadosPropios;
        category.diplomadosPredyc = filteredDiplomadosPredyc;
      });
    });

    const categoriesDiplomado = this.categories

    categoriesDiplomado.coursesPredyc = this.categories.diplomadosPredyc



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


  downloadP21Diplomado(){
    this.pdfService.downloadP21Diplomado(this.selectedCourse)
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


  async downloadPDFCalendario(): Promise<void> {
    this.showNotification = true;
    this.notificationMessage = "Descargado archivo... Por favor, espera.";

    const courses = await this.courseService.fetchCoursesCalendar()
    const diplomados = await this.courseService.fetchDiplomadosCalendar()

    console.log(courses,diplomados)

    courses.forEach(obj => {
      obj.typeLocal='curso'
      delete obj.skillsRef
      delete obj.instructorRef
      delete obj?.instructorData?.ultimaEdicion
      delete obj?.instructorData?.fechaCreacion
      delete obj?.instructorData?.userRef
  
  
    });
  
  
  
    diplomados.forEach(obj => {
      obj.typeLocal='diplomado'
      delete obj.skillsRef
      delete obj.modulos
    });
  
    // console.log('diplomados',diplomados)
  
  
    const calendario = courses.concat(diplomados);
  
    // console.log(calendario)
  
   // Obtener fecha actual
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Función auxiliar para manejar fechas literales
    function parseDateLiteral(dateString: string): Date {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day); // El mes es 0-indexado en JavaScript
    }

    // Filtrar y ordenar los cursos
    const filteredCourses = calendario
      .filter((course) => {
        const courseDate = parseDateLiteral(course.fechaInicio); // Usar la función auxiliar
        const courseYear = courseDate.getFullYear();
        const courseMonth = courseDate.getMonth();

        return (
          courseYear > currentYear ||
          (courseYear === currentYear && courseMonth >= currentMonth)
        );
      })
      .sort((a, b) => parseDateLiteral(a.fechaInicio).getTime() - parseDateLiteral(b.fechaInicio).getTime());

    // Agrupar cursos por mes
    const groupedByMonth = filteredCourses.reduce((acc, course) => {
      const courseDate = parseDateLiteral(course.fechaInicio); // Usar la función auxiliar
      const year = courseDate.getFullYear();
      const month = new Intl.DateTimeFormat("es-ES", { month: "long" }).format(courseDate);
      const key = `${month} ${year}`;

      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(course);
      return acc;
    }, {});
  
    console.log(groupedByMonth)

    // Mostrar el Swal para seleccionar el año
    const years = Object.keys(groupedByMonth)
      .map((key) => key.split(' ')[1]) // Extraer los años de las claves
      .filter((year, index, self) => self.indexOf(year) === index); // Eliminar duplicados
    
    const { value: selectedYear } = await Swal.fire({
      title: 'Selecciona un año',
      input: 'select',
      inputOptions: years.reduce((acc, year) => {
        acc[year] = year; // Construir opciones para el select
        return acc;
      }, {}),
      inputPlaceholder: 'Seleccione un año',
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
    });
    
    if (selectedYear) {
      // Filtrar las claves del objeto que no sean del año seleccionado
      const filteredCursosPDF = Object.keys(groupedByMonth)
        .filter((key) => key.includes(selectedYear)) // Mantener solo las claves del año seleccionado
        .reduce((obj, key) => {
          obj[key] = groupedByMonth[key]; // Reconstruir el objeto con las claves filtradas
          return obj;
        }, {});
    
      // Procesar los datos filtrados con el try
      try {
        let cursosPDF = filteredCursosPDF;

        console.log('cursosPDF',cursosPDF)

        cursosPDF = Object.keys(cursosPDF).map(key => ({
          titulo: key,
          clases: cursosPDF[key]
      }));

        await this.pdfService.downloadCalendarioP21(cursosPDF,selectedYear, 'Calendario cursos', false);
      } catch (error) {
        console.error(error);
      } finally {
        this.showNotification = false;
      }
    } else {
      console.log('No se seleccionó un año'); // Cancelación o cierre del Swal
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

  previewImageBanner
  previewImageBannerMovil
  selectedFile: File | null = null;
  selectedFileMovil: File | null = null;
  enlaceBanner
  showBanner = false

  setImageBanner(event: any,tipo): void {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const image = new Image();
        image.src = reader.result as string;
        image.onload = () => {
          const width = image.width;
          const height = image.height;

          const aspectRatio = width / height;
          let ratioRestriction = 1920 / 1080 //1.7778
          if(tipo == 'movil'){
            ratioRestriction = 1024 / 768 //1.7778
          }
          const tolerance = 0.01
          console.log("aspectRatio", aspectRatio)
          console.log("ratioRestriction", ratioRestriction)
          if (Math.abs(aspectRatio - ratioRestriction) > tolerance) {
            Swal.fire({
              title: "Error!",
              text: `La imagen debe tener una proporción aproximada de ${tipo == 'movil'?'4:3':'16:9'}`,
              icon: "warning",
              confirmButtonColor: "var(--blue-5)",
            });
            return;
          }

          if(tipo !='movil'){
            this.selectedFile = file;
            this.previewImageBanner = reader.result as string;


          }
          else{
            this.selectedFileMovil = file;
            this.previewImageBannerMovil = reader.result as string;


          }
  
        };
      };
    }
  }

  async uploadImage(file = this.selectedFile): Promise<string> {
    if (!file) {
      throw new Error('No file selected');
    }

    let fileBaseName = file.name.split('.').slice(0, -1).join('.');
    let fileExtension = file.name.split('.').pop();
    let endName = `${fileBaseName}-${Date.now().toString()}.${fileExtension}`;
    const filePath = `SettingsP21/${endName}`;
    const fileRef = this.storage.ref(filePath);
    const task = this.storage.upload(filePath, file);

    try {
      await task;
      return await fileRef.getDownloadURL().toPromise();
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  }

  async saveSettingsP21(){
    
    let UrlBannerD
    let UrlBannerM

    if(this.selectedFile){
      UrlBannerD = await this.uploadImage(this.selectedFile);
    }
    if(this.selectedFileMovil){
      UrlBannerM = await this.uploadImage(this.selectedFileMovil);
    }

    if(this.previewImageBanner && !this.selectedFile){
      UrlBannerD = this.previewImageBanner
    }

    if(this.previewImageBannerMovil && !this.selectedFileMovil){
      UrlBannerM = this.previewImageBannerMovil
    }


    let objSettings = {
      bannerDesktop : UrlBannerD?UrlBannerD:null,
      bannerMovil : UrlBannerM?UrlBannerM:null,
      bannerShow : this.showBanner?this.showBanner:null,
      bannerUrl: this.enlaceBanner?this.enlaceBanner:null,
      fechaCreacion:new Date()
    }
    



    console.log(objSettings)

    Swal.fire({
      title: "Generando ajustes...",
      text: "Por favor, espera.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const result = await this.courseService.saveSettingsP21(objSettings)

    if(result){
      this.alertService.succesAlert("Los ajustes se han guardado exitosamente");
    }


  }



  

}

