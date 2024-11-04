import { Component, Input, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryService } from 'projects/predyc-business/src/shared/services/category.service';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { CategoryJson } from 'projects/shared/models/category.model';
import { combineLatest, map, Observable, of, Subscription, switchMap, take } from 'rxjs';
import { DialogPillarsFormComponent } from '../dialog-pillars-form/dialog-pillars-form.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EnterpriseService } from 'projects/predyc-business/src/shared/services/enterprise.service';
import Swal from 'sweetalert2';
import { CourseService } from 'projects/predyc-business/src/shared/services/course.service';
import { SkillService } from 'projects/predyc-business/src/shared/services/skill.service';
import { Skill } from 'projects/shared/models/skill.model';
import { DocumentReference } from '@angular/fire/compat/firestore';

interface CategoryWithSkills extends CategoryJson {
  skills: {
    categoryId: string;
    enterprise: DocumentReference | null;
    id: string;
    name: string;
  }[];
}

export interface CategoryInList extends CategoryWithSkills {
  coursesQty: number
  enterpriseName: string
}


@Component({
  selector: 'app-pillars-list',
  templateUrl: './pillars-list.component.html',
  styleUrls: ['./pillars-list.component.css']
})
export class PillarsListComponent {
  constructor(
    private activatedRoute: ActivatedRoute,
    private categoriesService: CategoryService,
    private enterpriseService: EnterpriseService,
    public skillService: SkillService,
    private courseService: CourseService,
    public icon: IconService,
    private router: Router,
		private modalService: NgbModal,
  ){}

  displayedColumns: string[] = [
    "name",
    "coursesQty",
    "enterprise",
    "actions",
  ];

  dataSource = new MatTableDataSource<CategoryInList>();

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @Input() enableNavigateToUser: boolean = true

  pageSize: number = 16
  totalLength: number
  
  queryParamsSubscription: Subscription

  categoriesSubscription: Subscription

  ngOnInit() {
    this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe(params => {
      const page = Number(params['page']) || 1;
      // const searchTerm = params['search'] || '';
      this.performSearch(page);
    })
  }


  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.paginator.pageSize = this.pageSize;
  }

  performSearch(page: number) {
    this.categoriesSubscription = combineLatest([
      this.categoriesService.getAllCategories$(),
      this.skillService.getSkillsObservable(),
      this.courseService.getCoursesObservable(),
    ])
    .pipe(
      switchMap(([categories, skills, courses]) => {
        if (categories.length === 0)  return of([]);
  
        const categoriesWithSkills = this.getCategoriesWithSkills(categories, skills);
  
        const categoriesInList$: Observable<CategoryInList>[] = categoriesWithSkills.map(category => {
          const coursesQty = courses.filter(course => 
            course.skillsRef.some(skillRef => 
              category.skills.some(skill => skill.id === skillRef.id)
            )
          ).length;
  
          return category.enterprise ? this.enterpriseService.getEnterpriseById$(category.enterprise.id).pipe(
              map(enterprise => ({ 
                ...category, 
                enterpriseName: enterprise?.name, 
                coursesQty: coursesQty 
              }))
            ) : 
            of({ 
              ...category, 
              enterpriseName: 'Sin empresa', 
              coursesQty: coursesQty 
            });
        });
        return combineLatest(categoriesInList$);
      }),
      take(2),
    ).subscribe(categoryInList => {
      console.log("categoryInList", categoryInList)
      this.paginator.pageIndex = page - 1;
      this.dataSource.data = categoryInList;
      this.totalLength = categoryInList.length;
    });
  }
  
  
  getCategoriesWithSkills(categorias: CategoryJson[], competencias: Skill[]): CategoryWithSkills[] {
    return categorias.map(categoria => {
      let skills = competencias
        .filter(comp => comp.category.id === categoria.id)
        .map(skill => {
          // Por cada skill, retornamos un nuevo objeto sin la propiedad category,
          // pero añadimos la propiedad categoryId con el valor de category.id
          const { category, ...rest } = skill;
          return {
            ...rest,
            categoryId: category.id
          };
        });
  
      return {
        ...categoria,
        skills
      };
    });
  }

  onPageChange(page: number): void {
    this.router.navigate([], {
      queryParams: { page },
      queryParamsHandling: 'merge'
    });
  }

  openEditPillarModal(pillar: CategoryJson) {
    const modalRef = this.modalService.open(DialogPillarsFormComponent, {
      ariaLabelledBy: 'modal-basic-title',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.pillar = pillar;

  }

  async deletePillar(pillar: CategoryInList) {
    if (pillar.coursesQty > 0) {
      Swal.fire({
        text: `No se puede eliminar el pilar ya que tiene cursos asociados.`,
        icon: "info",
        confirmButtonColor: "var(--blue-5)",
      });
    }
    else {
      Swal.fire({
        title: `Se eliminará el pilar ${pillar.name}`,
        text: "¿Deseas continuar?",
        icon: "info",
        showCancelButton: true,
        confirmButtonText: "Guardar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: 'var(--blue-5)',
      }).then(async (result) => {
        if (result.isConfirmed) {
          Swal.fire({
            title: "Eliminando pilar...",
            text: "Por favor, espera.",
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            },
          });
          await this.categoriesService.deleteCategoryById(pillar.id)
          Swal.close();
        } else {
        }
      });
    }
    
  }

}
