import { Component } from '@angular/core';
import { capitalizeFirstLetter, firestoreTimestampToNumberTimestamp } from 'projects/shared/utils';
import { Subscription as SubscriptionClass } from "projects/shared/models/subscription.model";
import { User, UserJson } from 'projects/shared/models/user.model';
import { UserService } from '../../../services/user.service';
import { CourseClassService } from '../../../services/course-class.service';
import { ModuleService } from '../../../services/module.service';
import { EnterpriseService } from '../../../services/enterprise.service';
import { Curso } from 'projects/shared/models/course.model';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { courseCategoryAndSkillsRelation } from 'projects/predyc-business/src/assets/data/courseCategoryAndSkillsRelation.data';
import { CourseService } from '../../../services/course.service';
import { Clase } from 'projects/shared/models/course-class.model';
import { ActivityClassesService } from '../../../services/activity-classes.service';
import { Activity } from 'projects/shared/models/activity-classes.model';
import { Modulo } from 'projects/shared/models/module.model';
import { combineLatest, firstValueFrom, map, switchMap } from 'rxjs';
import { skillsData } from 'projects/predyc-business/src/assets/data/skills.data';
import { Skill } from 'projects/shared/models/skill.model';
import { categoriesData } from 'projects/predyc-business/src/assets/data/categories.data';
import { Category } from 'projects/functions/dist/shared/models/category.model';
import { instructorsData } from 'projects/predyc-business/src/assets/data/instructors.data';
import { CategoryService } from '../../../services/category.service';
import { SkillService } from '../../../services/skill.service';
import { InstructorsService } from '../../../services/instructors.service';
import { CourseByStudent, CourseByStudentJson } from 'projects/shared/models/course-by-student.model';
import { ClassByStudent, ClassByStudentJson } from 'projects/shared/models/class-by-student.model';
// import { coursesData } from 'projects/predyc-business/src/assets/data/courses.data';
// import { particularOldUsers1 } from '../old data/particular users/usuarios/particular-usuarios.data1'; //  *************************** READY
// import { particularOldUsers2 } from '../old data/particular users/usuarios/particular-usuarios.data2'; //  *************************** READY
// import { particularOldUsers3 } from '../old data/particular users/usuarios/particular-usuarios.data3'; //  *************************** READY
import { particularOldUsers4 } from '../old data/particular users/usuarios/particular-usuarios.data4';
// import { particularOldUsers5 } from '../old data/particular users/usuarios/particular-usuarios.data5';
// import { particularOldUsers6 } from '../old data/particular users/usuarios/particular-usuarios.data6';
// import { particularOldUsers7 } from '../old data/particular users/usuarios/particular-usuarios.data7';
// import { particularOldUsers8 } from '../old data/particular users/usuarios/particular-usuarios.data8';
// import { particularOldUsers9 } from '../old data/particular users/usuarios/particular-usuarios.data9';
// import { particularOldUsers10 } from '../old data/particular users/usuarios/particular-usuarios.data10';
// import { particularOldUsers11 } from '../old data/particular users/usuarios/particular-usuarios.data11';
// import { particularOldUsers12 } from '../old data/particular users/usuarios/particular-usuarios.data12';
// import { particularOldUsers13 } from '../old data/particular users/usuarios/particular-usuarios.data13';
// import { particularOldUsers14 } from '../old data/particular users/usuarios/particular-usuarios.data14';
// import { particularOldUsers15 } from '../old data/particular users/usuarios/particular-usuarios.data15';
// import { particularOldUsers16 } from '../old data/particular users/usuarios/particular-usuarios.data16';
// import { particularOldUsers17 } from '../old data/particular users/usuarios/particular-usuarios.data17';
// import { particularOldUsers18 } from '../old data/particular users/usuarios/particular-usuarios.data18';
// import { particularOldUsers19 } from '../old data/particular users/usuarios/particular-usuarios.data19';
// import { particularOldUsers20 } from '../old data/particular users/usuarios/particular-usuarios.data20';
// import { particularOldUsers21 } from '../old data/particular users/usuarios/particular-usuarios.data21';
// import { particularOldUsers22 } from '../old data/particular users/usuarios/particular-usuarios.data22';
// import { particularOldUsers23 } from '../old data/particular users/usuarios/particular-usuarios.data23';
// import { particularOldUsers24 } from '../old data/particular users/usuarios/particular-usuarios.data24';
// import { particularOldUsers25 } from '../old data/particular users/usuarios/particular-usuarios.data25';
// import { particularOldUsers26 } from '../old data/particular users/usuarios/particular-usuarios.data26';
// import { particularOldUsers27 } from '../old data/particular users/usuarios/particular-usuarios.data27';
// import { particularOldUsers28 } from '../old data/particular users/usuarios/particular-usuarios.data28';
// import { particularOldUsers29 } from '../old data/particular users/usuarios/particular-usuarios.data29';
// import { particularOldUsers30 } from '../old data/particular users/usuarios/particular-usuarios.data30';
// import { particularOldUsers31 } from '../old data/particular users/usuarios/particular-usuarios.data31';
// import { particularOldUsers32 } from '../old data/particular users/usuarios/particular-usuarios.data32';
// import { particularOldUsers33 } from '../old data/particular users/usuarios/particular-usuarios.data33';
// import { particularOldUsers34 } from '../old data/particular users/usuarios/particular-usuarios.data34';
// import { particularOldUsers35 } from '../old data/particular users/usuarios/particular-usuarios.data35';
// import { particularOldUsers36 } from '../old data/particular users/usuarios/particular-usuarios.data36';
// import { particularOldUsers37 } from '../old data/particular users/usuarios/particular-usuarios.data37';
// import { particularOldUsers38 } from '../old data/particular users/usuarios/particular-usuarios.data38';
// import { particularOldUsers39 } from '../old data/particular users/usuarios/particular-usuarios.data39';
// import { particularOldUsers40 } from '../old data/particular users/usuarios/particular-usuarios.data40';
// import { particularOldUsers41 } from '../old data/particular users/usuarios/particular-usuarios.data41';
// import { particularOldCursosInscritos1 } from '../old data/particular users/cursos-inscritos/particular-cursosInscritos.data1'; //  *************************** READY
// import { particularOldCursosInscritos2 } from '../old data/particular users/cursos-inscritos/particular-cursosInscritos.data2'; //  *************************** READY
// import { particularOldCursosInscritos3 } from '../old data/particular users/cursos-inscritos/particular-cursosInscritos.data3'; //  *************************** READY
import { particularOldCursosInscritos4 } from '../old data/particular users/cursos-inscritos/particular-cursosInscritos.data4';
import { usersData } from 'projects/predyc-business/src/assets/data/users.data';
// import { particularOldCursosInscritos5 } from '../old data/particular users/cursos-inscritos/particular-cursosInscritos.data5';
// import { particularOldCursosInscritos6 } from '../old data/particular users/cursos-inscritos/particular-cursosInscritos.data6';
// import { particularOldCursosInscritos7 } from '../old data/particular users/cursos-inscritos/particular-cursosInscritos.data7';
// import { particularOldCursosInscritos8 } from '../old data/particular users/cursos-inscritos/particular-cursosInscritos.data8';
// import { particularOldCursosInscritos9 } from '../old data/particular users/cursos-inscritos/particular-cursosInscritos.data9';
// import { particularOldCursosInscritos10 } from '../old data/particular users/cursos-inscritos/particular-cursosInscritos.data10';
// import { particularOldCursosInscritos11 } from '../old data/particular users/cursos-inscritos/particular-cursosInscritos.data11';
// import { particularOldCursosInscritos12 } from '../old data/particular users/cursos-inscritos/particular-cursosInscritos.data12';
// import { particularOldCursosInscritos13 } from '../old data/particular users/cursos-inscritos/particular-cursosInscritos.data13';
// import { particularOldCursosInscritos14 } from '../old data/particular users/cursos-inscritos/particular-cursosInscritos.data14';
// import { particularOldCursosInscritos15 } from '../old data/particular users/cursos-inscritos/particular-cursosInscritos.data15';
// import { particularOldCursosInscritos16 } from '../old data/particular users/cursos-inscritos/particular-cursosInscritos.data16';
// import { particularOldCursosInscritos17 } from '../old data/particular users/cursos-inscritos/particular-cursosInscritos.data17';
// import { particularOldCursosInscritos18 } from '../old data/particular users/cursos-inscritos/particular-cursosInscritos.data18';
// import { particularOldCursosInscritos19 } from '../old data/particular users/cursos-inscritos/particular-cursosInscritos.data19';
// import { particularOldCursosInscritos20 } from '../old data/particular users/cursos-inscritos/particular-cursosInscritos.data20';
// import { particularOldCursosInscritos21 } from '../old data/particular users/cursos-inscritos/particular-cursosInscritos.data21';
// import { particularOldCursosInscritos22 } from '../old data/particular users/cursos-inscritos/particular-cursosInscritos.data22';
// import { particularOldCursosInscritos23 } from '../old data/particular users/cursos-inscritos/particular-cursosInscritos.data23';
// import { particularOldCursosInscritos24 } from '../old data/particular users/cursos-inscritos/particular-cursosInscritos.data24';
// import { particularOldCursosInscritos25 } from '../old data/particular users/cursos-inscritos/particular-cursosInscritos.data25';
// import { particularOldCursosInscritos26 } from '../old data/particular users/cursos-inscritos/particular-cursosInscritos.data26';
// import { particularOldCursosInscritos27 } from '../old data/particular users/cursos-inscritos/particular-cursosInscritos.data27';
// import { particularOldCursosInscritos28 } from '../old data/particular users/cursos-inscritos/particular-cursosInscritos.data28';
// import { particularOldCursosInscritos29 } from '../old data/particular users/cursos-inscritos/particular-cursosInscritos.data29';
// import { particularOldCursosInscritos30 } from '../old data/particular users/cursos-inscritos/particular-cursosInscritos.data30';
// import { particularOldCursosInscritos31 } from '../old data/particular users/cursos-inscritos/particular-cursosInscritos.data31';
// import { particularOldCursosInscritos32 } from '../old data/particular users/cursos-inscritos/particular-cursosInscritos.data32';
// import { particularOldCursosInscritos33 } from '../old data/particular users/cursos-inscritos/particular-cursosInscritos.data33';
// import { particularOldCursosInscritos34 } from '../old data/particular users/cursos-inscritos/particular-cursosInscritos.data34';
// import { particularOldCursosInscritos35 } from '../old data/particular users/cursos-inscritos/particular-cursosInscritos.data35';
// import { particularOldCursosInscritos36 } from '../old data/particular users/cursos-inscritos/particular-cursosInscritos.data36';
// import { particularOldCursosInscritos37 } from '../old data/particular users/cursos-inscritos/particular-cursosInscritos.data37';
// import { particularOldCursosInscritos38 } from '../old data/particular users/cursos-inscritos/particular-cursosInscritos.data38';
// import { particularOldCursosInscritos39 } from '../old data/particular users/cursos-inscritos/particular-cursosInscritos.data39';
// import { particularOldCursosInscritos40 } from '../old data/particular users/cursos-inscritos/particular-cursosInscritos.data40';
// import { particularOldCursosInscritos41 } from '../old data/particular users/cursos-inscritos/particular-cursosInscritos.data41';


