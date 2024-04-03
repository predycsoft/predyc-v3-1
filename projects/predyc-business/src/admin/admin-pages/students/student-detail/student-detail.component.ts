import { Component } from "@angular/core";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import { Title } from "@angular/platform-browser";
import { ActivatedRoute } from "@angular/router";
import { Observable, Subscription, map, switchMap } from "rxjs";
import { MAIN_TITLE } from "projects/predyc-business/src/admin/admin-routing.module";
import { Enterprise } from "projects/shared/models/enterprise.model";
import { User } from "projects/shared/models/user.model";
import { calculateAgeFromTimestamp } from "projects/shared/utils";
import { MatDialog } from "@angular/material/dialog";
import { DialogCreateSubscriptionComponent } from "projects/predyc-business/src/shared/components/subscription/dialog-create-subscription/dialog-create-subscription.component";
import { Subscription as SubscriptionClass } from "projects/shared/models/subscription.model";
import { DialogService } from "projects/predyc-business/src/shared/services/dialog.service";
import { SubscriptionService } from "projects/predyc-business/src/shared/services/subscription.service";
import { ProductService } from "projects/predyc-business/src/shared/services/product.service";
import { Product } from "projects/shared/models/product.model";
import { EnterpriseService } from "projects/predyc-business/src/shared/services/enterprise.service";
import { DocumentReference } from "@angular/fire/compat/firestore";
import { DialogCreateChargeComponent } from "projects/predyc-business/src/shared/components/charges/dialog-create-charge/dialog-create-charge.component";
import { Charge } from "projects/shared/models/charges.model";
import { ChargeService } from "projects/predyc-business/src/shared/services/charge.service";
import { UserService } from "projects/predyc-business/src/shared/services/user.service";
import { ProfileService } from "projects/predyc-business/src/shared/services/profile.service";
import { merge } from "rxjs/internal/observable/merge";
import { Profile } from "projects/shared/models/profile.model";
import { combineLatest } from "rxjs/internal/observable/combineLatest";
import { CourseService } from "projects/predyc-business/src/shared/services/course.service";
import { Curso } from "projects/shared/models/course.model";
import { CourseByStudent } from "projects/shared/models/course-by-student.model";

@Component({
  selector: "app-student-detail",
  templateUrl: "./student-detail.component.html",
  styleUrls: ["./student-detail.component.css"],
})
export class StudentDetailComponent {
  userId = this.route.snapshot.paramMap.get("uid");
  user;
  tab: number = 1;
  academicTab: number = 0;
  enterpriseRef: DocumentReference<Enterprise> = null;
  userRef: DocumentReference<User> = null;
  productClass = Product;

  constructor(
    private titleService: Title,
    private route: ActivatedRoute,
    private afs: AngularFirestore,
    private dialog: MatDialog,
    public dialogService: DialogService,
    private userService: UserService,
    private subscriptionService: SubscriptionService,
    private productService: ProductService,
    private enterpriseService: EnterpriseService,
    private chargeService: ChargeService,
    private profileService: ProfileService,
    private courseService: CourseService
  ) {}

  userSubscription: Subscription;
  productSubscription: Subscription;

  products: Product[];

  totalCourses: number;
  totalClasses: number;

