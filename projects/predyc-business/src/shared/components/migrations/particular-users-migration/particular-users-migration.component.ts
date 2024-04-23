import { Component } from '@angular/core';
import { capitalizeFirstLetter, firestoreTimestampToNumberTimestamp } from 'projects/shared/utils';
import { Subscription as SubscriptionClass } from "projects/shared/models/subscription.model";
import { User, UserJson } from 'projects/shared/models/user.model';
import { UserService } from '../../../services/user.service';
import { CourseClassService } from '../../../services/course-class.service';
import { ModuleService } from '../../../services/module.service';
import { EnterpriseService } from '../../../services/enterprise.service';
import { particularOldUsers1 } from '../old data/particular users/usuarios/particular-usuarios.data1';
import { Curso } from 'projects/shared/models/course.model';
import { AngularFirestore, DocumentReference, QuerySnapshot } from '@angular/fire/compat/firestore';
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
import { particularOldCursosInscritos1 } from '../old data/particular users/cursos-inscritos/particular-cursosInscritos.data1';
import { CourseByStudent, CourseByStudentJson } from 'projects/shared/models/course-by-student.model';
import { ClassByStudent, ClassByStudentJson } from 'projects/shared/models/class-by-student.model';
import { coursesData } from 'projects/predyc-business/src/assets/data/courses.data';


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

  ngOnInit() {
    this.getCourses().subscribe((courses) => {
      this.allCoursesData = courses;
      console.log("this.allCoursesData", this.allCoursesData);
    });

    this.afs
      .collection<User>(User.collection)
      .valueChanges()
      .subscribe((users) => {
        this.allCurrentUsersData = users;
        console.log("this.allCurrentusersData", this.allCurrentUsersData);
      });
  }
  
  async migrateUsers() {
    const oldUsersData: any[] = particularOldUsers1;
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

    for (let user of usersInNewModel) {
      await this.userService.addUserInMigrations(User.fromJson(user)); // try to create users with batches
    } 
    console.log("ALL USERS CREATED");
  }

  async migrateCoursesByStudent() {
    console.log("migrating coursesbyStudent")
    const snapshot = await firstValueFrom(this.afs.collection(Curso.collection).get());
    if (snapshot.empty) await this.migrateCoursesAndClasses();

    const oldCoursesData: any[] = particularOldCursosInscritos1;

    if (Object.keys(this.coursesIdMap).length === 0) {
      this.coursesIdMap = await this.courseService.getCourseIdMappings();
    } 

    // console.log("coursesIdMap", this.coursesIdMap)

    const allCoursesByStudent: CourseByStudentJson[] = [];

    const coursesByStudent: CourseByStudentJson[] = oldCoursesData
      .sort((a, b) => a.fechaInscripcion - b.fechaInscripcion)
      .map((oldCourseData, idx) => {
        if (!this.coursesIdMap[oldCourseData.cursoId]) {
          console.log(" XXXXXXXXXXXXXXXXXXXXX this course doesnt exist in new data base XXXXXXXXXXXXXXXXXXXXX")
          return null
        }
        else {
          // const courseOldData = oldCoursesData.find((x) => x.cursoId === studyPlanCourse.cursoId && x.usuarioId === oldUser.uid);
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
    const oldCoursesData = particularOldCursosInscritos1;
    const allClassesByStudent: ClassByStudentJson[] = [];

    if (Object.keys(this.coursesIdMap).length === 0) {
      this.coursesIdMap = await this.courseService.getCourseIdMappings();
    } 

    for (let oldCourse of oldCoursesData) {
      if (oldCourse.clases) {
        const olCourseClasses = oldCourse.clases.sort((a, b) => a.numero - b.numero);
        console.log("--- ", oldCourse.cursoId);
        if (!this.coursesIdMap[oldCourse.cursoId]) {
          console.log(" XXXXXXXXXXXXXXXXXXXXX this course doesnt exist in new data base XXXXXXXXXXXXXXXXXXXXX")
          continue
        }

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



  async migrateCoursesAndClasses() {
    // Create categories
    console.log("********* Creating Categories *********");
    const categories: Category[] = categoriesData.map((category) => {
      return Category.fromJson({
        ...category,
        //enterprise: enterpriseRef
      });
    });
    // console.log("categories", categories)
    for (let category of categories) {
      await this.categoryService.addCategory(category);
      // console.log('new category',category)
    }
    // console.log(`Finished Creating Categories`)

    // Create skills
    console.log("********* Creating Skills *********");
    const skills: Skill[] = skillsData.map((skill) => {
      const targetCategory = categories.find((category) => category.name.toLowerCase() === skill.category.toLowerCase());
      const categoryRef = this.categoryService.getCategoryRefById(targetCategory.id);
      return Skill.fromJson({
        ...skill,
        category: categoryRef,
        enterprise: null,
      });
    });
    for (let skill of skills) {
      await this.skillService.addSkill(skill);
    }
    // console.log(`Finished Creating Skills`)

    // Create Instructors (OLD)
    console.log("********* Creating Instructors *********");
    for (let i = 0; i < instructorsData.length; i++) {
      const instructor = instructorsData[i];
      instructor["enterpriseRef"] = null;
      await this.instructorsService.addInstructor(instructor);
      this.instructors.push(instructor);
    }
    // console.log(`Finished Creating Instructors`, this.instructors);

    console.log("********* Creating Courses *********");
    await this.uploadCursosLegacy();
    console.log(`Finished Creating Courses`);
  }

  async uploadCursosLegacy() {
    let jsonData = coursesData.slice(0, 15);
    jsonData = coursesData;
    // console.log('cursos a cargar',jsonData)
    // Now you can use the jsonData object locally

    jsonData = jsonData.filter((x) => x?.publicado);
    // console.log('cursos Insert',jsonData)
    for (let index = 0; index < jsonData.length; index++) {
      let curso = jsonData[index];
      let cursoIn = new Curso();
      cursoIn = structuredClone(cursoIn);
      let courseRef = this.afs.collection<Curso>(Curso.collection).doc().ref;
      cursoIn.id = courseRef.id;
      cursoIn.descripcion = curso.descripcion;
      cursoIn.instructorNombre = curso.instructorNombre;
      cursoIn.imagen_instructor = curso.instructorFoto;
      cursoIn.instructor = curso.instructorNombre;
      cursoIn.imagen = curso.foto;
      cursoIn.foto = curso.foto;
      cursoIn.idOld = curso.id;
      cursoIn.nivel = curso.nivel;
      cursoIn.titulo = capitalizeFirstLetter(curso.titulo.trim().toLowerCase());
      cursoIn.duracion = curso.duracion;
      let instructor = this.instructors.find((x) => x.idOld == curso.instructorId);
      // console.log('Instructor',instructor,this.instructors)
      let instructorRef = await this.afs.collection<any>("instructors").doc(instructor.id).ref;
      cursoIn.instructorRef = instructorRef;
      cursoIn.resumen_instructor = instructor.resumen;
      const skillsRef = [];
      const courseObj = courseCategoryAndSkillsRelation.find((item) => item["Cursos"].toLowerCase() === curso.titulo.toLowerCase().trim());
      if (courseObj) {
        for (let skill of [courseObj["Competencia 1"], courseObj["Competencia 2"], courseObj["Competencia 3"]]) {
          if (skill) {
            let skillName = skill.split(" ").length > 1 ? capitalizeFirstLetter(skill.toLowerCase()) : skill;
            const competenciaTest = await this.getSkillRefByName(skillName);
            skillsRef.push(competenciaTest);
          }
        }
      } else {
        console.log("Titulo no encontrado", curso.titulo.toLowerCase());
      }
      cursoIn.skillsRef = skillsRef;
      await this.courseService.saveCourse(cursoIn);

      // ---------- CLASES
      let clasesData = curso.clases;
      let modulos = clasesData.modulos;
      let clases = clasesData.clases;
      let actividades = curso.actividades;

      modulos.sort(function (a, b) {
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
        let clasesModulo = clases.filter((x) => x.modulo == modulo.numero);
        let arrayClassesRef = [];
        for (let index = 0; index < clasesModulo.length; index++) {
          const clase = clasesModulo[index];
          let claseLocal = new Clase();
          let claseRef = this.afs.collection<Clase>(Clase.collection).doc().ref;
          arrayClassesRef.push(claseRef);
          claseLocal.id = claseRef.id;
          claseLocal.HTMLcontent = clase.HTMLcontent;
          claseLocal.archivos = clase.archivos.map((archivo) => ({
            // Usando map aquí para transformar la estructura del archivo.
            id: Date.now(),
            nombre: archivo.nombre,
            size: archivo.size,
            type: archivo.type,
            url: archivo.url,
          }));
          claseLocal.tipo = clase.tipo;
          claseLocal.vimeoId1 = clase.idVideo;
          claseLocal.instructorRef = instructorRef;
          claseLocal.duracion = clase.duracion;
          claseLocal.descripcion = clase.descripcion;
          claseLocal.titulo = clase.titulo;
          claseLocal.date = clase.id;

          // console.log('clase save',clase)
          if (clase.tipo == "actividad") {
            let idActividad = clase.idVideo;
            let actividadIn = actividades.find((x) => x.id == idActividad);
            if (actividadIn) {
              let actividad = new Activity();
              actividad.type = "regular";
              actividad.title = actividadIn.title;
              actividad.createdAt = actividadIn.createdAt;
              actividad.coursesRef = [courseRef];
              actividad.claseRef = claseRef;
              await this.activityClassesService.saveActivity(actividad);
              let preguntas = actividadIn.questions;
              for (let index = 0; index < preguntas.length; index++) {
                const pregunta = {
                  ...preguntas[index],
                  type: preguntas[index].type.value,
                };
                this.activityClassesService.saveQuestion(pregunta, actividad.id);
              }
            }
          }
          await this.courseClassService.saveClass(claseLocal);
        }
        let idRef = this.afs.collection<Modulo>(Modulo.collection).doc().ref.id;
        //console.log('modulo',modulo)
        let module = new Modulo();
        module.id = idRef;
        module.numero = modulo.numero;
        module.titulo = modulo.titulo;
        module.clasesRef = arrayClassesRef;
        await this.moduleService.saveModulo(module, courseRef.id);
      }

      console.log(` ----- Course ${index} Added ----- `);
    }
    console.log("All courses Added")
  }

  getSkillRefByName(skillName): Promise<any | null> {
    return new Promise(async (resolve, reject) => {
      await this.afs
        .collection<any>(
          "skill",
          (ref) => ref.where("name", "==", skillName)
          //  .where('enterprise', '==', null)
        )
        .get()
        .subscribe(
          (querySnapshot) => {
            if (!querySnapshot.empty) {
              // Resolving with the first document reference
              resolve(querySnapshot.docs[0].ref);
            } else {
              console.log("No skill found with the given name and enterprise null");
              resolve(null);
            }
          },
          (error) => {
            console.error("Error fetching skill:", error);
            reject(error);
          }
        );
    });
  }

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


}