@Component({
  selector: 'app-particular-users-migration',
  templateUrl: './particular-users-migration.component.html',
  styleUrls: ['./particular-users-migration.component.css']
})
export class ParticularUsersMigrationComponent {

  constructor(private categoryService: CategoryService, private skillService: SkillService, private instructorsService: InstructorsService, private activityClassesService: ActivityClassesService, private courseService: CourseService, private afs: AngularFirestore, private enterpriseService: EnterpriseService, private userService: UserService, public courseClassService: CourseClassService, public moduleService: ModuleService) {}

  instructors = [];
  coursesByStudent: CourseByStudentJson[];
  classesByStudent: ClassByStudentJson[];
  
  coursesIdMap: { [key: string]: string } = {}; // from old courseId to new one

  allCoursesData: any;
  allCurrentUsersData: User[];

  existingUsersEmails = ["sergiovillacres16@gmail.com", "mvargas_zamudio@hotmail.com", "flaviofim2000@gmail.com", "khernandezl1@miumg.ed.gt", "14-89632@usb.ve"]

  ngOnInit() {
    this.getCourses().subscribe((courses) => {
      this.allCoursesData = courses;
      // console.log("this.allCoursesData", this.allCoursesData);
    });

    this.afs
      .collection<User>(User.collection)
      .valueChanges()
      .subscribe((users) => {
        this.allCurrentUsersData = users;
        // console.log("this.allCurrentusersData", this.allCurrentUsersData);
      });
  }
  
