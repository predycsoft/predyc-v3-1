import { Component } from '@angular/core';
// import { oldProducts } from './old data/product.data';
// import { oldPrices } from './old data/prices.data';
import { Product, ProductJson } from 'projects/shared/models/product.model';
import { ProductService } from '../../services/product.service';
import { EnterpriseJson } from 'projects/shared/models/enterprise.model';
import { EnterpriseService } from '../../services/enterprise.service';
import { License, LicenseJson } from 'projects/shared/models/license.model';
import { Subscription as SubscriptionClass } from 'projects/shared/models/subscription.model'
import { LicenseService } from '../../services/license.service';
import { ProfileJson } from 'projects/shared/models/profile.model';
import { Permissions, PermissionsJson, firestoreTimestampToNumberTimestamp, oldUser } from 'projects/shared';
import { ProfileService } from '../../services/profile.service';
import { CategoryService } from '../../services/category.service';
import { CategoryJson } from 'projects/shared/models/category.model';
import { oldCategoriesNames } from './old data/categories.data';
import { oldEmpresasCLientes } from './old data/empresasCliente.data';
import { oldUsers } from './old data/usuarios.data';
import { User, UserJson } from 'projects/functions/dist/shared/models/user.model';
import { UserService } from '../../services/user.service';
import { categoriesData } from 'projects/predyc-business/src/assets/data/categories.data';
import { Category } from 'projects/functions/dist/shared/models/category.model';
import { Skill } from 'projects/functions/dist/shared/models/skill.model';
import { skillsData } from 'projects/predyc-business/src/assets/data/skills.data';
import { SkillService } from '../../services/skill.service';
import { instructorsData } from 'projects/predyc-business/src/assets/data/instructors.data';
import { InstructorsService } from '../../services/instructors.service';
import { Clase } from 'projects/functions/dist/shared/models/course-class.model';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { coursesData } from 'projects/predyc-business/src/assets/data/courses.data';
import { Curso } from 'projects/functions/dist/shared/models/course.model';
import { capitalizeFirstLetter } from 'projects/functions/dist/shared/utils';
import { courseCategoryAndSkillsRelation } from 'projects/predyc-business/src/assets/data/courseCategoryAndSkillsRelation.data';
import { CourseService } from '../../services/course.service';
import { CourseByStudent, CourseByStudentJson } from 'projects/functions/dist/shared/models/course-by-student.model';
import { Activity } from 'projects/functions/dist/shared/models/activity-classes.model';
import { ActivityClassesService } from '../../services/activity-classes.service';
import { CourseClassService } from '../../services/course-class.service';
import { ModuleService } from '../../services/module.service';
import { Modulo } from 'projects/functions/dist/shared/models/module.model';
import { ClassByStudent, ClassByStudentJson } from 'projects/functions/dist/shared/models/class-by-student.model';
import { oldCursosInscritos } from './old data/cursosInscritos.data';
import { combineLatest, filter, firstValueFrom, map, switchMap, take } from 'rxjs';


@Component({
  selector: 'app-migrations',
  templateUrl: './migrations.component.html',
  styleUrls: ['./migrations.component.css']
})
export class MigrationsComponent {

  instructors = [];

  coursesByStudent: CourseByStudentJson[]
  
  classesByStudent: ClassByStudentJson[]

  coursesIdMap: { [key: string]: string } = {} // from old courseId to new one
  usersIdMap: { [key: string]: string } = {} // from old userId to new one

  allCoursesData: any

  constructor(
    private enterpriseService: EnterpriseService,
    private userService: UserService,
    private productService: ProductService,
    private licenseService: LicenseService,
    private profileService: ProfileService,
    private categoryService: CategoryService,
    private skillService: SkillService,
    private instructorsService: InstructorsService,
    public courseService : CourseService,
    private afs: AngularFirestore,
    private activityClassesService: ActivityClassesService,
    public courseClassService: CourseClassService,
    public moduleService: ModuleService,

  ) {}

  ngOnInit() {
    console.log("*********** Data to migrate ***********")
    // console.log("empresasCliente", oldEmpresasCLientes)
    // console.log("user (of empresasCliente)", oldUsers)
    // console.log("cursos -> inscritos (of users) (sum of all users studyPlan)", oldCursosInscritos)
    this.getCourses().subscribe(courses=> {
      this.allCoursesData = courses
      console.log("this.allCoursesData", this.allCoursesData)
    })


  }

