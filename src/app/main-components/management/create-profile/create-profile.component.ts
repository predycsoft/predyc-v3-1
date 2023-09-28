import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs';
import { Curso } from 'src/app/shared/models/course.model';
import { CategoryService } from 'src/app/shared/services/category.service';
import { CourseService } from 'src/app/shared/services/course.service';
import { DepartmentService } from 'src/app/shared/services/department.service';
import { IconService } from 'src/app/shared/services/icon.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { SkillService } from 'src/app/shared/services/skill.service';

interface Competencia {
  id: number;
  name: string;
  selected: boolean;
  categoriaId: number;
}

@Component({
  selector: 'app-create-profile',
  templateUrl: './create-profile.component.html',
  styleUrls: ['./create-profile.component.css']
})
export class CreateProfileComponent {


  constructor(
    public icon: IconService,
    private afs: AngularFirestore,
    private loaderService: LoaderService,
    private departmentService: DepartmentService,
    private router: Router,
    private route: ActivatedRoute,
    public categoryService : CategoryService,
    public skillService: SkillService,
    public courseService : CourseService,

  ){}

  departments
  department;
  departmentId = this.route.snapshot.paramMap.get("id")
  activeStep = 1
  showErrorProfile = false;
  formNewProfile: FormGroup;
  skillsObservable
  categoriasArray
  competenciasEmpresa
  competenciasSelected;
  categories
  categoriesPredyc;
  categoriesPropios;
  searchValue = ""
  selectedCourse: Curso = null

  steps = [
    'Información del perfil',
    'Competencias del perfil',
    'Plan de estudios',
    'Examen',
    'Resumen'
  ];


  async ngOnInit() {

    this.departmentService.loadDepartmens()
    this.departmentService.getDepartmentsObservable().subscribe(departments => {
      this.departments = departments
      console.log('profileId',this.departmentId);
      this.department = departments.find(department =>department.id == this.departmentId )
      console.log('this.department',this.department);

      this.inicialiceFormNewProfile();
    })

    this.categoryService.getCategoriesObservable().subscribe(category => {
      console.log('category from service',category);
      this.skillService.getSkillsObservable().pipe(
        take(2)
      ).subscribe(skill => {
        console.log('skill from service', skill);
        this.categoriasArray = this.anidarCompetenciasInicial(category, skill);
        this.categories = this.categoriasArray;
        console.log('categoriasArray', this.categoriasArray)
        this.competenciasEmpresa = this.obtenerCompetenciasAlAzar(5);

        this.courseService.getCoursesObservable().subscribe(courses => {
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
            let modulos = curso['modules']
            let duracionCourse = 0;
            modulos.forEach(modulo => {
              console.log('modulo',modulo)
              modulo.expanded = false;
              let duracion = 0;
              modulo.clases.forEach(clase => {
                duracion+=clase.duracion
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
          console.log('this.categories',this.categories)
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

  obtenerCompetenciasAlAzar(n: number): Competencia[] {
    // Aplanamos la estructura para obtener todas las competencias en un solo arreglo
    const todasLasCompetencias = this.categoriasArray.flatMap(categoria => categoria.competencias);
  
    // Barajamos (shuffle) el arreglo
    for (let i = todasLasCompetencias.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [todasLasCompetencias[i], todasLasCompetencias[j]] = [todasLasCompetencias[j], todasLasCompetencias[i]]; // Intercambio
    }
  
    // Tomamos las primeras 'n' competencias del arreglo barajado
    return todasLasCompetencias.slice(0, n);
  }

  returnCursos(){

  }

  finishProfile(){

  }

  advanceTab(){

    let valid = true
    console.log('tab actividad',this.activeStep);

    if(this.activeStep == 1){
    }
    if(this.activeStep == 2){
    }
    if(this.activeStep == 3){
    }
    if(this.activeStep == 4){
    }
    if(this.activeStep == 5){
    }

    valid = true; // comentar luego de probar
    if(valid){
      this.activeStep = this.activeStep+1
    }
    else{
      this.showErrorProfile = true;
    }

  }

  inicialiceFormNewProfile () {

    this.formNewProfile = new FormGroup({
      id: new FormControl(Date.now().toString(), Validators.required),
      name: new FormControl(null, Validators.required),
      descripcion: new FormControl(null, Validators.required),
      responsabilities: new FormControl(null, Validators.required),
    })
  }





}
