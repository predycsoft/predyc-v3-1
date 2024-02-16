import { Component } from '@angular/core';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription, firstValueFrom } from 'rxjs';
import { Curso } from 'src/app/shared/models/course.model';
import { Enterprise } from 'src/app/shared/models/enterprise.model';
import { License } from 'src/app/shared/models/license.model';
import { Price } from 'src/app/shared/models/price.model';
import { Profile } from 'src/app/shared/models/profile.model';
import { User, UserJson } from 'src/app/shared/models/user.model';
import { AlertsService } from 'src/app/shared/services/alerts.service';
import { CourseService } from 'src/app/shared/services/course.service';
import { EnterpriseService } from 'src/app/shared/services/enterprise.service';
import { IconService } from 'src/app/shared/services/icon.service';
import { ProfileService } from 'src/app/shared/services/profile.service';
import { UserService } from 'src/app/shared/services/user.service';
import { dateFromCalendarToTimestamp, daysBetween } from 'src/app/shared/utils';

function getStartOfTwoMonthsAgo(today) {
  const twoMonthsAgo = new Date(today); // Create a new date object with today's date
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2); // Subtract two months
  twoMonthsAgo.setDate(1); // Set day to 1 (start of the month)
  twoMonthsAgo.setHours(0, 0, 0, 0); // Set time to midnight (beginning of the day)
  return +twoMonthsAgo; // Convert date to timestamp and return
}

@Component({
  selector: 'app-create-demo',
  templateUrl: './create-demo.component.html',
  styleUrls: ['./create-demo.component.css']
})
export class CreateDemoComponent {

  createDemoForm: FormGroup
  displayErrors: boolean = false

  now: number // timestampt, right now
  today: Date // Today date, starting from 00:00

  // Data for user studyPlan
  startDateForStudyPlan: number
  hoursPerMonthForStudyPlan: number = 8

  constructor(
    private alertService: AlertsService,
    private afs: AngularFirestore,
    private courseService: CourseService,
    private enterpriseService: EnterpriseService,
    private fb: FormBuilder,
    public icon: IconService,
    private profileService: ProfileService,
    private userService: UserService,
  ) {}

  courseServiceSubscription: Subscription
  courses: Curso[]
  profileServiceSubscription: Subscription
  profiles: Profile[]

  ngOnInit() {
    this.now = +new Date();
    this.today = new Date();
    this.today.setHours(0, 0, 0, 0);
    this.startDateForStudyPlan = getStartOfTwoMonthsAgo(this.today)
    this.courseServiceSubscription = this.courseService.getCourses$().subscribe(courses => {
      this.courses = courses
    })
    this.profileServiceSubscription = this.profileService.getProfiles$().subscribe(profiles => {
      this.profiles = profiles
    })
    this.createDemoForm = this.fb.group({
      enterpriseName: ['Empresa prueba', [Validators.required]],
      email: ['correoAdmin@empresa.com', [Validators.required, Validators.email]],
      phoneNumber: ["607197591", [Validators.required, Validators.pattern(/^\d*$/)]],
      activeUsersQty: [5, [Validators.required, Validators.min(1), Validators.pattern(/^\d*$/)]],
      endDate: [null, [Validators.required]],
    });
    // this.createDemoForm = this.fb.group({
    //   enterpriseName: [null, [Validators.required]],
    //   email: [null, [Validators.required, Validators.email]],
    //   phoneNumber: [null, [Validators.required, Validators.pattern(/^\d*$/)]],
    //   activeUsersQty: [null, [Validators.required, Validators.min(1), Validators.pattern(/^\d*$/)]],
    //   endDate: [null, [Validators.required]],
    // });
  }

  ngOnDestroy() {
    if (this.courseServiceSubscription) this.courseServiceSubscription.unsubscribe()
    if (this.profileServiceSubscription) this.profileServiceSubscription.unsubscribe()
  }

  async debug() {
    const priceSnapshot = await firstValueFrom(this.afs.collection<Price>(Price.collection, ref => ref.where("id", "==", "Plan-Empresarial-468USD-year")).get())
    const prices = priceSnapshot.docs.map(item => item.data())
    console.log("price", prices[0])
  }

  async validateCurrentModalPage() {
    const currentPageGroup = this.createDemoForm;
    if (currentPageGroup && currentPageGroup.invalid) return false
    return true; // Indicate that the form is valid
  }