  getCourses() {
    // Fetch all classes once
    const allClasses$ = this.afs
      .collection<Clase>(Clase.collection)
      .valueChanges();

    // Query to get where enterprise is empty
    const enterpriseEmpty$ = this.afs
      .collection<Curso>(Curso.collection, (ref) =>
        ref.where("enterpriseRef", "==", null)
      )
      .valueChanges();

    return combineLatest([
      enterpriseEmpty$,
      allClasses$,
    ]).pipe(
      map(([ empty, allClasses]) => {
        // Combine matched and empty courses
        const combinedCourses = [ ...empty];

        // Process each course
        return combinedCourses.map((course) => {
          // Fetch modules for each course
          const modules$ = this.afs
            .collection(
              `${Curso.collection}/${course.id}/${Modulo.collection}`
            )
            .valueChanges();

          return modules$.pipe(
            map((modules) => {
              // For each module, find and attach the relevant classes
              const modulesWithClasses = modules.map((module) => {
                const classes = module["clasesRef"].map((claseRef) =>
                  allClasses.find((clase) => clase.id === claseRef.id)
                );

                return { ...(module as Modulo), clases: classes };
              });

              return { ...course, modules: modulesWithClasses };
            })
          );
        });
      }),
      switchMap((courseModulesObservables) =>
        combineLatest(courseModulesObservables)
      )
    );
  }

  async migrateAll() {
    await this.migrateEnterprises()
    await this.migrateUsers()
    await this.migrateCoursesByStudent()
    await this.migrateClassesByStudent()
  }

  async migrateEnterprises() {
    const oldEnterprisesData: any[] = oldEmpresasCLientes

    const enterprisesInNewModel: EnterpriseJson[] = oldEnterprisesData.map(oldEnterpriseData => {
      const permissions = new Permissions()
      if (oldEnterpriseData.hoursPerWeek) permissions.hoursPerWeek = oldEnterpriseData.hoursPerWeek
      return {
        city: null,
        country: null,
        createdAt: oldEnterpriseData.fechaCreacion ? oldEnterpriseData.fechaCreacion : +new Date(),
        description: oldEnterpriseData.description ? oldEnterpriseData.description : 
                    oldEnterpriseData.resumen ? oldEnterpriseData.resumen : null,
        employesNo: oldEnterpriseData.students ? oldEnterpriseData.students.length : 
                    oldEnterpriseData.usuarios ? oldEnterpriseData.usuarios.length : 0,
        id: oldEnterpriseData.id,
        name: oldEnterpriseData.nombre ? oldEnterpriseData.nombre : oldEnterpriseData.id,
        permissions: this.permissionsToJson(permissions),
        photoUrl: oldEnterpriseData.foto ? oldEnterpriseData.foto : null ,
        // profilesNo: oldEnterpriseData.profileStudyPlan.length,  // or .departments profiles
        profilesNo: null,
        zipCode: null,
        workField: null,
        socialNetworks: {
            facebook: null,
            instagram: null,
            website: oldEnterpriseData.sitioWeb ? oldEnterpriseData.sitioWeb : null,
            linkedin: oldEnterpriseData.enlaceLinkedin ? oldEnterpriseData.enlaceLinkedin : null,
        },
        vimeoFolderId: oldEnterpriseData.vimeoFolderID ? oldEnterpriseData.vimeoFolderID : null ,
        vimeoFolderUri: oldEnterpriseData.vimeoFolderUri ? oldEnterpriseData.vimeoFolderUri : null,
      }
    })

    console.log("enterprisesInNewModel", enterprisesInNewModel)
    await this.enterpriseService.saveEnterprises(enterprisesInNewModel)
  }

