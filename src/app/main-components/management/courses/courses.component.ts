import { Component } from '@angular/core';
import { AfterOnInitResetLoading } from 'src/app/shared/decorators/loading.decorator';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { IconService } from '../../../shared/services/icon.service';
import { Curso } from 'src/app/shared/models/course.model';
import { CategoryService } from 'src/app/shared/services/category.service';

import * as competencias from '../../../../assets/data/competencias.json';
import { Category } from 'src/app/shared/models/category.model';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { SkillService } from '../../../shared/services/skill.service';
import { Skill } from '../../../shared/models/skill.model';
import { EnterpriseService } from 'src/app/shared/services/enterprise.service';
import { take } from 'rxjs';
import { CourseService } from 'src/app/shared/services/course.service';


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
export class CoursesComponent {

  constructor(
    private loaderService: LoaderService,
    public icon: IconService,
    public categoryService : CategoryService,
    public courseService : CourseService,

    public skillService: SkillService,
    private afs: AngularFirestore,
    private enterpriseService: EnterpriseService,
  ) {}

  competenciasArray: any = (competencias as any).default;

  cursos: Curso[] = []
  selectedCourse: Curso = null
  //categories: category[] = []
  tab = 0
  searchValue = ""
  creatingCategory = false
  newCategory: category = new category
  categories
  courses;
  

  async ngOnInit() {
    this.cursos = []
    this.buildCategories()
    await this.enterpriseService.whenEnterpriseLoaded()
    let enterpriseRef = this.enterpriseService.getEnterpriseRef();
    this.categoryService.getCategoriesObservable().subscribe(category => {
      console.log('category from service',category);
      this.skillService.getSkillsObservable().pipe(
        take(2)
      ).subscribe(skill => {
        console.log('skill from service', skill);
        this.categories = this.anidarCompetenciasInicial(category, skill)
        console.log('categoriasArray', this.categories)
        //this.competenciasEmpresa = this.obtenerCompetenciasAlAzar(5);
        this.courseService.getCoursesObservable().subscribe(courses => {
          console.log('courseService',courses)
          courses.forEach(curso => {
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
            console.log('curso detail',curso)
            console.log('curso modules', curso['modules'])
            let modulos = curso['modules']
            modulos.forEach(modulo => {
              //console.log('modulo',modulo)
              modulo.expanded = false;
            });

          });
          this.categories.forEach(category => {
            let filteredCourses = courses.filter(course => 
              course['categories'].some(cat => cat.id === category.id)
            );
            category.expanded = false;
            category.courses = filteredCourses;

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
        courses: this.cursos.filter(x => x.categoria == cat),
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
    console.log('categoryCourses',categoryCourses)
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

  createCategories(){
    console.log(this.competenciasArray.categorias)
    let id = Date.now()
    this.competenciasArray.categorias.forEach(async categoria => {
      id++;
      let idtext = id.toString();
      let category = new Category(idtext,categoria.name,null)
      console.log(category);
      await this.categoryService.addCategory(category);
      let CategoryRef = this.afs.collection<Category>(Category.collection).doc(idtext).ref
      console.log(CategoryRef);

      let competencias = this.competenciasArray.competencias.filter(competencia => competencia.categoriaId == categoria.id)

      competencias.forEach(async competencia => {
        id++;
        let idtext = id.toString();
        let skill = new Skill(idtext,competencia.name,CategoryRef,null)
        await this.skillService.addSkill(skill)
      });
    });

    
  }


}

