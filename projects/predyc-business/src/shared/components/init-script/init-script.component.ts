import { Component } from "@angular/core";
import { EnterpriseService } from "../../services/enterprise.service";
import { UserService } from "../../services/user.service";
import { Enterprise } from "projects/shared/models/enterprise.model";
import { User, UserJson } from "projects/shared/models/user.model";
import { Category } from "projects/shared/models/category.model";
import { Skill } from "projects/shared/models/skill.model";

import { enterpriseData } from "projects/predyc-business/src/assets/data/enterprise.data";
import { enterpriseDataPredyc } from "projects/predyc-business/src/assets/data/enterprise.data";

import { usersData } from "projects/predyc-business/src/assets/data/users.data";
import { notificationsData } from "projects/predyc-business/src/assets/data/notifications.data";
import { Notification } from "projects/shared/models/notification.model";
import { NotificationService } from "../../services/notification.service";
import {
  AngularFirestore,
  DocumentReference,
} from "@angular/fire/compat/firestore";
import { productsData } from "projects/predyc-business/src/assets/data/product.data";
import { Product } from "projects/shared/models/product.model";
import { License } from "projects/shared/models/license.model";
import { licensesData } from "projects/predyc-business/src/assets/data/license.data";
import { categoriesData } from "projects/predyc-business/src/assets/data/categories.data";
import { CategoryService } from "../../services/category.service";
import { skillsData } from "projects/predyc-business/src/assets/data/skills.data";
import { SkillService } from "../../services/skill.service";
import { Subscription, first, firstValueFrom, lastValueFrom } from "rxjs";
import { departmentsData } from "projects/predyc-business/src/assets/data/departments.data";
import { Department } from "projects/shared/models/department.model";
import { DepartmentService } from "../../services/department.service";
import { profilesData } from "projects/predyc-business/src/assets/data/profiles.data";
import { Profile } from "projects/shared/models/profile.model";
// import { coursesData } from 'projects/predyc-business/src/assets/data/courses.data'

import { Curso } from "projects/shared/models/course.model";
import { Clase } from "projects/shared/models/course-class.model";

import { instructorsData } from "projects/predyc-business/src/assets/data/instructors.data";
import { InstructorsService } from "../../services/instructors.service";
import { CourseService } from "../../services/course.service";
import { Activity } from "projects/shared/models/activity-classes.model";
import { ActivityClassesService } from "../../services/activity-classes.service";
import { CourseClassService } from "../../services/course-class.service";
import { Modulo } from "projects/shared/models/module.model";
import { ModuleService } from "../../services/module.service";
import { coursesData } from "projects/predyc-business/src/assets/data/courses.data";
import { CourseByStudent } from "projects/shared/models/course-by-student.model";

import sampleSize from "lodash/sampleSize";
import { courseCategoryAndSkillsRelation } from "projects/predyc-business/src/assets/data/courseCategoryAndSkillsRelation.data";
import { capitalizeFirstLetter, splitArray } from "projects/shared/utils";
import { ProfileService } from "../../services/profile.service";
import { AngularFireFunctions } from "@angular/fire/compat/functions";
import { environment } from "projects/predyc-business/src/environments/environment";
import { GeneralConfig } from "projects/shared/models/general-config.model";

@Component({
  selector: "app-init-script",
  templateUrl: "./init-script.component.html",
  styleUrls: ["./init-script.component.css"],
})
export class InitScriptComponent {
  constructor(
    private enterpriseService: EnterpriseService,
    private notificationService: NotificationService,
    private afs: AngularFirestore,
    private userService: UserService,
    private categoryService: CategoryService,
    private skillService: SkillService,
    private departmentService: DepartmentService,
    private instructorsService: InstructorsService,
    public courseService: CourseService,
    public activityClassesService: ActivityClassesService,
    public courseClassService: CourseClassService,
    public moduleService: ModuleService,
    public profileService: ProfileService,
    private fireFunctions: AngularFireFunctions
  ) {}

  environment = environment;

  instructors = [];
  fireFunctionSubscription: Subscription;

  async ngOnInit() {}

  ngOnDestroy() {
    if (this.fireFunctionSubscription)
      this.fireFunctionSubscription.unsubscribe();
  }

  async emptyDatabase() {
    this.fireFunctionSubscription = this.fireFunctions
      .httpsCallable("emptyDatabase")({})
      .subscribe({
        next: (result) => true,
        error: (error) => false,
      });
  }