  async migrateUsers() {
    const oldUsersData: any[] = oldUsers

    const usersInNewModel: UserJson[] = oldUsersData.map(oldUserData => {
      // console.log("oldUserData.name", oldUserData.name)
      return {
        avgScore: oldUserData.score ? oldUserData.score : null, // or .grade ??? 
        birthdate: oldUserData.birthdate,
        canEnrollParticularCourses: null, // ???
        city: null,
        country: oldUserData.country ? oldUserData.country : oldUserData.paisActual ? oldUserData.paisActual : "",
        courseQty: oldUserData.cantCursos,
        createdAt: firestoreTimestampToNumberTimestamp(oldUserData.fechaRegistro),
        currentlyWorking: null,
        departmentRef: null, // ***
        displayName: oldUserData.displayName ? oldUserData.displayName : oldUserData.name,
        email: oldUserData.email,
        enterprise: this.enterpriseService.getEnterpriseRefById(oldUserData.empresaId),
        experience: oldUserData.experience ? oldUserData.experience : oldUserData.anosExperiencia,
        gender: oldUserData.genero,
        hiringDate: oldUserData.hiringDate, 
        job: oldUserData.cargo ? oldUserData.cargo : oldUserData.profesion ? oldUserData.profesion : "",
        lastConnection: null, // ?????
        mailchimpTag: oldUserData.mailchimpTag,
        name: oldUserData.name,
        phoneNumber: oldUserData.phone ? oldUserData.phone : oldUserData.telefono ? oldUserData.telefono : "" ,
        photoUrl: oldUserData.photoURL,
        profile: null, // ***
        isSystemUser: false,
        role: oldUserData.role,
        isActive: oldUserData.status === "active",
        stripeId: oldUserData.stripeId ? oldUserData.stripeId : null,
        uid: oldUserData.uid,  // THIS VALUE CHANGE BECAUSE OF THE CLOUD FUNCTION
        updatedAt: oldUserData.fechaUltimaAct ? oldUserData.fechaUltimaAct : null,
        certificatesQty: null,
        performance:  oldUserData.performance ? oldUserData.performance : null, // get it from studyPlan ???
        ratingPoints: null, // get it from studyPlan ???
        studyHours: oldUserData.hoursPerWeek, // get it from studyPlan ???
        status: oldUserData.status === "active" ? SubscriptionClass.STATUS_ACTIVE : SubscriptionClass.STATUS_INACTIVE ,
        zipCode: null,
      }
    })
    console.log("usersInNewModel", usersInNewModel)
  
    for (let user of usersInNewModel) this.usersIdMap[user.uid] =  await this.userService.addUserInMigrations(User.fromJson(user))
    console.log("this.usersIdMap", this.usersIdMap)
    console.log("ALL USERS CREATED")

  }

  async migrateCoursesByStudent() {

    const snapshot = await firstValueFrom(this.afs.collection(Curso.collection).get())
    if (snapshot.empty) await this.migrateCoursesAndClasses() 
    
    const oldUsersData: any[] = oldUsers
    const oldCoursesData: any[] = oldCursosInscritos

    this.coursesIdMap = await this.courseService.getCourseIdMappings()

    // console.log("coursesIdMap", coursesIdMap)

    const allCoursesByStudent: CourseByStudentJson[] = []

    for (let oldUser of oldUsersData) {
      const coursesByStudent: CourseByStudentJson[] = oldUser.studyPlan.map(studyPlanCourse => {
        const courseOldData = oldCoursesData.find(x => (x.cursoId === studyPlanCourse.cursoId) && (x.usuarioId === oldUser.uid))

        return {
          active: true,
          courseRef: this.coursesIdMap[studyPlanCourse.cursoId] ? this.courseService.getCourseRefById(this.coursesIdMap[studyPlanCourse.cursoId]) : null,
          // courseRef: this.courseService.getCourseRefById(this.coursesIdMap[studyPlanCourse.cursoId]), // UNCONMENT THIS WHEN ALL COURSES ARE CREATED
          dateEnd: new Date(studyPlanCourse.fechaCompletacion),
          dateEndPlan: new Date(studyPlanCourse.fechaFin),
          dateStart: courseOldData.fechaInscripcion ? new Date(courseOldData.fechaInscripcion) : new Date(studyPlanCourse.fechaInicio),
          dateStartPlan: new Date(studyPlanCourse.fechaInicio),
          finalScore: null, // courseOldData.progreso ??? theyre all 0
          id: null,
          progress: courseOldData.progreso,
          userRef: this.userService.getUserRefById(this.usersIdMap[oldUser.uid]),
          courseTime: studyPlanCourse.duracion,
          progressTime: null,
          isExtraCourse: false,
        }
      })
      allCoursesByStudent.push(...coursesByStudent)
    }

    console.log("allCoursesByStudent", allCoursesByStudent)
    this.coursesByStudent = allCoursesByStudent
    for (let courseByStudent of allCoursesByStudent) {
      const ref = this.afs.collection<CourseByStudent>(CourseByStudent.collection).doc().ref;
      courseByStudent.id = ref.id
      await this.afs.collection(CourseByStudent.collection).doc(courseByStudent.id).set(courseByStudent);
    }
    console.log("CoursesByStudent migrated")
  }

