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


@AfterOnInitResetLoading
@Component({
  selector: 'app-courses-p21',
  templateUrl: './courses-p21.component.html',
  styleUrls: ['./courses-p21.component.css']
})
export class CoursesP21Component {

  constructor(
    private instructorsService:InstructorsService,
    public icon: IconService,
    public categoryService : CategoryService,
    public courseService : CourseService,
    public skillService: SkillService,
    private enterpriseService: EnterpriseService,
    private authService: AuthService,
    private productService: ProductService,
    public licenseService: LicenseService,
    private pdfService:PDFService

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

  ngOnDestroy() {
    if (this.subscriptionObservableSubs) this.subscriptionObservableSubs.unsubscribe()
  }

  getFormattedDuration() {
    const hours = Math.floor(this.selectedCourse.duracion / 60);
    const minutes = this.selectedCourse.duracion % 60;
    return `${hours} hrs ${minutes} min`;
  }

  licenses$: Observable<License[]> = this.licenseService.getCurrentEnterpriseLicenses$()
  licenses: License[];
  licensesSubscription: Subscription;

  async ngOnInit() {
    alert('aqui')


  }

  

}