  async migrateUsers() {
    const oldUsersData: any[] = particularOldUsers4;
    const usersInNewModel: UserJson[] = oldUsersData.map((oldUserData) => {
      // console.log("oldUserData.name", oldUserData.name)
      const userphotoUrl = oldUserData.photoURL.startsWith('https://firebasestorage.googleapis.com/') ? oldUserData.photoURL : null
      return {
        avgScore: oldUserData.score ? oldUserData.score : null,
        birthdate: oldUserData.birthdate ? oldUserData.birthdate : null,
        canEnrollParticularCourses: null,
        city: null,
        country: oldUserData.country ? oldUserData.country : oldUserData.paisActual ? oldUserData.paisActual : "",
        courseQty: oldUserData.cantCursos, //
        createdAt: firestoreTimestampToNumberTimestamp(oldUserData.fechaRegistro),
        currentlyWorking: null,
        departmentRef: null,
        displayName: oldUserData.displayName ? oldUserData.displayName : oldUserData.nombreCompleto,
        email: oldUserData.email,
        enterprise: null,
        experience: oldUserData.experience ? oldUserData.experience : oldUserData.anosExperiencia,
        gender: oldUserData.genero,
        hiringDate: oldUserData.hiringDate ? oldUserData.hiringDate : null,
        job: oldUserData.cargo ? oldUserData.cargo : oldUserData.profesion ? oldUserData.profesion : "",
        lastConnection: null,
        mailchimpTag: oldUserData.mailchimpTag,
        name: oldUserData.name ? oldUserData.name : oldUserData.displayName ? oldUserData.displayName : oldUserData.nombreCompleto,
        phoneNumber: oldUserData.phone ? oldUserData.phone : oldUserData.telefono ? oldUserData.telefono : "",
        photoUrl: userphotoUrl,
        profile: null,
        isSystemUser: false,
        role: "student",
        isActive: false,
        stripeId: oldUserData.stripeId ? oldUserData.stripeId : null,
        oldUid: oldUserData.uid,
        uid: oldUserData.uid, // this is going to change with the cloud function
        updatedAt: oldUserData.fechaUltimaAct ? oldUserData.fechaUltimaAct : null,
        certificatesQty: null,
        performance: oldUserData.performance ? oldUserData.performance : null,
        ratingPoints: null,
        studyHours: oldUserData.hoursPerWeek ? oldUserData.hoursPerWeek : null,
        status: SubscriptionClass.STATUS_INACTIVE,
        zipCode: null,
      };
    });
    console.log("usersInNewModel", usersInNewModel);

    let index = 0
    for (let user of usersInNewModel) {
      console.log(`---- ${index}) user`, user.name, user.email)
      const existingUser = this.allCurrentUsersData.find( x => x.email === user.email)
      if (existingUser) {
        console.log("User already exists")
        this.existingUsersEmails.push( existingUser.email)
        await this.afs.collection(User.collection).doc(user.uid as string).set(
          { oldUid: user.uid,},{ merge: true }
        );
        continue
      }
      await this.userService.addUserInMigrations(User.fromJson(user)); // try to create users with batches
      index++
    } 
    console.log("ALL USERS CREATED");
    console.log("DONT CREATE COURSES FOR THE NEXT USERS:", this.existingUsersEmails)
  }