  async migrateClassesByStudent() {
    console.log("***** Creating classeByStudent")
    const oldCoursesData = oldCursosInscritos
    const allClassesByStudent: ClassByStudentJson[] = []

    if (!this.coursesIdMap) this.coursesIdMap = await this.courseService.getCourseIdMappings()

    for (let oldCourse of oldCoursesData) {
      if (oldCourse.clases) {
        const olCourseClasses = oldCourse.clases.sort((a, b) => a.numero - b.numero);
        console.log("--- ", oldCourse.cursoTitulo)

        let prevClaseModule = 1  
        let claseIndex = 0 // In course -> module, clasesRef array is already sorted 
        const classesByStudent = olCourseClasses.map(async clase => {

          if (prevClaseModule !== clase.modulo) claseIndex = 0
          const classRef = await this.getClassRef(clase, oldCourse.cursoId, claseIndex)
          claseIndex ++ 
          prevClaseModule = clase.modulo

          const courseRef: DocumentReference<Curso> | null = this.coursesIdMap[oldCourse.cursoId] ? this.courseService.getCourseRefById(this.coursesIdMap[oldCourse.cursoId]) : null
          const userRef: DocumentReference<User> = this.userService.getUserRefById(this.usersIdMap[oldCourse.usuarioId])
          const courseByStudent: CourseByStudent = await this.courseService.getCourseByStudent(userRef, courseRef)
          
          return {
            active: true,
            classRef: classRef, 
            completed: clase.completado,
            coursesByStudentRef: this.courseService.getCourseByStudentRef(courseByStudent.id),
            dateEnd: null, // ???
            dateStart: null, // ???
            id: null,
            review: null, // ???
            reviewDate: null, // ???
            userRef: userRef,
          }
        })
        const resolvedClassesByStudent = await Promise.all(classesByStudent);
        allClassesByStudent.push(...resolvedClassesByStudent)
      }
    }


    console.log("allClassesByStudent", allClassesByStudent)
    this.classesByStudent = allClassesByStudent
    // console.log("setting in database")
    // for (let classByStudent of allClassesByStudent) {
    //   const ref = this.afs.collection<ClassByStudent>(ClassByStudent.collection).doc().ref;
    //   classByStudent.id = ref.id
    //   await this.afs.collection(ClassByStudent.collection).doc(classByStudent.id).set(classByStudent);
    // }
    // console.log("ClassesByStudent migrated")
  }

  public permissionsToJson(permissions: Permissions): PermissionsJson {
    return {
      hoursPerWeek: permissions.hoursPerWeek,
      studyLiberty: permissions.studyLiberty,
      studyplanGeneration: permissions.studyplanGeneration,
      attemptsPerTest: permissions.attemptsPerTest,
      createCourses: permissions.createCourses,      
    };
  }

  async migrateCoursesAndClasses() {
    // Create categories
    console.log('********* Creating Categories *********')
    const categories: Category[] = categoriesData.map(category => {
      return Category.fromJson({
        ...category,
        //enterprise: enterpriseRef
      })
    })
    // console.log("categories", categories)
    for (let category of categories) {
      await this.categoryService.addCategory(category)
      // console.log('new category',category)
    }
    // console.log(`Finished Creating Categories`)

    // Create skills
    console.log('********* Creating Skills *********')
    const skills: Skill[] = skillsData.map(skill => {
      const targetCategory = categories.find(category => category.name.toLowerCase() === skill.category.toLowerCase())
      const categoryRef = this.categoryService.getCategoryRefById(targetCategory.id)
      return Skill.fromJson({
        ...skill,
        category: categoryRef,
        enterprise: null,
      })
    })
    for (let skill of skills) {
      await this.skillService.addSkill(skill)
    }
    // console.log(`Finished Creating Skills`)

    // Create Instructors (OLD) 
    console.log('********* Creating Instructors *********');
    for (let i = 0; i < instructorsData.length; i++) {
      const instructor = instructorsData[i];
      instructor['enterpriseRef'] = null
      await this.instructorsService.addInstructor(instructor);
      this.instructors.push(instructor);
    }
    // console.log(`Finished Creating Instructors`, this.instructors);

    console.log('********* Creating Courses *********');
    await this.uploadCursosLegacy();
    console.log(`Finished Creating Courses`);
  }

