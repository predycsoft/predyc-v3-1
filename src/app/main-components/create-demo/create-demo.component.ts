import { Component } from '@angular/core';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription, filter, first, firstValueFrom, of, switchMap, take } from 'rxjs';
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
import { SubscriptionService } from 'src/app/shared/services/subscription.service';
import { UserService } from 'src/app/shared/services/user.service';
import { dateFromCalendarToTimestamp, daysBetween } from 'src/app/shared/utils';
import { StudyPlanClass } from 'src/app/shared/models/study-plan-class';
import { CourseByStudent } from 'src/app/shared/models/course-by-student.model';
import Swal from 'sweetalert2';


function getStartOfSixMonthsAgo(today) {
  const sixMonthsAgo = new Date(today); // Create a new date object with today's date
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6); // Subtract six months
  sixMonthsAgo.setDate(1); // Set day to 1 (start of the month)
  sixMonthsAgo.setHours(0, 0, 0, 0); // Set time to midnight (beginning of the day)
  return +sixMonthsAgo; // Convert date to timestamp and return
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

  private firstNames: string[] = [
    'Ana', 'Luis', 'Marta', 'Juan', 'Sofía', 'Carlos',
    'Elena', 'Gabriel', 'Julia', 'Héctor', 'Irene', 'Leo',
    'Nora', 'Oscar', 'Patricia', 'Rafael', 'Sara', 'Tomás',
    'Ursula', 'Víctor', 'Yolanda', 'Zacarías', 'Alicia', 'Berto',
    'Camila', 'David', 'Fernanda', 'Gustavo', 'Helena', 'Iván'
  ];

  private lastNames: string[] = [
    'García', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez',
    'Gómez', 'Ruiz', 'Hernández', 'Jiménez', 'Díaz', 'Moreno',
    'Muñoz', 'Álvarez', 'Romero', 'Alonso', 'Gutiérrez', 'Navarro',
    'Torres', 'Domínguez', 'Vázquez', 'Ramos', 'Gil', 'Ramírez',
    'Serrano', 'Blanco', 'Molina', 'Morales', 'Suárez', 'Ortega'
  ];

  private imagePaths: string[] = [
    'assets/images/fotos neutras/Rectangle-1.png',
    'assets/images/fotos neutras/Rectangle-2.png',
    'assets/images/fotos neutras/Rectangle-3.png',
    'assets/images/fotos neutras/Rectangle.png'
  ];


  // Data for user studyPlan
  startDateForStudyPlan: number
  hoursPerMonthForStudyPlan: number = 8

  botsQty: number = 5

  constructor(
    private alertService: AlertsService,
    private afs: AngularFirestore,
    private courseService: CourseService,
    private enterpriseService: EnterpriseService,
    private fb: FormBuilder,
    public icon: IconService,
    private profileService: ProfileService,
    private userService: UserService,
    private subscriptionService: SubscriptionService,
  ) {}

  courseServiceSubscription: Subscription
  courses: Curso[]
  profileServiceSubscription: Subscription
  profiles: Profile[]

  getRandomImagePath(): string {
    const randomIndex = Math.floor(Math.random() * this.imagePaths.length);
    return this.imagePaths[randomIndex];
  }

  ngOnInit() {
    this.now = +new Date();
    this.today = new Date();
    this.today.setHours(0, 0, 0, 0);
    this.startDateForStudyPlan = getStartOfSixMonthsAgo(this.today)
    this.courseServiceSubscription = this.courseService.getCoursesObservable().pipe(filter(course =>course.length>0 ),take(1)).subscribe(courses => {
      this.courses = courses
      console.log('this.courses',this.courses)
    })
    this.profileServiceSubscription = this.profileService.getProfiles$().subscribe(profiles => {
      this.profiles = profiles
    })
    this.createDemoForm = this.fb.group({
      enterpriseName: ['Empresa prueba', [Validators.required]],
      adminName: ['Nombre completo Administrador', [Validators.required]],
      email: ['correoadmin@empresa.com', [Validators.required, Validators.email]],
      phoneNumber: ["607197591", [Validators.required, Validators.pattern(/^\d*$/)]],
      activeUsersQty: [5, [Validators.required, Validators.min(1), Validators.pattern(/^\d*$/)]],
      endDate: [null, [Validators.required]],
    });
  }

  ngOnDestroy() {
    if (this.courseServiceSubscription) this.courseServiceSubscription.unsubscribe()
    if (this.profileServiceSubscription) this.profileServiceSubscription.unsubscribe()
  }

  async debug() {
    const priceSnapshot = await firstValueFrom(this.afs.collection<Price>(Price.collection, ref => ref.where("id", "==", "Plan-Empresarial-468USD-year")).get())
    const prices = priceSnapshot.docs.map(item => item.data())
    //console.log("price", prices[0])
  }

  async validateCurrentModalPage() {
    const currentPageGroup = this.createDemoForm;
    if (currentPageGroup && currentPageGroup.invalid) return false
    return true; // Indicate that the form is valid
  }

  // Generar 5 falsos y una cantidad de activos basado en lo que ellos hayan dicho
  async onSubmit() {
    Swal.fire({
      title: 'Generando empresa...',
      text: 'Por favor, espera.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading()
      }
    });
    try {
      if (await this.validateCurrentModalPage()) {
        this.displayErrors = false
      } else {
        this.displayErrors = true
        Swal.close(); // Cierra el SweetAlert si hay errores en la validación
        return
      }
      // Check new enterprise and new admin user

      //abrir swal loading

      const enterpriseName: string = this.createDemoForm.controls.enterpriseName.value.trim().toLowerCase()
      const existingEnterprise = await firstValueFrom(this.afs.collection<Enterprise>(Enterprise.collection, ref => ref.where("name", "==", enterpriseName)).get())
      if (!existingEnterprise.empty) throw Error("Ya existe una empresa con este nombre")

      const adminEmail: string = this.createDemoForm.controls.email.value.trim().toLowerCase()
      const existingUser = await firstValueFrom(this.afs.collection<User>(User.collection, ref => ref.where("email", "==", adminEmail)).get())
      if (!existingUser.empty) throw Error("Ya existe un usuario con este correo")

      // Create enterprise
      //console.log('********* Creating Enterprise *********')
      const enterprise = await this.createEnterprise()
      //console.log(`Finished Creating Enterprise`)

      // Create License with trialDays equal to endDate-today days
      //console.log('********* Creating License *********')
      const license = await this.createLicense(enterprise.id)
      //console.log(`Finished Creating Licenses`)

      // Create admin and student users.
      // activeUsersQty users without profiles and without progress
      // 10 demo users without subscription but with profiles and progress. For these users, studyplan should be created with specified dedication perMonth and startDate
      //console.log('********* Creating Users *********')
      const users = await this.createUsers(enterprise.id)
      //console.log(`Finished Creating Users`)

      // Assign activeUsersQty licenses to users
      //console.log('********* Creating Subscriptions *********')
      // NEED CRITERIA TO FILTER USERS TO BE ACTIVATED
      // const filteredUsers = users.filter(user => user.)
      // for (let user of filteredUsers) {
      //   await this.subscriptionService.createUserSubscription(license, this.afs.collection<License>(License.collection).doc(license.id).ref, user.uid)
      // }
      //console.log(`Finished Creating Subscriptions`)

      // For the 10 users create random scenarios consisting of:
      // completed validationTest with random scores
      // classesByStudent for each course
      // Updated coursesByStudent
      // Create notification based on each scenario
      // Complete final test and generate certification test
      Swal.close();
      this.alertService.succesAlert("La empresa demo se ha creado correctamente")
      //cerrar swal loading 
    } catch (error) {
      //console.log(error)
      Swal.close();
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
    //console.log("Enterprise", enterprise.toJson())
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
    //console.log("price", price)
    // const licensePriceValue = (await ((licensePriceRef as DocumentReference).get())).data() as Price
    // const couponPriceRef = licensePriceValue.coupon
    license.priceRef = this.afs.collection<Price>(Price.collection).doc(price.id).ref
    license.couponRef = price.coupon
    license.enterpriseRef = enterpriseRef

    await licenseRef.set(license.toJson(), {merge: true})
    //console.log("License", license.toJson())
    return license
  }

  generateRandomFullName(): string {
    const randomFirstName = this.firstNames[Math.floor(Math.random() * this.firstNames.length)];
    const randomLastName = this.lastNames[Math.floor(Math.random() * this.lastNames.length)];
    return `${randomFirstName} ${randomLastName}`;
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
      displayName: `${this.createDemoForm.controls.adminName.value.toLowerCase()}`,
      email: this.createDemoForm.controls.email.value.toLowerCase(),
      // email: `admin@${this.createDemoForm.controls.adminName.value.replace(/\s/g, '').toLowerCase()}.com`,
      name: `${this.createDemoForm.controls.adminName.value.toLowerCase()}`,
      role: 'admin',
      photoUrl: this.getRandomImagePath()
    })
    // Active users
    for (let i = 0; i < this.createDemoForm.controls.activeUsersQty.value; i++) {
      let name = this.generateRandomFullName().toLowerCase()
      users.push({
        ...baseUser,
        // displayName: `${this.createDemoForm.controls.enterpriseName.value.toLowerCase()} user${i+1}`,
        displayName: `${name}`,
        email: `user${i+1}@${this.createDemoForm.controls.enterpriseName.value.replace(/\s/g, '').toLowerCase()}.com`,
        //name: `${this.createDemoForm.controls.enterpriseName.value.toLowerCase()} user${i+1}`,
        name: `${name}`,
        role: 'student',
        photoUrl: this.getRandomImagePath()
      })
    }
    // Other users
    for (let i = 0; i < this.botsQty; i++) {
      const randomProfile = this.profiles[Math.floor(Math.random()*this.profiles.length)];
      let name = this.generateRandomFullName().toLowerCase()
      users.push({
        ...baseUser,
        // displayName: `${this.createDemoForm.controls.enterpriseName.value.toLowerCase()} inactive user${i+1}`,
        displayName: `${name}`,
        email: `inactiveUser${i+1}@${this.createDemoForm.controls.enterpriseName.value.replace(/\s/g, '').toLowerCase()}.com`,
        //name: `${this.createDemoForm.controls.enterpriseName.value.toLowerCase()} inactive user${i+1}`,
        name: `${name}`,
        role: 'student',
        profile: this.profileService.getProfileRefById(randomProfile.id),
        photoUrl: this.getRandomImagePath()
      })
    }
    let today = new Date().getTime()
    let hours = this.hoursPerMonthForStudyPlan
    let tiempoExactoTransucrrido = today - this.startDateForStudyPlan
    tiempoExactoTransucrrido = tiempoExactoTransucrrido/(2629746000)// tiempo en meses
    let horasOptimasPlan = Math.round(hours*tiempoExactoTransucrrido);
    console.log('users',users)
    for (let user of users) {
      let fecha = this.startDateForStudyPlan;
      let hoursUser = this.calculateVariation(this.randomIntFromInterval(Math.round(horasOptimasPlan/2),horasOptimasPlan),5)
      console.log('horasOptimasPlan',horasOptimasPlan,'horas usuario',hoursUser)
      let minutesUser = hoursUser*60;
      let minutosMonth= Math.round(minutesUser/tiempoExactoTransucrrido)
      //let minutosMonthAux = minutosMonth;
      let minutosMonthAux = this.calculateVariation(minutosMonth,10);
      const newUser = User.fromJson(user)
      await this.userService.addUser(newUser)
      //console.log("User", User.fromJson(user))
      const userRef = this.afs.collection('user').doc(newUser.uid).ref;
      if (user.profile) {
        const coursesRefs: DocumentReference<Curso>[] = this.profiles.find(profile => profile.id === user.profile.id).coursesRef
        let coursesRefUser = await this.createStudyPlan(newUser.uid, coursesRefs) // aqui crea todos los datos del plan de estudio del usuario
        //console.log("User cursos", User.fromJson(user),coursesRefs,this.hoursPerMonthForStudyPlan,this.startDateForStudyPlan,this.courses)
        if(coursesRefs.length>0){
          //examen inicial
          let exam = {
            userRef: userRef,
            type: 'inicial',
            score:this.randomIntFromInterval(0,100),
            date:today,
            profileRef:user.profile,
          }
          await this.createExamProfile(exam)
        }
        for (let courseRef of coursesRefs){
          let course = this.courses.find(x=>x.id == courseRef.id)
          if(minutesUser<=0){
            break;
          }
          if(course && minutesUser>0){
            let coursesByStudent = coursesRefUser.find(x=>x.courseRef.id == courseRef.id)
            await this.courseStartDate(coursesByStudent,new Date(fecha));
            let modulos = course['modules'].sort((a, b) => a.numero - b.numero)
            console.log('modulos',modulos)
            let courseTime = 0;
            let classes = [];
            modulos.forEach(module => {
              module.clases.forEach(clase => {
                classes.push(clase);
                courseTime=courseTime+clase.duracion
              });
            });
            let clasesCompleted = 0
            let progressTime = 0
            let progreso = 0
            for(let clase of classes){
              progressTime = progressTime + clase.duracion
              minutesUser = minutesUser - clase.duracion;
              minutosMonthAux = minutosMonthAux - clase.duracion;
              let fechaIni = fecha;
              let fechaFin = fechaIni + (clase.duracion * 60000);
              fecha = fechaFin;
              let dateIni = new Date(fechaIni);
              let dateEnd = new Date(fechaFin);
              clasesCompleted = clasesCompleted+1;
              progreso = clasesCompleted * 90 / classes.length;
              await this.enrollClassUser(userRef, clase, coursesByStudent, dateIni, dateEnd,progreso,progressTime,courseTime,newUser,course);
              if (minutosMonthAux <= 0) {
                let nextFecha = this.obtenerPrimerDiaDelSiguienteMes(fecha).getTime();
                if(nextFecha<=today){
                  fecha = nextFecha
                  minutosMonthAux = this.calculateVariation(minutosMonth,10);
                }
              }
              if (minutesUser <= 0) {
                console.log('break user')
                break;
              }
            }
            if(progreso<90){
              await this.updateProgressCourse(coursesByStudent,progreso,progressTime,courseTime)
              console.log('update progress course after classes')
            }
          }
        }
      }
    }
    return users
  }


  async createExamProfile(test){
    try{
      const ref = this.afs.collection<any>('profileTestsByStudent').doc().ref;
      await ref.set({...test, id: ref.id}, { merge: true });
    }
    catch (error) {
      console.log('createExamProfile error',error)
    }
    
  }


  async courseStartDate(coursesByStudent,date){
    let idCourseStudent = coursesByStudent.id
    await this.afs.collection("coursesByStudent").doc(idCourseStudent)
    .update({
      dateStart: date
    });
  }
  async enrollClassUser(userRef,clase,coursesByStudent,date,dateEnd,progreso,progressTime,courseTime,user,course){

    const claseRef = this.afs.collection('class').doc(clase.id).ref;
    const coursesByStudentRef = this.afs.collection('coursesByStudent').doc(coursesByStudent.id).ref;
    let classStudyPlan = new StudyPlanClass
    classStudyPlan.completed = false
    classStudyPlan.classRef = claseRef
    classStudyPlan.userRef = userRef
    classStudyPlan.coursesByStudentRef = coursesByStudentRef;
    classStudyPlan.dateStart = date;
    classStudyPlan.dateEnd = dateEnd;
    classStudyPlan.completed = true
    try {
      const ref = this.afs.collection<StudyPlanClass>(StudyPlanClass.collection).doc().ref;
      await ref.set({...classStudyPlan.toJson(), id: ref.id}, { merge: true });
      classStudyPlan.id = ref.id;
      clase.classByStudentData = classStudyPlan;
      let idCourseStudent = coursesByStudent.id
      if(progreso >= 90){ // Curso terminado
        progreso = 100
        let finalScore = this.randomIntFromInterval(70,100)
        await this.afs.collection("coursesByStudent").doc(idCourseStudent)
        .update({
          dateEnd:dateEnd,
          progress:progreso,
          finalScore:finalScore,
          progressTime:progressTime,
          courseTime:courseTime,
          courseDuration:courseTime,
        });
        let certificado={
          usuarioId: user.uid,
          usuarioEmail: user.email,
          usuarioNombre: user.name,
          cursoId: course.id,
          cursoTitulo: course.titulo,
          instructorId: course.instructorRef.id,
          instructorNombre: course.instructorNombre,
          puntaje: finalScore,
          usuarioFoto: null,
          date: dateEnd
        }
        const ref = this.afs.collection<any>('userCertificate').doc().ref;
        await ref.set({...certificado, id: ref.id}, { merge: true });
      }
      console.log('enrollClassUser')
    } 
    catch (error) {
    }

  }

  async updateProgressCourse(coursesByStudent,progreso,progressTime,courseTime){
    let idCourseStudent = coursesByStudent.id
    await this.afs.collection("coursesByStudent").doc(idCourseStudent)
    .update({
      progress:progreso,
      progressTime: progressTime,
      courseTime: courseTime
    });
  }

  randomIntFromInterval(min, max) { // min and max included 
    return Math.round(Math.random() * (max - min + 1) + min)
  }

  obtenerPrimerDiaDelSiguienteMes(fechaEnMilisegundos: number): Date {
    const fecha = new Date(fechaEnMilisegundos);
  
    // Incrementar el mes
    if (fecha.getMonth() === 11) { // Diciembre
      fecha.setFullYear(fecha.getFullYear() + 1); // Incrementar el año
      fecha.setMonth(0); // Establecer el mes a Enero
    } else {
      fecha.setMonth(fecha.getMonth() + 1); // Incrementar el mes
    }
  
    // Establecer el día a 1
    fecha.setDate(1);
  
    return fecha;
  }
  

  calculateVariation(value: number, percentage: number): number {
    const variation = value * (percentage / 100);
    // para una variación positiva o negativa, generamos un número aleatorio entre -1 y 1 y lo multiplicamos por la variación
    const randomSign = Math.random() < 0.5 ? -1 : 1;
    return value + (variation * randomSign);
  }

  async createStudyPlan(studentUid: string, coursesRefs: DocumentReference<Curso>[]): Promise<CourseByStudent[]> {
    let startDate = this.startDateForStudyPlan;
    let endDate = null;
    const enrolledCourses: CourseByStudent[] = []; // Arreglo para almacenar los cursos insertados
  
    for (let i = 0; i < coursesRefs.length; i++) {
      const userRef: DocumentReference<User> = this.userService.getUserRefById(studentUid);
      const courseData = this.courses.find(courseData => courseData.id === coursesRefs[i].id);
      const courseDuration = courseData.duracion;
      endDate = this.courseService.calculatEndDatePlan(startDate, courseDuration, this.hoursPerMonthForStudyPlan);
      const enrolledCourse = await this.courseService.saveCourseByStudent(coursesRefs[i], userRef, new Date(startDate), new Date(endDate));
      enrolledCourses.push(enrolledCourse); // Almacena el curso insertado en el arreglo
      startDate = endDate;
    }
  
    return enrolledCourses; // Devuelve el arreglo de cursos insertados
  }
  

}