  async migrateCoursesByStudent() {
    console.log("migrating coursesbyStudent")
    // const snapshot = await firstValueFrom(this.afs.collection(Curso.collection).get());
    // if (snapshot.empty) await this.migrateCoursesAndClasses();

    const oldCoursesData: any[] = particularOldCursosInscritos4;

    if (Object.keys(this.coursesIdMap).length === 0) {
      this.coursesIdMap = await this.courseService.getCourseIdMappings();
    } 

    // console.log("coursesIdMap", this.coursesIdMap)

    const allCoursesByStudent: CourseByStudentJson[] = [];

    const coursesByStudent: CourseByStudentJson[] = oldCoursesData
      .sort((a, b) => a.fechaInscripcion - b.fechaInscripcion)
      .map((oldCourseData, idx) => {
        const userAlreadyExists = this.existingUsersEmails.includes(oldCourseData.usuarioCorreo)
        if (userAlreadyExists) {
          console.log(" XXXXXXXXXXXXXXXXXXXXX this user already exists XXXXXXXXXXXXXXXXXXXXX")
          return null
        }
        if (!this.coursesIdMap[oldCourseData.cursoId]) {
          console.log(" XXXXXXXXXXXXXXXXXXXXX this course doesnt exist in new data base XXXXXXXXXXXXXXXXXXXXX")
          return null
        }
        else {
          console.log(oldCourseData)
          const currentUserData = this.allCurrentUsersData.find((x) => x.oldUid === oldCourseData.usuarioId);
          return {
            active: true,
            courseRef: this.coursesIdMap[oldCourseData.cursoId] ? this.courseService.getCourseRefById(this.coursesIdMap[oldCourseData.cursoId]) : null,
            // dateEnd: new Date(studyPlanCourse.fechaCompletacion),
            dateEnd: oldCourseData.fechaCompletacion ? new Date(oldCourseData.fechaCompletacion) : null, // fecha en que termino
            dateEndPlan: null, // fecha seteada
            dateStart: oldCourseData.fechaInscripcion ? new Date(oldCourseData.fechaInscripcion) : null,
            dateStartPlan: null, // fecha seteada 
            finalScore: oldCourseData?.puntaje ? oldCourseData.puntaje : 
                        oldCourseData.fechaCompletacion ? this.getRandomNumber(80, 100) : 0,
            id: null,
            progress: oldCourseData.progreso,
            userRef: this.userService.getUserRefById(currentUserData.uid),
            courseTime: oldCourseData.duracion,
            progressTime: null,
            isExtraCourse: true,
            studyPlanOrder: null, 
          };
        }
      });
      // allCoursesByStudent.push(...coursesByStudent);

    this.coursesByStudent = coursesByStudent.filter(x => x !== null);
    console.log("allCoursesByStudent to migrate", this.coursesByStudent);
    console.log("--------- SETTING IN DATA BASE -------------");
    const batch = this.afs.firestore.batch();
    for (let courseByStudent of this.coursesByStudent) {
      const ref = this.afs.collection<CourseByStudent>(CourseByStudent.collection).doc().ref;
      courseByStudent.id = ref.id;
      // await this.afs.collection(CourseByStudent.collection).doc(courseByStudent.id).set(courseByStudent);
      batch.set(ref, courseByStudent);
      console.log("courseByStudent", courseByStudent.id)
    }
    await batch.commit();

    console.log("*********CoursesByStudent migrated*********");
  }