  async uploadCursosLegacy() {
    let jsonData = coursesData.slice(0, 5)
    // jsonData = coursesData
    // console.log('cursos a cargar',jsonData)
    // Now you can use the jsonData object locally

    jsonData = jsonData.filter(x=>x?.publicado)
    // console.log('cursos Insert',jsonData)
    for (let index = 0; index < jsonData.length; index++) {
      let curso = jsonData[index]
      let cursoIn = new Curso
      cursoIn = structuredClone(cursoIn)
      let courseRef = this.afs.collection<Curso>(Curso.collection).doc().ref;
      cursoIn.id = courseRef.id
      cursoIn.descripcion = curso.descripcion
      cursoIn.instructorNombre = curso.instructorNombre
      cursoIn.imagen_instructor = curso.instructorFoto
      cursoIn.instructor = curso.instructorNombre
      cursoIn.imagen = curso.foto
      cursoIn.foto = curso.foto
      cursoIn.idOld = curso.id
      cursoIn.nivel = curso.nivel
      cursoIn.titulo = capitalizeFirstLetter(curso.titulo.trim().toLowerCase())
      cursoIn.duracion = curso.duracion
      let instructor = this.instructors.find(x=> x.idOld == curso.instructorId)
      // console.log('Instructor',instructor,this.instructors)
      let instructorRef = await this.afs.collection<any>('instructors').doc(instructor.id).ref;
      cursoIn.instructorRef = instructorRef
      cursoIn.resumen_instructor = instructor.resumen
      const skillsRef = []
      const courseObj = courseCategoryAndSkillsRelation.find(item => item['Cursos'].toLowerCase() === curso.titulo.toLowerCase().trim())
      if (courseObj) {
        for (let skill of [courseObj["Competencia 1"], courseObj["Competencia 2"], courseObj["Competencia 3"]]) {
          if (skill) {
            let skillName = skill.split(" ").length > 1 ? capitalizeFirstLetter(skill.toLowerCase()) : skill
            const competenciaTest = await this.getSkillRefByName(skillName)
            skillsRef.push(competenciaTest)
          }
        }
      } else {
        console.log("Titulo no encontrado", curso.titulo.toLowerCase())
      }
      cursoIn.skillsRef = skillsRef
      await this.courseService.saveCourse(cursoIn)

      // ---------- CLASES
      let clasesData = curso.clases;
      let modulos = clasesData.modulos
      let clases = clasesData.clases
      let actividades = curso.actividades

      modulos.sort(function(a, b) {
        var keyA = new Date(a.numero),
          keyB = new Date(b.numero);
        // Compare the 2 dates
        if (keyA < keyB) return -1;
        if (keyA > keyB) return 1;
        return 0;
      });

      // console.log('modulos crear ordenados',modulos)

      for (let index = 0; index < modulos.length; index++) {
        const modulo = modulos[index];
        let clasesModulo = clases.filter(x=> x.modulo == modulo.numero)
        let arrayClassesRef = []
        for (let index = 0; index < clasesModulo.length; index++) {
          const clase = clasesModulo[index];
          let claseLocal = new Clase;
          let claseRef = this.afs.collection<Clase>(Clase.collection).doc().ref;
          arrayClassesRef.push(claseRef)
          claseLocal.id = claseRef.id
          claseLocal.HTMLcontent = clase.HTMLcontent;
          claseLocal.archivos = clase.archivos.map(archivo => ({ // Usando map aquí para transformar la estructura del archivo.
            id: Date.now(),
            nombre: archivo.nombre,
            size: archivo.size,
            type: archivo.type,
            url: archivo.url
          }));
          claseLocal.tipo = clase.tipo
          claseLocal.vimeoId1 = clase.idVideo
          claseLocal.instructorRef = instructorRef
          claseLocal.duracion = clase.duracion
          claseLocal.descripcion = clase.descripcion
          claseLocal.titulo = clase.titulo
          claseLocal.date = clase.id

          // console.log('clase save',clase)
          if(clase.tipo == 'actividad'){
            let idActividad = clase.idVideo
            let actividadIn = actividades.find(x=> x.id == idActividad)
            if(actividadIn){
              let actividad = new Activity
              actividad.type = 'regular'
              actividad.title = actividadIn.title
              actividad.createdAt = actividadIn.createdAt
              actividad.coursesRef = [courseRef]
              actividad.claseRef = claseRef
              await this.activityClassesService.saveActivity(actividad);
              let preguntas = actividadIn.questions
              for (let index = 0; index < preguntas.length; index++) {
                const pregunta = {
                  ...preguntas[index],
                  type: preguntas[index].type.value
                }
                this.activityClassesService.saveQuestion(pregunta, actividad.id)
              }
            }
          }
          await this.courseClassService.saveClass(claseLocal);
        }
        let idRef = this.afs.collection<Modulo>(Modulo.collection).doc().ref.id;
        //console.log('modulo',modulo)
        let module = new Modulo;
        module.id = idRef;
        module.numero = modulo.numero;
        module.titulo = modulo.titulo;
        module.clasesRef = arrayClassesRef;
        await this.moduleService.saveModulo(module, courseRef.id)
      }


      console.log(` ----- Course ${index} Added ----- `)
    }
  }

