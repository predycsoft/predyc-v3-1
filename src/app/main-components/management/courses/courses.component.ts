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
    public SkillService: SkillService,
    private afs: AngularFirestore,
    private enterpriseService: EnterpriseService,
  ) {}

  competenciasArray: any = (competencias as any).default;

  cursos: Curso[] = []
  selectedCourse: Curso = null
  categories: category[] = []
  tab = 0
  searchValue = ""
  creatingCategory = false
  newCategory: category = new category

  async ngOnInit() {
    this.cursos = []
    this.buildCategories()
    await this.enterpriseService.whenEnterpriseLoaded()
    let enterpriseRef = this.enterpriseService.getEnterpriseRef();
    console.log(enterpriseRef)

    this.categoryService.getCategoriesObservable().subscribe(category => {
      console.log(category);
    })
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
    let displayedCourses = categoryCourses
    if (this.searchValue) {
      displayedCourses= categoryCourses.filter(x => x.titulo.toLocaleLowerCase().includes(this.searchValue.toLocaleLowerCase()))
      if(displayedCourses.length > 0){
        this.categories.find(x => displayedCourses[0].categoria == x.name).expanded = true
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
        await this.SkillService.addSkill(skill)
      });
    });

    
  }

}