  ngOnInit() {
    this.userRef = this.userService.getUserRefById(this.userId);
    this.userSubscription = this.afs
      .collection<User>(User.collection)
      .doc(this.userId)
      .valueChanges()
      .pipe(
        switchMap((user) => {
          const newUser = {
            ...user,
            createdAt: new Date(user.createdAt),
            birthdate: new Date(user.birthdate),
            age: calculateAgeFromTimestamp(user.birthdate),
          };
          const observables: Observable<
            Enterprise | Profile | SubscriptionClass[]
          >[] = [
            this.afs
              .collection<Enterprise>(Enterprise.collection)
              .doc(user.enterprise.id)
              .valueChanges(),
            this.subscriptionService.getUserSubscriptions$(this.userRef),
          ];
          if (user.profile?.id)
            observables.push(this.profileService.getProfile$(user.profile.id));
          return combineLatest(observables).pipe(
            map((result) => {
              const enterprise = result[0];
              const subscriptions =
                result.length >= 2
                  ? (result[1] as SubscriptionClass[]).filter(
                      (x) => x.status === SubscriptionClass.STATUS_ACTIVE
                    )
                  : null;
              const profile = result.length >= 3 ? result[2] : null;
              if (enterprise)
                this.enterpriseRef =
                  this.enterpriseService.getEnterpriseRefById(
                    (enterprise as Enterprise).id
                  );
              const subscription =
                subscriptions &&
                (subscriptions as SubscriptionClass[]).length > 0
                  ? subscriptions[0]
                  : null;
              return { ...newUser, enterprise, profile, subscription };
            }),
            switchMap((user) => {
              return this.productService
                .getProductById$(
                  (user.subscription as SubscriptionClass)?.productRef?.id
                )
                .pipe(
                  map((product) => {
                    return { ...user, product };
                  })
                );
            })
          );
        })
      )
      .subscribe((user) => {
        this.user = user;
        const title = MAIN_TITLE + `Usuario ${this.user.name}`;
        this.titleService.setTitle(title);
        if (this.combinedObservableSubscription)
          this.combinedObservableSubscription.unsubscribe();
        this.combinedObservableSubscription = combineLatest([
          this.courseService.getCourses$(),
          this.courseService.getActiveCoursesByStudent$(this.userRef),
        ]).subscribe(([allcoursesData, coursesByStudent]) => {
          if (allcoursesData.length > 0) {
            this.allcoursesData = allcoursesData;
            if (coursesByStudent.length > 0) {
              this.coursesByStudent = coursesByStudent;
              // Studyplan case
              if (!coursesByStudent[0].isExtraCourse) {
                this.hasExtraCourses = false;
                console.log("El estudiante posee un plan de estudios");
              }
              // Extra courses case
              else {
                this.hasExtraCourses = true;
                console.log("El estudiante posee cursos extracurriculares");
              }
              this.coursesInfo = this.coursesByStudent.map(
                (courseByStudent) => {
                  const courseInfo = this.allcoursesData.find(
                    (x) => x.id === courseByStudent.courseRef.id
                  );
                  return {
                    courseTitle: courseInfo.titulo,
                  };
                }
              );
            } else {
              console.log(
                "Aun no posee plan de estudio o cursos extracurriculares"
              );
            }
          }
        });
      });

    this.productSubscription = this.productService
      .getProducts$()
      .subscribe((products) => (this.products = products));
  }

  combinedObservableSubscription: Subscription;
  allcoursesData: Curso[];
  coursesByStudent: CourseByStudent[] = [];
  coursesInfo: any[];
  hasExtraCourses = true;

  createSubscription() {
    const dialogRef = this.dialog.open(DialogCreateSubscriptionComponent, {
      data: {
        userId: this.user.uid,
        products: this.products,
        enterpriseRef: this.enterpriseRef,
      },
    });

    dialogRef.afterClosed().subscribe(async (result: SubscriptionClass) => {
      if (result) {
        try {
          await this.subscriptionService.saveSubscription(result.toJson());
          this.dialogService.dialogExito();
        } catch (error) {
          this.dialogService.dialogAlerta(
            "Hubo un error al crear la suscripción. Inténtalo de nuevo."
          );
          console.error(error);
        }
      }
    });
  }

  async saveAsExtraCourse() {
    const coursesRefs: DocumentReference[] = this.user?.profile?.coursesRef;
    for (let i = 0; i < coursesRefs.length; i++) {
      const courseByStudent: CourseByStudent | null =
        await this.courseService.getCourseByStudent(
          this.userRef as DocumentReference<User>,
          coursesRefs[i] as DocumentReference<Curso>
        );
      //  ---------- if it already exists, activate it, otherwise, create it ----------
      if (courseByStudent) {
        console.log("Activando courseByStudent", courseByStudent);
        await this.courseService.setCourseByStudentActive(
          courseByStudent.id,
          null,
          null
        );
        if (!courseByStudent.isExtraCourse)
          await this.courseService.setCourseByStudentAsExtracourse(
            courseByStudent.id
          );
      } else {
        console.log("Creando nuevo courseByStudent", courseByStudent);
        await this.courseService.saveCourseByStudent(
          coursesRefs[i],
          this.userRef,
          null,
          null,
          true
        );
        // await this.courseService.setCoursesByStudentInactive(this.userRef)
      }
    }
  }

  createCharge() {
    const dialogRef = this.dialog.open(DialogCreateChargeComponent, {
      data: {
        customerRef: this.userRef,
        products: this.products,
      },
    });

    dialogRef.afterClosed().subscribe(async (result: Charge) => {
      if (result) {
        try {
          console.log("result", result);
          await this.chargeService.saveCharge(result.toJson());
          this.dialogService.dialogExito();
        } catch (error) {
          this.dialogService.dialogAlerta(
            "Hubo un error al guardar la licencia. Inténtalo de nuevo."
          );
          console.log(error);
        }
      }
    });
  }

  handleCourseTotalLengthChange(totalLength: number) {
    this.totalCourses = totalLength;
  }

  handleClassTotalLengthChange(totalLength: number) {
    this.totalClasses = totalLength;
  }

  ngOnDestroy() {
    this.userSubscription.unsubscribe();
    this.productSubscription.unsubscribe();
  }
}