  getSkillRefByName(skillName): Promise<any | null> {
    return new Promise(async (resolve, reject) => {
      await this.afs.collection<any>('skill', ref =>
        ref.where('name', '==', skillName)
          //  .where('enterprise', '==', null)
      ).get().subscribe(querySnapshot => {
        if (!querySnapshot.empty) {
          // Resolving with the first document reference
          resolve(querySnapshot.docs[0].ref);
        } else {
          console.log('No skill found with the given name and enterprise null');
          resolve(null);
        }
      }, error => {
        console.error('Error fetching skill:', error);
        reject(error);
      });
    });
  }

  async getClassRef(oldClase: any, oldCourseId: string, claseIndex: number): Promise<DocumentReference> {
    const oldModuleNumber: number = oldClase.modulo
    const newCourseId: string = this.coursesIdMap[oldCourseId] 

    // Get new module doc
    // const querySnapshot  = await firstValueFrom(this.afs.collection<Curso>(Curso.collection).doc(newCourseId).collection<Modulo>(Modulo.collection, (ref) =>
    //   ref.where("numero", "==", oldModuleNumber)).get());
    // if (!querySnapshot.empty) {
    //   console.log(`No data found for ID: ${newCourseId}, module ${oldModuleNumber}`);
    //   return null;
    // }
    // const newModuleData: Modulo = querySnapshot.docs[0].data();
    console.log("newCourseId", newCourseId)
    const courseAllData = this.allCoursesData.find(x => x.id === newCourseId)
    const newModuleData = courseAllData?.modules.find(x => x.numero === oldModuleNumber)

    
    return newModuleData?.clasesRef[claseIndex]
  }

  // --------------------------- Other migrations.

  // async migrateProducts() {
  //   const oldProductsData: any[] = oldProducts
  //   const oldPricesData: any[] = oldPrices

  //   const productsInNewModel: ProductJson[] = oldPricesData.map(price => {
  //     const oldProductData = oldProductsData.find(x => x.id === price.productId)
  //     return {
  //       accesses: {
  //         enableUserRadar: false,
  //         enableStudyPlanView: false,
  //         enableExtraCoursesView: false,
  //         enableToTakeTest: false,
  //         enableCreateParticularCourses: false,
  //         enableEnrollParticularCourses: oldProductData.canEnrollByHimself,
  //       },
  //       active: price.active, // or product.active?
  //       amount: price.amount,
  //       autodeactivate: true, // new
  //       createdAt: +new Date(),
  //       description: oldProductData.description,
  //       features: oldProductData.features,
  //       id: price.id,
  //       name: price.id.replace(/-/g, " "),
  //       type: oldProductData.isACompanyProduct ? Product.TYPE_FULL : Product.TYPE_INDEPEND,
  //     }
  //   })