  async migrateClassesByStudent() {
    console.log("--------- Creating classeByStudent");
    const oldCoursesData = particularOldCursosInscritos4;
    const allClassesByStudent: ClassByStudentJson[] = [];

    if (Object.keys(this.coursesIdMap).length === 0) {
      this.coursesIdMap = await this.courseService.getCourseIdMappings();
    } 

    let index = 0
    for (let oldCourse of oldCoursesData) {
      const userAlreadyExists = this.existingUsersEmails.includes(oldCourse.usuarioCorreo)
      if (userAlreadyExists) {
        console.log(" XXXXXXXXXXXXXXXXXXXXX this user already exists XXXXXXXXXXXXXXXXXXXXX")
        continue
      }
      if (!this.coursesIdMap[oldCourse.cursoId]) {
        console.log(" XXXXXXXXXXXXXXXXXXXXX this course doesnt exist in new data base XXXXXXXXXXXXXXXXXXXXX")
        continue
      }

      if (oldCourse.clases) {
        const olCourseClasses = oldCourse.clases.sort((a, b) => a.numero - b.numero);
        console.log(`--- ${index})`, oldCourse.cursoId);

        let prevClaseModule = 1;
        let claseIndex = 0; // In course -> module, clasesRef array is already sorted
        let nextStartingDate = oldCourse.fechaInscripcion;
        let startingDate = null;
        let endDate = null;
        const classesByStudent = [];
        for (let i = 0; i < olCourseClasses.length; i++) {
          const clase = olCourseClasses[i];
          startingDate = nextStartingDate;
          endDate = startingDate + clase.duracion * 60 * 1000;
          if (prevClaseModule !== clase.modulo) claseIndex = 0;
          const classRef = await this.getClassRef(clase, oldCourse.cursoId, claseIndex);
          claseIndex++;
          prevClaseModule = clase.modulo;

          const courseRef: DocumentReference<Curso> | null = this.courseService.getCourseRefById(this.coursesIdMap[oldCourse.cursoId])
          // const userRef: DocumentReference<User> = this.userService.getUserRefById(this.usersIdMap[oldCourse.usuarioId]);
          const currentUserData = this.allCurrentUsersData.find((x) => x.oldUid === oldCourse.usuarioId);
          const userRef: DocumentReference<User> = this.userService.getUserRefById(currentUserData.uid);
          const courseByStudent: CourseByStudent = await this.courseService.getCourseByStudent(userRef, courseRef);
          nextStartingDate = endDate;
          classesByStudent.push({
            active: true,
            classRef: classRef,
            completed: clase.completado,
            coursesByStudentRef: this.courseService.getCourseByStudentRef(courseByStudent.id),
            dateEnd: endDate,
            dateStart: startingDate,
            id: null,
            review: null,
            reviewDate: null,
            userRef: userRef,
          });
        }
        const resolvedClassesByStudent = await Promise.all(classesByStudent);
        allClassesByStudent.push(...resolvedClassesByStudent);
      }
      index++
    }

    console.log("allClassesByStudent", allClassesByStudent);
    this.classesByStudent = allClassesByStudent;
    console.log("--------- SETTING IN DATA BASE -------------");
    const batch = this.afs.firestore.batch();
    for (let classByStudent of allClassesByStudent) {
      console.log("user id", classByStudent.userRef.id)
      const ref = this.afs.collection<ClassByStudent>(ClassByStudent.collection).doc().ref;
      classByStudent.id = ref.id;
      // await this.afs.collection(ClassByStudent.collection).doc(classByStudent.id).set(classByStudent);
      batch.set(ref, classByStudent);
    }
    await batch.commit();
    console.log("******** CLASSESBYSTUDENT MIGRATED *******");
  }