  async initDatabase() {
    // Create Products
    console.log("********* Creating Products *********");
    const products: Product[] = productsData.map((product) => {
      return Product.fromJson(product);
    });
    let productsRef = [];
    for (let product of products) {
      let productRef = this.afs
        .collection<Product>(Product.collection)
        .doc(product.id).ref;
      productsRef.push(productRef);
      await productRef.set({ ...product.toJson() }, { merge: true });
    }
    console.log(`Finished Creating Products`);

    // Create base enterprise
    console.log("********* Creating Enterprise *********");
    const enterprise: Enterprise = Enterprise.fromJson(enterpriseData);
    await this.enterpriseService.addEnterprise(enterprise);
    const enterpriseRef = this.enterpriseService.getEnterpriseRefById(
      enterprise.id
    );
    console.log(`Finished Creating Enterprise`);

    // Create base enterprise
    console.log("********* Creating Enterprise Predyc *********");
    const enterprisePredyc: Enterprise =
      Enterprise.fromJson(enterpriseDataPredyc);
    await this.enterpriseService.addEnterprise(enterprisePredyc);
    const enterprisePredycRef = this.enterpriseService.getEnterpriseRefById(
      enterprisePredyc.id
    );
    console.log(`Finished Creating Enterprise`);

    // Create License
    console.log("********* Creating Licenses *********");
    const licenses: License[] = licensesData.map((license) => {
      return License.fromJson(license);
    });
    let licensesRef = [];
    for (let index = 0; index < licenses.length; index++) {
      const license = licenses[index];
      let licenseRef = this.afs
        .collection<License>(License.collection)
        .doc(license.id).ref;
      licensesRef.push(licenseRef);
      const licenseProductRef = productsRef[index];
      // const licensePriceValue = (await ((licensePriceRef as DocumentReference).get())).data() as Price

      await licenseRef.set(
        {
          ...license.toJson(),
          productRef: licenseProductRef,
          enterpriseRef: enterpriseRef,
        },
        { merge: true }
      );
    }
    console.log(`Finished Creating Licenses`);

    // Create admin and student users
    console.log("********* Creating Users *********");
    const users: User[] = usersData.map((user) => {
      if (user.email == "admin@predyc.com") {
        return User.fromJson({
          ...user,
          isSystemUser: true,
          name: user.name.toLowerCase(),
          displayName: user.name.toLowerCase(),
          birthdate: Date.parse(user.birthdate),
          createdAt: Date.parse(user.createdAt),
          updatedAt: Date.parse(user.updatedAt),
          enterprise: enterprisePredycRef,
          departmentRef: null,
          performance: user.performance as
            | "no plan"
            | "low"
            | "medium"
            | "high"
            | null,
          canEnrollParticularCourses: false,
        });
      } else {
        return User.fromJson({
          ...user,
          isSystemUser: false,
          name: user.name.toLowerCase(),
          displayName: user.name.toLowerCase(),
          birthdate: Date.parse(user.birthdate),
          createdAt: Date.parse(user.createdAt),
          updatedAt: Date.parse(user.updatedAt),
          enterprise: enterpriseRef,
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
    });
    for (let user of users) {
      await this.userService.addUser(user);
    }
    console.log(`Finished Creating Users`);

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
      console.log("new category", category);
    }
    console.log(`Finished Creating Categories`);

    // Create skills
    console.log("********* Creating Skills *********");
    const skills: Skill[] = skillsData.map((skill) => {
      const targetCategory = categories.find(
        (category) =>
          category.name.toLowerCase() === skill.category.toLowerCase()
      );
      const categoryRef = this.categoryService.getCategoryRefById(
        targetCategory.id
      );
      return Skill.fromJson({
        ...skill,
        category: categoryRef,
        enterprise: null,
      });
    });
    for (let skill of skills) {
      await this.skillService.addSkill(skill);
    }
    console.log(`Finished Creating Skills`);

    // Create coursesClasses and courses

    // Create notifications
    console.log("********* Creating Notifications *********");
    const notifications: Notification[] = notificationsData.map(
      (notification) => {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const userRef = this.userService.getUserRefById(randomUser.uid);
        return Notification.fromJson({
          ...notification,
          // readByUser: notification.readByUser,
          userRef: userRef,
          enterpriseRef: enterpriseRef,
        });
      }
    );

    for (let notification of notifications) {
      await this.notificationService.addNotification(notification);
    }
    console.log(`Finished Creating Notification`);

    // Create Departments
    console.log("********* Creating Departments *********");

    departmentsData.forEach(async (department) => {
      // console.log(department)
      const departmentReady = new Department(
        department.id,
        department.name,
        enterpriseRef,
        null
      );
      await this.departmentService.add(departmentReady);
    });
    console.log(`Finished Creating Departments`);

    // Create validation tests
    // console.log('********* Creating Validation Tests *********')
    // console.log(`Finished Creating Validation Tests`)

    // Create global collection
    console.log("********* Creating Global collection *********");

    // // Create Instructors (OLD)
    console.log("********* Creating Instructors *********");
    for (let i = 0; i < instructorsData.length; i++) {
      const instructor = instructorsData[i];
      instructor["enterpriseRef"] = null;
      await this.instructorsService.addInstructor(instructor);
      this.instructors.push(instructor);
    }
    console.log(`Finished Creating Instructors`, this.instructors);

    console.log("********* Creating Courses *********");
    await this.uploadCursosLegacy();
    console.log(`Finished Creating Courses`);

    try {
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for 5 seconds
      const users: User[] = await firstValueFrom(
        this.afs.collection<User>(User.collection).valueChanges()
      );
      if (users && users.length > 0) {
        console.log("users", users);
        const kevinUser = users.find(
          (user) => user.name === "kevin grajales predyc"
        );
        const lilianaUser = users.find(
          (user) => user.name === "liliana giraldo predyc"
        );
        // console.log("Kevin:", kevinUser);
        // console.log("Liliana:", lilianaUser);
        await this.afs
          .collection(GeneralConfig.collection)
          .doc(GeneralConfig.doc)
          .set({
            salesManagerRef: this.userService.getUserRefById(lilianaUser.uid),
            accountManagerRef: this.userService.getUserRefById(kevinUser.uid),
            allowAIChatFeature: true
          });
      }
    } catch (error) {
      console.error("Hubo un error al obtener los usuarios:", error);
    }
    console.log(`Finished Creating Global collection`);

    // Create profiles
    console.log("********* Creating Profiles *********");
    await this.addProfileV2();
    console.log(`Finished Creating Profiles`);

    console.log(
      "----------------------- End of init-script -----------------------"
    );
  }

  async uploadCursosLegacy() {
    let jsonData = coursesData.slice(0, 5);
    // jsonData = coursesData
    console.log("cursos a cargar", jsonData);
    // Now you can use the jsonData object locally

    jsonData = jsonData.filter((x) => x?.publicado);
    console.log("cursos Insert", jsonData);
    for (let index = 0; index < jsonData.length; index++) {
      let curso = jsonData[index];
      let cursoIn = new Curso();
      cursoIn = structuredClone(cursoIn);
      let courseRef = this.afs.collection<Curso>(Curso.collection).doc().ref;
      cursoIn.id = courseRef.id;
      cursoIn.descripcion = curso.descripcion;
      cursoIn.instructorNombre = curso.instructorNombre;
      // cursoIn.instructorFoto = curso.instructorFoto
      cursoIn.imagen_instructor = curso.instructorFoto;
      cursoIn.instructor = curso.instructorNombre;
      cursoIn.imagen = curso.foto;
      cursoIn.foto = curso.foto;
      cursoIn.idOld = curso.id;
      //cursoIn.descripcion = curso.descripcion
      //cursoIn.idioma = curso.idioma no se tenia anteriormete
      //cursoIn.instructorResumen = curso.instructorResumen
      cursoIn.nivel = curso.nivel;
      cursoIn.titulo = capitalizeFirstLetter(curso.titulo.trim().toLowerCase());
      cursoIn.duracion = curso.duracion;
      let instructor = this.instructors.find(
        (x) => x.idOld == curso.instructorId
      );
      console.log("Instructor", instructor, this.instructors);
      let instructorRef = await this.afs
        .collection<any>("instructors")
        .doc(instructor.id).ref;
      cursoIn.instructorRef = instructorRef;
      cursoIn.resumen_instructor = instructor.resumen;
      //cursoIn.descripcion = instructor.descripcion
      //console.log('cursoIn',curso,cursoIn)
      //let competenciaTest = await this.afs.collection<any>('skill').doc('AjnLM3sTWFnprVzRxyZ7').ref;
      const skillsRef = [];
      const courseObj = courseCategoryAndSkillsRelation.find(
        (item) =>
          item["Cursos"].toLowerCase() === curso.titulo.toLowerCase().trim()
      );
      if (courseObj) {
        for (let skill of [
          courseObj["Competencia 1"],
          courseObj["Competencia 2"],
          courseObj["Competencia 3"],
        ]) {
          if (skill) {
            let skillName =
              skill.split(" ").length > 1
                ? capitalizeFirstLetter(skill.toLowerCase())
                : skill;
            const competenciaTest = await this.getSkillRefByName(skillName);
            skillsRef.push(competenciaTest);
          }
        }
      } else {
        console.log("Titulo no encontrado", curso.titulo.toLowerCase());
      }
      cursoIn.skillsRef = skillsRef;
      await this.courseService.saveCourse(cursoIn);
      console.log("curso save", cursoIn);
      let clasesData = curso.clases;
      console.log("clasesData", clasesData);
      let modulos = clasesData.modulos;
      let clases = clasesData.clases;
      let actividades = curso.actividades;

      //console.log('modulos',modulos)
      //console.log('clases',clases)

      modulos.sort(function (a, b) {
        var keyA = new Date(a.numero),
          keyB = new Date(b.numero);
        // Compare the 2 dates
        if (keyA < keyB) return -1;
        if (keyA > keyB) return 1;
        return 0;
      });

      console.log("modulos crear ordenados", modulos);

      for (let index = 0; index < modulos.length; index++) {
        const modulo = modulos[index];
        let clasesModulo = clases.filter((x) => x.modulo == modulo.numero);
        let arrayClassesRef = [];
        //console.log('detalles modulo clases',modulo,clasesModulo)
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

          console.log("clase save", clase);
          if (clase.tipo == "actividad") {
            let idActividad = clase.idVideo;
            let actividadIn = actividades.find((x) => x.id == idActividad);
            if (actividadIn) {
              let actividad = new Activity();
              actividad.type = "regular";
              actividad.title = actividadIn.title;
              actividad.createdAt = actividadIn.createdAt;
              actividad.coursesRef = [courseRef];
              // actividad.description = actividadIn.titulo
              actividad.claseRef = claseRef;
              console.log("actividadIn", actividad);
              await this.activityClassesService.saveActivity(actividad);
              let preguntas = actividadIn.questions;
              for (let index = 0; index < preguntas.length; index++) {
                const pregunta = {
                  ...preguntas[index],
                  type: preguntas[index].type.value,
                };
                this.activityClassesService.saveQuestion(
                  pregunta,
                  actividad.id
                );
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
        console.log("module save", module);
        await this.moduleService.saveModulo(module, courseRef.id);
      }
      let test = curso.actividades.find((x) => x.isTest); // se llama asi porque es un examen
      if (test) {
        let examen = new Activity();
        examen.type = "test";
        examen.title = test.title;
        examen.createdAt = test.createdAt;
        examen.coursesRef = [courseRef];
        console.log("examen", examen);
        await this.activityClassesService.saveActivity(examen);
        let preguntas = test.questions;
        for (let index = 0; index < preguntas.length; index++) {
          const pregunta = {
            ...preguntas[index],
            type: preguntas[index].type.value,
          };
          await this.activityClassesService.saveQuestion(pregunta, examen.id);
        }
      }
      console.log(` ----- Course ${index} Added ----- `);
    }
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
              console.log(
                "No skill found with the given name and enterprise null"
              );
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

  // Create profiles and add reference to user
  async addProfiles() {
    const enterpriseSnapshot = await firstValueFrom(
      this.afs.collection(Enterprise.collection).get()
    );
    const enterpriseRefs = enterpriseSnapshot.docs.map((doc) => doc.ref);

    // Profiles will be splitted equally between each existing enterprise
    const splittedArrays = splitArray(profilesData, enterpriseRefs.length);
    console.log("splittedArrays", splittedArrays);

    let enterpriseIndex = 0;
    for (const enterpriseLoop of enterpriseRefs) {
      const enterprise = (await enterpriseLoop.get()).data() as Enterprise;

      // Data for this enterprise
      let userIndex = 0;
      const userSnapshot = await firstValueFrom(
        this.afs
          .collection(User.collection, (ref) =>
            ref.where("enterprise", "==", enterpriseLoop)
          )
          .get()
      );
      const userRefs = userSnapshot.docs.map((doc) => doc.ref);

      const enterpriseMatch = await firstValueFrom(
        this.afs
          .collection<Curso>(Curso.collection, (ref) =>
            ref.where("enterpriseRef", "==", enterpriseLoop)
          )
          .valueChanges({ idField: "id" })
      );

      // Query to get courses where enterpriseRef is empty
      const enterpriseEmpty = await firstValueFrom(
        this.afs
          .collection<Curso>(Curso.collection, (ref) =>
            ref.where("enterpriseRef", "==", null)
          )
          .valueChanges({ idField: "id" })
      );

      const courses = [...enterpriseMatch, ...enterpriseEmpty];

      for (const profile of splittedArrays[enterpriseIndex]) {
        const profileRef = this.afs.collection(Profile.collection).doc();
        const id = profileRef.ref.id;
        // Obtener las referencias correspondientes y avanzar los índices
        const currentUserRef = userRefs[userIndex % userRefs.length];
        const currentEnterpriseRef = enterpriseLoop;

        const selectedCourses = sampleSize(courses, 4);
        const coursesRef = selectedCourses.map((course) => {
          return this.courseService.getCourseRefById(course.id);
        });

        profile.permissions = enterprise.permissions;
        profile.permissions.hasDefaultPermissions = true;
        await profileRef.set({
          ...profile,
          id: id,
          enterpriseRef: currentEnterpriseRef,
          coursesRef,
        });
        // console.log("id", id);

        // Actualizamos el documento actual del Usuario
        const userSnap = await currentUserRef.get();
        if (userSnap.exists) {
          let currentUser: any = userSnap.data();
          currentUser.profile = profileRef.ref;
          currentUser.studyHours = profile.hoursPerMonth;
          await this.userService.editUser(currentUser as UserJson);
          // await currentUserRef.update({
          //   profile: profileRef.ref
          // });
        }

        // Creamos doc que relaciona los cursos del perfil con el estudiante
        await this.addCourseByStudent(
          coursesRef,
          currentUserRef,
          selectedCourses,
          profile.hoursPerMonth
        );
        // Incrementar los índices para el siguiente profile
        userIndex++;
      }
      enterpriseIndex++;
    }
  }

  test() {
    this.addProfileV2();
  }

  async addProfileV2() {
    // Query to get courses where enterpriseRef is empty
    const enterpriseEmpty = await firstValueFrom(
      this.afs
        .collection<Curso>(Curso.collection, (ref) =>
          ref.where("enterpriseRef", "==", null)
        )
        .valueChanges({ idField: "id" })
    );

    const courses = [...enterpriseEmpty];

    for (const profile of profilesData) {
      const profileRef = this.afs.collection(Profile.collection).doc();
      const id = profileRef.ref.id;

      const selectedCourses = [];
      profile.coursesRef.forEach((courseName) => {
        const targetCourse = courses.find(
          (course) =>
            course.titulo.toLowerCase().trim() ===
            courseName.toLowerCase().trim()
        );
        if (targetCourse) selectedCourses.push(targetCourse);
        else
          console.log(
            `Perfil ${profile.name} curso no encontrado ${courseName}`
          );
      });
      const coursesRef = selectedCourses.map((course, idx) => {
        return {
          ...this.courseService.getCourseRefById(course.id),
          studyPlanOrder: idx + 1,
        };
      });

      profile.permissions;
      await profileRef.set({
        ...profile,
        id: id,
        coursesRef,
      });
      // console.log("id", id);
    }
  }

  async addCourseByStudent(
    coursesRefs: DocumentReference[],
    userRef: DocumentReference,
    selectedCourses: (Curso & { id: string })[],
    hoursPerMonth: number
  ) {
    let now = new Date();
    let hoy = +new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let dateStartPlan: number;
    let dateEndPlan: number;
    for (let i = 0; i < coursesRefs.length; i++) {
      // -------- this is just for test data. Substitute for the correct dates calculation
      const courseData = selectedCourses.find(
        (courseData) => courseData.id === coursesRefs[i].id
      );
      const courseDuration = courseData.duracion;
      dateStartPlan = dateEndPlan ? dateEndPlan : hoy;
      dateEndPlan = this.calculatEndDatePlan(
        dateStartPlan,
        courseDuration,
        hoursPerMonth
      );
      // -------
      await this.courseService.saveCourseByStudent(
        coursesRefs[i],
        userRef,
        new Date(dateStartPlan),
        new Date(dateEndPlan),
        false,
        i
      );
    }
    console.log("Courses by students created");
  }

  calculatEndDatePlan(
    startDate: number,
    courseDuration: number,
    hoursPermonth: number
  ): number {
    const monthDays = this.getDaysInMonth(startDate);
    return (
      startDate +
      24 *
        60 *
        60 *
        1000 *
        Math.ceil(courseDuration / 60 / (hoursPermonth / monthDays))
    );
  }

  getDaysInMonth(timestamp: number) {
    const date = new Date(timestamp);
    // Create a new date object for the first day of the next month
    const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    // Subtract one day to get the last day of the required month
    nextMonth.setDate(nextMonth.getDate() - 1);
    // Return the day of the month, which is the number of days in that month
    return nextMonth.getDate();
  }
}