  //   await this.productService.saveProducts(productsInNewModel)
  //   console.log("productsInNewModel", productsInNewModel)
  // }

  // async migrateLicenses() {
  //   const oldEnterprisesData: any[] = oldEmpresasCLientes
  //   const licensesInNewModel: LicenseJson[] = []

  //   for (let oldEnterpriseData of oldEnterprisesData) {
  //     if (oldEnterpriseData.licences) {
  //       for (let oldLicenseData of oldEnterpriseData.licences) {
  //         const licenseInNewModel: LicenseJson = {
  //           createdAt: oldLicenseData.createdAt,
  //           currentPeriodEnd: oldLicenseData.currentPeriodEnd,
  //           currentPeriodStart: oldLicenseData.currentPeriodStart,
  //           enterpriseRef: this.enterpriseService.getEnterpriseRefById(oldEnterpriseData.id),
  //           failedRotationCount: null, // new
  //           id: oldLicenseData.id,
  //           productRef: this.productService.getProductRefById(oldLicenseData.priceId),
  //           quantity: oldLicenseData.quantity,
  //           quantityUsed: oldLicenseData.retrieveBy.length,
  //           rotations: null, // new
  //           rotationsUsed: null, //new
  //           rotationsWaitingCount: null, // new
  //           startedAt: oldLicenseData.startedAt,
  //           status: oldLicenseData.status === SubscriptionClass.STATUS_ACTIVE ? SubscriptionClass.STATUS_ACTIVE : SubscriptionClass.STATUS_INACTIVE,
  //         }
  //         licensesInNewModel.push(licenseInNewModel)
  //       }
  //     }
  //   }

  //   await this.licenseService.saveLicenses(licensesInNewModel)
  //   console.log("licensesInNewModel", licensesInNewModel)

  // }

  // async migrateCategories() {
  //   const categoriesInNewModel: CategoryJson[] = oldCategoriesNames.map(oldCategorieName => {
  //     return {
  //       name: oldCategorieName,
  //       id: null,
  //       enterprise: null
  //     }
  //   })
  //   await this.categoryService.saveCategories(categoriesInNewModel)
  //   console.log("categoriesInNewModel", categoriesInNewModel)

  // }
  
  // // it is not finished. we need to create courses collection first
  // async migrateProfiles() {
  //   const oldEnterprisesData: any[] = oldEmpresasCLientes

  //   const profilesInNewModel: ProfileJson[] = []

  //   oldEnterprisesData.forEach(oldEnterpriseData => {
  //     // each enterprise
  //     if (oldEnterpriseData.departments) {
  //       oldEnterpriseData.departments.forEach(department => {
  //         // each department
  //         if (department.profiles) {
  //           department.profiles.forEach(profile => {
  //             // each profile
  //             const permissions = new Permissions()
  //             // permissions.createCourses = true
  //             const profileInNewModel: ProfileJson = {
  //               id: profile.id,
  //               name: profile.name,
  //               description: profile.description,
  //               coursesRef: null, // set later with enterprise.profileStudyPlan
  //               enterpriseRef: this.enterpriseService.getEnterpriseRefById(oldEnterpriseData.id),
  //               permissions: this.permissionsToJson(permissions),
  //               hoursPerMonth: null,  // null or a standart number?
  //               baseProfile: null,
  //             }
  //             profilesInNewModel.push(profileInNewModel)
  //           })
  //         }
  //       });

  //     }
  //   })

  //   await this.profileService.saveProfiles(profilesInNewModel)

  //   console.log("profilesInNewModel", profilesInNewModel)

  // }

  // public permissionsToJson(permissions: Permissions): PermissionsJson {
  //   return {
  //     hoursPerWeek: permissions.hoursPerWeek,
  //     studyLiberty: permissions.studyLiberty,
  //     studyplanGeneration: permissions.studyplanGeneration,
  //     attemptsPerTest: permissions.attemptsPerTest,
  //     createCourses: permissions.createCourses,      
  //   };
  // }

}