  // async migrateCoursesAndClasses() {
  //   // Create categories
  //   console.log("********* Creating Categories *********");
  //   const categories: Category[] = categoriesData.map((category) => {
  //     return Category.fromJson({
  //       ...category,
  //       //enterprise: enterpriseRef
  //     });
  //   });
  //   // console.log("categories", categories)
  //   for (let category of categories) {
  //     await this.categoryService.addCategory(category);
  //     // console.log('new category',category)
  //   }
  //   // console.log(`Finished Creating Categories`)

  //   // Create skills
  //   console.log("********* Creating Skills *********");
  //   const skills: Skill[] = skillsData.map((skill) => {
  //     const targetCategory = categories.find((category) => category.name.toLowerCase() === skill.category.toLowerCase());
  //     const categoryRef = this.categoryService.getCategoryRefById(targetCategory.id);
  //     return Skill.fromJson({
  //       ...skill,
  //       category: categoryRef,
  //       enterprise: null,
  //     });
  //   });
  //   for (let skill of skills) {
  //     await this.skillService.addSkill(skill);
  //   }
  //   // console.log(`Finished Creating Skills`)

  //   // Create Instructors (OLD)
  //   console.log("********* Creating Instructors *********");
  //   for (let i = 0; i < instructorsData.length; i++) {
  //     const instructor = instructorsData[i];
  //     instructor["enterpriseRef"] = null;
  //     await this.instructorsService.addInstructor(instructor);
  //     this.instructors.push(instructor);
  //   }
  //   // console.log(`Finished Creating Instructors`, this.instructors);

  //   console.log("********* Creating Courses *********");
  //   await this.uploadCursosLegacy();
  //   console.log(`Finished Creating Courses`);
  // }

  // async uploadCursosLegacy() {
  //   let jsonData = coursesData.slice(0, 15);
  //   jsonData = coursesData;
  //   // console.log('cursos a cargar',jsonData)
  //   // Now you can use the jsonData object locally

  //   jsonData = jsonData.filter((x) => x?.publicado);
  //   // console.log('cursos Insert',jsonData)
  //   for (let index = 0; index < jsonData.length; index++) {
  //     let curso = jsonData[index];
  //     let cursoIn = new Curso();
  //     cursoIn = structuredClone(cursoIn);
  //     let courseRef = this.afs.collection<Curso>(Curso.collection).doc().ref;
  //     cursoIn.id = courseRef.id;
  //     cursoIn.descripcion = curso.descripcion;
  //     cursoIn.instructorNombre = curso.instructorNombre;
  //     cursoIn.imagen_instructor = curso.instructorFoto;
  //     cursoIn.instructor = curso.instructorNombre;
  //     cursoIn.imagen = curso.foto;
  //     cursoIn.foto = curso.foto;
  //     cursoIn.idOld = curso.id;
  //     cursoIn.nivel = curso.nivel;
  //     cursoIn.titulo = capitalizeFirstLetter(curso.titulo.trim().toLowerCase());
  //     cursoIn.duracion = curso.duracion;
  //     let instructor = this.instructors.find((x) => x.idOld == curso.instructorId);
  //     // console.log('Instructor',instructor,this.instructors)
  //     let instructorRef = await this.afs.collection<any>("instructors").doc(instructor.id).ref;
  //     cursoIn.instructorRef = instructorRef;
  //     cursoIn.resumen_instructor = instructor.resumen;
  //     const skillsRef = [];
  //     const courseObj = courseCategoryAndSkillsRelation.find((item) => item["Cursos"].toLowerCase() === curso.titulo.toLowerCase().trim());
  //     if (courseObj) {
  //       for (let skill of [courseObj["Competencia 1"], courseObj["Competencia 2"], courseObj["Competencia 3"]]) {
  //         if (skill) {
  //           let skillName = skill.split(" ").length > 1 ? capitalizeFirstLetter(skill.toLowerCase()) : skill;
  //           const competenciaTest = await this.getSkillRefByName(skillName);
  //           skillsRef.push(competenciaTest);
  //         }
  //       }
  //     } else {
  //       console.log("Titulo no encontrado", curso.titulo.toLowerCase());
  //     }
  //     cursoIn.skillsRef = skillsRef;
  //     await this.courseService.saveCourse(cursoIn);

  //     // ---------- CLASES
  //     let clasesData = curso.clases;
  //     let modulos = clasesData.modulos;
  //     let clases = clasesData.clases;
  //     let actividades = curso.actividades;