  // Generar 10 falsos y una cantidad de activos basado en lo que ellos hayan dicho
  async onSubmit() {
    try {
      if (await this.validateCurrentModalPage()) {
        this.displayErrors = false
      } else {
        this.displayErrors = true
        return
      }
      // Check new enterprise and new admin user
      const enterpriseName: string = this.createDemoForm.controls.enterpriseName.value.trim().toLowerCase()
      const existingEnterprise = await firstValueFrom(this.afs.collection<Enterprise>(Enterprise.collection, ref => ref.where("name", "==", enterpriseName)).get())
      if (!existingEnterprise.empty) throw Error("Ya existe una empresa con este nombre")

      const adminEmail: string = this.createDemoForm.controls.email.value.trim().toLowerCase()
      const existingUser = await firstValueFrom(this.afs.collection<User>(User.collection, ref => ref.where("email", "==", adminEmail)).get())
      if (!existingUser.empty) throw Error("Ya existe un usuario con este correo")

      // Create enterprise
      console.log('********* Creating Enterprise *********')
      const enterprise = await this.createEnterprise()
      console.log(`Finished Creating Enterprise`)

      // Create License with trialDays equal to endDate-today days
      console.log('********* Creating License *********')
      const license = await this.createLicense(enterprise.id)
      console.log(`Finished Creating Licenses`)

      // Create admin and student users.
      // activeUsersQty users without profiles and without progress
      // 10 demo users without subscription but with profiles and progress. For these users, studyplan should be created with specified dedication perMonth and startDate
      console.log('********* Creating Users *********')
      await this.createUsers(enterprise.id)
      console.log(`Finished Creating Users`)

      // Assign activeUsersQty licenses to users
      console.log('********* Creating Subscriptions *********')
      console.log(`Finished Creating Subscriptions`)

      // For the 10 users create random scenarios consisting of:
      // completed validationTest with random scores
      // classesByStudent for each course
      // Updated coursesByStudent
      // Create notification based on each scenario
      // Complete final test and generate certification test

      this.alertService.succesAlert("La empresa demo se ha creado correctamente")
    } catch (error) {
      console.log(error)
      this.alertService.errorAlert(error)
    }
  }

  async createEnterprise() {
    const enterprise: Enterprise = Enterprise.fromJson({
      city: "Santiago de Querétaro",
      country: "México",
      createdAt: this.now,
      description: `Demo para ${this.createDemoForm.controls.enterpriseName.value}`,
      employesNo: 0,
      id: null,
      name: this.createDemoForm.controls.enterpriseName.value.trim().toLowerCase(),
      permissions: {
          hoursPerWeek: 8,
          studyLiberty: 'Estricto',
          studyplanGeneration: 'Confirmar',
          attemptsPerTest: 5
      },
      photoUrl: null,
      profilesNo: 0,
      zipCode: 78904,
      workField: "",
      socialNetworks: {
          facebook: null,
          instagram: null,
          website: null,
          linkedin: null
      },
      vimeoFolderId: null,
      vimeoFolderUri: null,       
    })
    console.log("Enterprise", enterprise.toJson())
    await this.enterpriseService.addEnterprise(enterprise)
    return enterprise
  }

  async createLicense(enterpriseId: string) {
    const enterpriseRef: DocumentReference<Enterprise> = this.enterpriseService.getEnterpriseRefById(enterpriseId)
    const endDateTimestamp = dateFromCalendarToTimestamp(this.createDemoForm.controls.endDate.value)
    const trialDays = daysBetween(endDateTimestamp, +this.today)
    let licenseRef = this.afs.collection<License>(License.collection).doc().ref;
    const license = License.fromJson({
      couponRef: null,
      createdAt: this.now,
      currentPeriodEnd: endDateTimestamp,
      currentPeriodStart: this.now,
      // enterpriseRef: null,
      enterpriseRef: enterpriseRef,
      id: licenseRef.id,
      priceRef: null,
      quantity: this.createDemoForm.controls.activeUsersQty.value as number,
      quantityUsed: 0,
      rotations: 0,
      rotationsUsed: 0,
      rotationsWaitingCount: 0,
      failedRotationCount: 0,
      startedAt: this.now,
      status: "active",
      trialDays: trialDays,
    });
    const priceSnapshot = await firstValueFrom(this.afs.collection<Price>(Price.collection, ref => ref.where("id", "==", "Plan-Empresarial-468USD-year")).get())
    const prices = priceSnapshot.docs.map(item => item.data())
    const price = prices[0]
    console.log("price", price)
    // const licensePriceValue = (await ((licensePriceRef as DocumentReference).get())).data() as Price
    // const couponPriceRef = licensePriceValue.coupon
    license.priceRef = this.afs.collection<Price>(Price.collection).doc(price.id).ref
    license.couponRef = price.coupon
    license.enterpriseRef = enterpriseRef

    await licenseRef.set(license.toJson(), {merge: true})
    console.log("License", license.toJson())
  }