  //     modulos.sort(function (a, b) {
  //       var keyA = new Date(a.numero),
  //         keyB = new Date(b.numero);
  //       // Compare the 2 dates
  //       if (keyA < keyB) return -1;
  //       if (keyA > keyB) return 1;
  //       return 0;
  //     });

  //     // console.log('modulos crear ordenados',modulos)

  //     for (let index = 0; index < modulos.length; index++) {
  //       const modulo = modulos[index];
  //       let clasesModulo = clases.filter((x) => x.modulo == modulo.numero);
  //       let arrayClassesRef = [];
  //       for (let index = 0; index < clasesModulo.length; index++) {
  //         const clase = clasesModulo[index];
  //         let claseLocal = new Clase();
  //         let claseRef = this.afs.collection<Clase>(Clase.collection).doc().ref;
  //         arrayClassesRef.push(claseRef);
  //         claseLocal.id = claseRef.id;
  //         claseLocal.HTMLcontent = clase.HTMLcontent;
  //         claseLocal.archivos = clase.archivos.map((archivo) => ({
  //           // Usando map aquí para transformar la estructura del archivo.
  //           id: Date.now(),
  //           nombre: archivo.nombre,
  //           size: archivo.size,
  //           type: archivo.type,
  //           url: archivo.url,
  //         }));
  //         claseLocal.tipo = clase.tipo;
  //         claseLocal.vimeoId1 = clase.idVideo;
  //         claseLocal.instructorRef = instructorRef;
  //         claseLocal.duracion = clase.duracion;
  //         claseLocal.descripcion = clase.descripcion;
  //         claseLocal.titulo = clase.titulo;
  //         claseLocal.date = clase.id;

  //         // console.log('clase save',clase)
  //         if (clase.tipo == "actividad") {
  //           let idActividad = clase.idVideo;
  //           let actividadIn = actividades.find((x) => x.id == idActividad);
  //           if (actividadIn) {
  //             let actividad = new Activity();
  //             actividad.type = "regular";
  //             actividad.title = actividadIn.title;
  //             actividad.createdAt = actividadIn.createdAt;
  //             actividad.coursesRef = [courseRef];
  //             actividad.claseRef = claseRef;
  //             await this.activityClassesService.saveActivity(actividad);
  //             let preguntas = actividadIn.questions;
  //             for (let index = 0; index < preguntas.length; index++) {
  //               const pregunta = {
  //                 ...preguntas[index],
  //                 type: preguntas[index].type.value,
  //               };
  //               this.activityClassesService.saveQuestion(pregunta, actividad.id);
  //             }
  //           }
  //         }
  //         await this.courseClassService.saveClass(claseLocal);
  //       }
  //       let idRef = this.afs.collection<Modulo>(Modulo.collection).doc().ref.id;
  //       //console.log('modulo',modulo)
  //       let module = new Modulo();
  //       module.id = idRef;
  //       module.numero = modulo.numero;
  //       module.titulo = modulo.titulo;
  //       module.clasesRef = arrayClassesRef;
  //       await this.moduleService.saveModulo(module, courseRef.id);
  //     }

  //     console.log(` ----- Course ${index} Added ----- `);
  //   }
  //   console.log("All courses Added")
  // }

  // getSkillRefByName(skillName): Promise<any | null> {
  //   return new Promise(async (resolve, reject) => {
  //     await this.afs
  //       .collection<any>(
  //         "skill",
  //         (ref) => ref.where("name", "==", skillName)
  //         //  .where('enterprise', '==', null)
  //       )
  //       .get()
  //       .subscribe(
  //         (querySnapshot) => {
  //           if (!querySnapshot.empty) {
  //             // Resolving with the first document reference
  //             resolve(querySnapshot.docs[0].ref);
  //           } else {
  //             console.log("No skill found with the given name and enterprise null");
  //             resolve(null);
  //           }
  //         },
  //         (error) => {
  //           console.error("Error fetching skill:", error);
  //           reject(error);
  //         }
  //       );
  //   });
  // }

  async getClassRef(oldClase: any, oldCourseId: string, claseIndex: number): Promise<DocumentReference> {
    const oldModuleNumber: number = oldClase.modulo;
    const newCourseId: string = this.coursesIdMap[oldCourseId];

    // console.log("newCourseId", newCourseId);
    const courseAllData = this.allCoursesData.find((x) => x.id === newCourseId);
    const newModuleData = courseAllData?.modules.find((x) => x.numero === oldModuleNumber);

    return newModuleData?.clasesRef[claseIndex];
  }