  async createUsers(enterpriseId: string) {
    const enterpriseRef: DocumentReference<Enterprise> = this.enterpriseService.getEnterpriseRefById(enterpriseId)
    const baseUser: UserJson = {
      birthdate: Date.parse("1995-04-12T00:00:00Z"),
      canEnrollParticularCourses: false,
      city: "Queretaro",
      country: "Mexico",
      courseQty: null,
      createdAt: this.now,
      currentlyWorking: null,
      degree: null,
      adminPredyc: false,
      departmentRef: null,
      displayName: null,
      email: null,
      // enterprise: null,
      enterprise: enterpriseRef,
      experience: null,
      gender: null,
      hasCollegeDegree: null,
      hiringDate: null,
      industry: null,
      isSystemUser: false,
      job: null,
      lastConnection: null,
      mailchimpTag: null,
      name: null,
      phoneNumber: null,
      photoUrl: null,
      zipCode: null,
      profile: null,
      role: null,
      isActive: true,
      stripeId: null,
      uid: null,        
      updatedAt: this.now,
      avgScore: 0,
      certificatesQty: 0,
      performance: null,
      ratingPoints: 0,
      studyHours: 8,
      status: "inactive"
    }
    const users: UserJson[] = []
    // Admin user
    users.push({
      ...baseUser,
      displayName: `${this.createDemoForm.controls.enterpriseName.value.toLowerCase()} admin`,
      email: this.createDemoForm.controls.email.value.toLowerCase(),
      // email: `admin@${this.createDemoForm.controls.enterpriseName.value.replace(/\s/g, '').toLowerCase()}.com`,
      name: `${this.createDemoForm.controls.enterpriseName.value.toLowerCase()} admin`,
      role: 'admin',
    })
    // Active users
    for (let i = 0; i < this.createDemoForm.controls.activeUsersQty.value; i++) {
      users.push({
        ...baseUser,
        displayName: `${this.createDemoForm.controls.enterpriseName.value.toLowerCase()} user${i+1}`,
        email: `user${i+1}@${this.createDemoForm.controls.enterpriseName.value.replace(/\s/g, '').toLowerCase()}.com`,
        name: `${this.createDemoForm.controls.enterpriseName.value.toLowerCase()} user${i+1}`,
        role: 'student',
      })
    }
    // Other users
    for (let i = 0; i < 10; i++) {
      const randomProfile = this.profiles[Math.floor(Math.random()*this.profiles.length)];
      users.push({
        ...baseUser,
        displayName: `${this.createDemoForm.controls.enterpriseName.value.toLowerCase()} inactive user${i+1}`,
        email: `inactiveUser${i+1}@${this.createDemoForm.controls.enterpriseName.value.replace(/\s/g, '').toLowerCase()}.com`,
        name: `${this.createDemoForm.controls.enterpriseName.value.toLowerCase()} inactive user${i+1}`,
        role: 'student',
        profile: this.profileService.getProfileRefById(randomProfile.id)
      })
    }
    for (let user of users) {
      const newUser = User.fromJson(user)
      await this.userService.addUser(newUser)
      console.log("User", User.fromJson(user))
      if (user.profile) {
        const coursesRefs: DocumentReference<Curso>[] = this.profiles.find(profile => profile.id === user.profile.id).coursesRef
        await this.createStudyPlan(newUser.uid, coursesRefs)
      }
    }
  }

  async createStudyPlan(studentUid: string, coursesRefs: DocumentReference<Curso>[]) {
    let startDate = this.startDateForStudyPlan
    let endDate = null
    for (let i = 0; i < coursesRefs.length; i++) {
      const userRef: DocumentReference<User> = this.userService.getUserRefById(studentUid)
      const courseData = this.courses.find(courseData => courseData.id === coursesRefs[i].id);
      const courseDuration = courseData.duracion
      endDate = this.courseService.calculatEndDatePlan(startDate, courseDuration, this.hoursPerMonthForStudyPlan)
      await this.courseService.saveCourseByStudent(coursesRefs[i], userRef, new Date(startDate), new Date(endDate))
      console.log(`Student ${studentUid} enrolled ${coursesRefs[i].id} from ${new Date(startDate).toString()} to ${new Date(endDate).toString()}`)
      startDate = endDate
    }
  }

}