  getCourses() {
    // Fetch all classes once
    const allClasses$ = this.afs.collection<Clase>(Clase.collection).valueChanges();

    // Query to get where enterprise is empty
    const enterpriseEmpty$ = this.afs.collection<Curso>(Curso.collection, (ref) => ref.where("enterpriseRef", "==", null)).valueChanges();

    return combineLatest([enterpriseEmpty$, allClasses$]).pipe(
      map(([empty, allClasses]) => {
        // Combine matched and empty courses
        const combinedCourses = [...empty];

        // Process each course
        return combinedCourses.map((course) => {
          // Fetch modules for each course
          const modules$ = this.afs.collection(`${Curso.collection}/${course.id}/${Modulo.collection}`).valueChanges();

          return modules$.pipe(
            map((modules) => {
              // For each module, find and attach the relevant classes
              const modulesWithClasses = modules.map((module) => {
                const classes = module["clasesRef"].map((claseRef) => allClasses.find((clase) => clase.id === claseRef.id));

                return { ...(module as Modulo), clases: classes };
              });

              return { ...course, modules: modulesWithClasses };
            })
          );
        });
      }),
      switchMap((courseModulesObservables) => combineLatest(courseModulesObservables))
    );
  }

  getRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }


  // for cases when the user is already in auth but it is not in collection (return error migrating users)
  async addUserInCollection() {
    const oldUserEmail = "" // ***********
    const oldUserData: any = particularOldUsers4.find( x=> x.email === oldUserEmail)

    if (oldUserData) {
      const userphotoUrl = oldUserData.photoURL.startsWith('https://firebasestorage.googleapis.com/') ? oldUserData.photoURL : null
      const userInNewModel = {
        avgScore: oldUserData.score ? oldUserData.score : null,
        birthdate: oldUserData.birthdate ? oldUserData.birthdate : null,
        canEnrollParticularCourses: null,
        city: null,
        country: oldUserData.country ? oldUserData.country : oldUserData.paisActual ? oldUserData.paisActual : "",
        courseQty: oldUserData.cantCursos, //
        createdAt: firestoreTimestampToNumberTimestamp(oldUserData.fechaRegistro),
        currentlyWorking: null,
        departmentRef: null,
        displayName: oldUserData.displayName ? oldUserData.displayName : oldUserData.nombreCompleto,
        email: oldUserData.email,
        enterprise: null,
        experience: oldUserData.experience ? oldUserData.experience : oldUserData.anosExperiencia,
        gender: oldUserData.genero,
        hiringDate: oldUserData.hiringDate ? oldUserData.hiringDate : null,
        job: oldUserData.cargo ? oldUserData.cargo : oldUserData.profesion ? oldUserData.profesion : "",
        lastConnection: null,
        mailchimpTag: oldUserData.mailchimpTag,
        name: oldUserData.name ? oldUserData.name : oldUserData.displayName ? oldUserData.displayName : oldUserData.nombreCompleto,
        phoneNumber: oldUserData.phone ? oldUserData.phone : oldUserData.telefono ? oldUserData.telefono : "",
        photoUrl: userphotoUrl,
        profile: null,
        isSystemUser: false,
        role: "student",
        isActive: false,
        stripeId: oldUserData.stripeId ? oldUserData.stripeId : null,
        oldUid: oldUserData.uid,
        uid: oldUserData.uid, // this is going to change with the cloud function
        updatedAt: oldUserData.fechaUltimaAct ? oldUserData.fechaUltimaAct : null,
        certificatesQty: null,
        performance: oldUserData.performance ? oldUserData.performance : null,
        ratingPoints: null,
        studyHours: oldUserData.hoursPerWeek ? oldUserData.hoursPerWeek : null,
        status: SubscriptionClass.STATUS_INACTIVE,
        zipCode: null,
      }        

      await this.afs.collection(User.collection).doc(userInNewModel.uid as string).set(userInNewModel);
      console.log(userInNewModel.email, " migrated")
    }
    else console.log("usuario no encontrado ene este lote")

  }


  async testEmail() {
    console.log("enviando correo")
    const users: User[] = usersData.map((user) => {
        return User.fromJson({
          ...user,
          isSystemUser: false,
          name: user.name.toLowerCase(),
          displayName: user.name.toLowerCase(),
          birthdate: Date.parse(user.birthdate),
          createdAt: Date.parse(user.createdAt),
          updatedAt: Date.parse(user.updatedAt),
          enterprise: null,
          departmentRef: null,
          performance: user.performance as
            | "no plan"
            | "low"
            | "medium"
            | "high"
            | null,
          canEnrollParticularCourses: false,
        });
      }
    );
    for (let user of users) {
      await this.userService.addUserInMigrations(user);
      console.log("correo enviado")
    }
  }


}
