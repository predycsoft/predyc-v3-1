import { Component } from '@angular/core';
import { EnterpriseService } from '../../services/enterprise.service';
import { UserService } from '../../services/user.service';
import { Enterprise } from '../../models/enterprise.model';
import { User, UserJson } from '../../models/user.model';
import { Category } from '../../models/category.model'
import { Skill } from '../../models/skill.model';

import { enterpriseData } from 'src/assets/data/enterprise.data'
import { enterpriseDataPredyc } from 'src/assets/data/enterprise.data'


import { usersData } from 'src/assets/data/users.data'
import { notificationsData } from 'src/assets/data/notifications.data'
import { Notification } from '../../models/notification.model';
import { NotificationService } from '../../services/notification.service';
import { Coupon } from '../../models/coupon.model';
import { couponsData } from 'src/assets/data/coupon.data';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { productsData } from 'src/assets/data/product.data';
import { Product } from '../../models/product.model';
import { Price } from '../../models/price.model';
import { pricesData } from 'src/assets/data/price.data';
import { License } from '../../models/license.model';
import { licensesData } from 'src/assets/data/license.data';
import { categoriesData } from 'src/assets/data/categories.data';
import { CategoryService } from '../../services/category.service';
import { skillsData } from 'src/assets/data/skills.data';
import { SkillService } from '../../services/skill.service';
import { first, firstValueFrom, lastValueFrom } from 'rxjs';
import { departmentsData } from 'src/assets/data/departments.data'
import { Department } from '../../models/department.model';
import { DepartmentService } from '../../services/department.service';
import { profilesData } from 'src/assets/data/profiles.data';
import { Profile } from '../../models/profile.model';
// import { coursesData } from 'src/assets/data/courses.data'

import { Curso } from 'src/app/shared/models/course.model';
import { Clase } from "../../../shared/models/course-class.model"

import {instructorsData} from 'src/assets/data/instructors.data'
import { InstructorsService } from '../../services/instructors.service';
import { CourseService } from '../../services/course.service';
import { Activity} from '../../../shared/models/activity-classes.model';
import { ActivityClassesService } from '../../services/activity-classes.service';
import { CourseClassService } from '../../services/course-class.service';
import { Modulo } from '../../../shared/models/module.model';
import { ModuleService } from '../../services/module.service';
import { coursesData } from 'src/assets/data/courses.data';
import { CourseByStudent } from '../../models/course-by-student.model';

import sampleSize from 'lodash/sampleSize';
import { courseCategoryAndSkillsRelation } from 'src/assets/data/courseCategoryAndSkillsRelation.data'
import { capitalizeFirstLetter } from 'src/app/shared/utils'

@Component({
  selector: 'app-init-script',
  templateUrl: './init-script.component.html',
  styleUrls: ['./init-script.component.css']
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
    public courseService : CourseService,
    public activityClassesService:ActivityClassesService,
    public courseClassService: CourseClassService,
    public moduleService: ModuleService,

  ) {}

  instructors = [];


  async ngOnInit() {}

  async initDatabase() {
    // Create Coupons
    console.log('********* Creating Coupons *********')
    const coupons: Coupon[] = couponsData.map(coupon => {
      return Coupon.fromJson(coupon)
    })
    let couponsRef = []
    for (let coupon of coupons ) {
      let couponRef = this.afs.collection<Coupon>(Coupon.collection).doc(coupon.id).ref;
      couponsRef.push(couponRef)
      await couponRef.set({...coupon.toJson()}, { merge: true });
    }
    console.log(`Finished Creating Coupons`)

    // Create Products
    console.log('********* Creating Products *********')
    const products: Product[] = productsData.map(product => {
      return Product.fromJson(product)
    })
    let productsRef = []
    for (let product of products) {
      let productRef = this.afs.collection<Product>(Product.collection).doc(product.id).ref;
      productsRef.push(productRef)
      await productRef.set({...product.toJson()}, { merge: true });
    }
    console.log(`Finished Creating Products`)

    // Create Prices
    console.log('********* Creating Prices *********')
    const prices: Price[] = pricesData.map(price => {
      return Price.fromJson(price)
    })
    let pricesRef = []

    for (let index = 0; index < prices.length; index++) {
    const price = prices[index];
    let priceRef = this.afs.collection<Price>(Price.collection).doc(price.id).ref;
    pricesRef.push(priceRef)
    let productRef = index <= productsRef.length - 1 ? productsRef[index] : productsRef[index - (productsRef.length)]
    await priceRef.set(
      {
        ...price.toJson(), 
        coupon: couponsRef[index],
        product: productRef
      }, { merge: true });
    }
    console.log(`Finished Creating Prices`)

    // Create base enterprise
    console.log('********* Creating Enterprise *********')
    const enterprise: Enterprise = Enterprise.fromJson(enterpriseData)
    await this.enterpriseService.addEnterprise(enterprise)
    const enterpriseRef = this.enterpriseService.getEnterpriseRefById(enterprise.id)
    console.log(`Finished Creating Enterprise`)

    // Create base enterprise
    console.log('********* Creating Enterprise Predyc *********')
    const enterprisePredyc: Enterprise = Enterprise.fromJson(enterpriseDataPredyc)
    await this.enterpriseService.addEnterprise(enterprisePredyc)
    const enterprisePredycRef = this.enterpriseService.getEnterpriseRefById(enterprisePredyc.id)
    console.log(`Finished Creating Enterprise`)

    // Create License
    console.log('********* Creating Licenses *********')
    const licenses: License[] = licensesData.map(license => {
      return License.fromJson(license)
    })
    let licensesRef = []
    for (let index = 0; index < licenses.length; index++) {
      const license = licenses[index];
      let licenseRef = this.afs.collection<License>(License.collection).doc(license.id).ref;
      licensesRef.push(licenseRef)
      const licensePriceRef = pricesRef[index] 
      const licensePriceValue = (await ((licensePriceRef as DocumentReference).get())).data() as Price
      const couponPriceRef = licensePriceValue.coupon

      await licenseRef.set(
        {
          ...license.toJson(),
          priceRef: licensePriceRef,
          couponRef: couponPriceRef,
          enterpriseRef: enterpriseRef
        }, {merge: true}
      )
    }
    console.log(`Finished Creating Licenses`)
  
    // Create admin and student users
    console.log('********* Creating Users *********')
    const users: User[] = usersData.map(user => { 
      if(user.email == 'admin@predyc.com'){ 
        return User.fromJson({
          ...user,
          adminPredyc:true,
          name: user.name.toLowerCase(),
          displayName: user.name.toLowerCase(),
          birthdate: Date.parse(user.birthdate),
          createdAt: Date.parse(user.createdAt),
          updatedAt: Date.parse(user.updatedAt),
          enterprise: enterprisePredycRef,
          departmentRef: null,
          performance: user.performance as 'no plan' | 'low' | 'medium' | 'high' | null
        })
      }
      else{
        return User.fromJson({
          ...user,
          adminPredyc:false,
          name: user.name.toLowerCase(),
          displayName: user.name.toLowerCase(),
          birthdate: Date.parse(user.birthdate),
          createdAt: Date.parse(user.createdAt),
          updatedAt: Date.parse(user.updatedAt),
          enterprise: enterpriseRef,
          departmentRef: null,
          performance: user.performance as 'no plan' | 'low' | 'medium' | 'high' | null
        })
      }
    })
    for (let user of users) {
      await this.userService.addUser(user)
    }
    console.log(`Finished Creating Users`)

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
      console.log('new category',category)
    }
    console.log(`Finished Creating Categories`)

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
    console.log(`Finished Creating Skills`)
  
    // Create coursesClasses and courses

    // Create notifications 
    console.log('********* Creating Notifications *********')
    const notifications: Notification[] = notificationsData.map(notification => {
      const randomUser = users[Math.floor(Math.random()*users.length)];
      const userRef = this.userService.getUserRefById(randomUser.uid)
      return Notification.fromJson({
        ...notification,
        // readByUser: notification.readByUser,
        userRef: userRef,
        enterpriseRef: enterpriseRef
      })
    })

    for (let notification of notifications) {
      await this.notificationService.addNotification(notification)
    }
    console.log(`Finished Creating Notification`)

    // Create Departments 
    console.log('********* Creating Departments *********')

    departmentsData.forEach(async department => {
      // console.log(department)
      const departmentReady = new Department(department.id, department.name, enterpriseRef)
      await this.departmentService.add(departmentReady)
    });
    console.log(`Finished Creating Departments`)

    // Create validation tests
    // console.log('********* Creating Validation Tests *********')
    // console.log(`Finished Creating Validation Tests`)

    // Create global collection
    console.log('********* Creating Global collection *********')


    // // Create Instructors (OLD) 
    console.log('********* Creating Instructors *********');
    for (let i = 0; i < instructorsData.length; i++) {
      const instructor = instructorsData[i];
      await this.instructorsService.addInstructor(instructor);
      this.instructors.push(instructor);
    }
    console.log(`Finished Creating Instructors`, this.instructors);

    console.log('********* Creating Courses *********');
    await this.uploadCursosLegacy();
    console.log(`Finished Creating Courses`);

    try {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds
      const users: User[] = await firstValueFrom(this.afs.collection<User>(User.collection).valueChanges());
      if (users && users.length > 0) {
        console.log("users", users);
        const kevinUser = users.find((user) => user.name === "kevin grajales predyc"); 
        const lilianaUser = users.find((user) => user.name === "liliana giraldo predyc"); 
        console.log("Kevin:", kevinUser);
        console.log("Liliana:", lilianaUser);
        await this.afs.collection("general").doc("config").set({
          salesManagerRef: this.userService.getUserRefById(lilianaUser.uid),
          accountManagerRef: this.userService.getUserRefById(kevinUser.uid),
        });
      }
    } catch (error) {
      console.error("Hubo un error al obtener los usuarios:", error);
    }
    console.log(`Finished Creating Global collection`)

    // Create profiles
    console.log('********* Creating Profiles *********')
    await this.addProfiles()
    console.log(`Finished Creating Profiles`)

    console.log('----------------------- End of init-script -----------------------')
  }


  async uploadCursosLegacy() {

    let jsonData = coursesData.slice(0, 5)
    // jsonData = coursesData
    console.log('cursos a cargar',jsonData)
    // Now you can use the jsonData object locally

    jsonData = jsonData.filter(x=>x?.publicado)
    console.log('cursos Insert',jsonData)
    for (let index = 0; index < jsonData.length; index++) {
      let curso = jsonData[index]
      let cursoIn = new Curso
      cursoIn = structuredClone(cursoIn)
      let courseRef = await this.afs.collection<Curso>(Curso.collection).doc().ref;
      cursoIn.id = courseRef.id
      cursoIn.descripcion = curso.descripcion
      cursoIn.instructorNombre = curso.instructorNombre
      // cursoIn.instructorFoto = curso.instructorFoto
      cursoIn.imagen_instructor = curso.instructorFoto
      cursoIn.instructor = curso.instructorNombre
      cursoIn.imagen = curso.foto
      cursoIn.foto = curso.foto
      cursoIn.idOld = curso.id
      //cursoIn.descripcion = curso.descripcion
      //cursoIn.idioma = curso.idioma no se tenia anteriormete 
      //cursoIn.instructorResumen = curso.instructorResumen
      cursoIn.nivel = curso.nivel
      cursoIn.titulo = capitalizeFirstLetter(curso.titulo.trim().toLowerCase())
      cursoIn.duracion = curso.duracion
      let instructor = this.instructors.find(x=> x.idOld == curso.instructorId)
      console.log('Instructor',instructor,this.instructors)
      let instructorRef = await this.afs.collection<any>('instructors').doc(instructor.id).ref;
      cursoIn.instructorRef = instructorRef
      cursoIn.resumen_instructor = instructor.resumen
      //cursoIn.descripcion = instructor.descripcion
      //console.log('cursoIn',curso,cursoIn)
      //let competenciaTest = await this.afs.collection<any>('skill').doc('AjnLM3sTWFnprVzRxyZ7').ref;
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
      console.log('curso save',cursoIn)
      let clasesData = curso.clases;
      console.log('clasesData',clasesData)
      let modulos = clasesData.modulos
      let clases = clasesData.clases
      let actividades = curso.actividades

      //console.log('modulos',modulos)
      //console.log('clases',clases)

      modulos.sort(function(a, b) {
        var keyA = new Date(a.numero),
          keyB = new Date(b.numero);
        // Compare the 2 dates
        if (keyA < keyB) return -1;
        if (keyA > keyB) return 1;
        return 0;
      });

      console.log('modulos crear ordenados',modulos)

      for (let index = 0; index < modulos.length; index++) {
        const modulo = modulos[index];
        let clasesModulo = clases.filter(x=> x.modulo == modulo.numero)
        let arrayClassesRef = []
        //console.log('detalles modulo clases',modulo,clasesModulo)
        for (let index = 0; index < clasesModulo.length; index++) {
          const clase = clasesModulo[index];
          let claseLocal = new Clase;
          let claseRef = await this.afs.collection<Clase>(Clase.collection).doc().ref;
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

          console.log('clase save',clase)
          if(clase.tipo == 'actividad'){
            let idActividad = clase.idVideo
            let actividadIn = actividades.find(x=> x.id == idActividad)
            if(actividadIn){
              let actividad = new Activity
              actividad.type = 'regular'
              actividad.title = actividadIn.title
              actividad.createdAt = actividadIn.createdAt
              actividad.coursesRef = [courseRef]
              // actividad.description = actividadIn.titulo
              actividad.claseRef = claseRef
              console.log('actividadIn', actividad)
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
        let idRef = await this.afs.collection<Modulo>(Modulo.collection).doc().ref.id;
        //console.log('modulo',modulo)
        let module = new Modulo;
        module.id = idRef;
        module.numero = modulo.numero;
        module.titulo = modulo.titulo;
        module.clasesRef = arrayClassesRef;
        console.log('module save', module)
        await this.moduleService.saveModulo(module, courseRef.id)
      }
      let test = curso.actividades.find(x=> x.isTest) // se llama asi porque es un examen
      if(test){
        let examen = new Activity
        examen.type = 'test'
        examen.title = test.title
        examen.createdAt = test.createdAt
        examen.coursesRef = [courseRef]
        console.log('examen',examen)
        await this.activityClassesService.saveActivity(examen);
        let preguntas = test.questions
        for (let index = 0; index < preguntas.length; index++) {
          const pregunta = {
            ...preguntas[index],
            type: preguntas[index].type.value
          }
          await this.activityClassesService.saveQuestion(pregunta,examen.id)
        }

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

  // Crea perfiles y agrega la referencia al departamento y usuario respectivo
  async addProfiles() {
    const skillSnapshot = await firstValueFrom(this.afs.collection(Skill.collection).get());
    const skillRefs = skillSnapshot.docs.map(doc => doc.ref);
    const userSnapshot = await firstValueFrom(this.afs.collection(User.collection).get());
    const userRefs = userSnapshot.docs.map(doc => doc.ref);
    const enterpriseSnapshot = await firstValueFrom(this.afs.collection(Enterprise.collection).get());
    const enterpriseRefs = enterpriseSnapshot.docs.map(doc => doc.ref);
    
    let skillIndex = 0;
    let userIndex = 0;
    let enterpriseIndex = 0;

    //const enterprise = (await enterpriseRefs[0].get()).data() as Enterprise

    for  (const enterpriseLoop of enterpriseRefs) {

     const enterprise = (await enterpriseLoop.get()).data() as Enterprise

      for (const profile of profilesData) {
        const profileRef = this.afs.collection(Profile.collection).doc();
        const id = profileRef.ref.id;
    
        // Obtener las referencias correspondientes y avanzar los índices
        const currentSkillRef = skillRefs[skillIndex % skillRefs.length];
        const currentUserRef = userRefs[userIndex % userRefs.length];
        const currentEnterpriseRef = enterpriseLoop;
  
        profile.permissions = enterprise.permissions
        profile.permissions.hasDefaultPermissions = true
        
        const enterpriseMatch = await firstValueFrom(this.afs.collection<Curso>(Curso.collection, ref =>
          ref.where('enterpriseRef', '==', currentEnterpriseRef)
        ).valueChanges({ idField: 'id' }))
      
        // Query to get courses where enterpriseRef is empty
        const enterpriseEmpty = await firstValueFrom(this.afs.collection<Curso>(Curso.collection, ref =>
          ref.where('enterpriseRef', '==', null)
        ).valueChanges({ idField: 'id' }))
  
        const courses = [...enterpriseMatch, ...enterpriseEmpty]
        
  
        const selectedCourses = sampleSize(courses, 4)
        const coursesRef = selectedCourses.map(course => {
          return this.courseService.getCourseRefById(course.id)
        })
        await profileRef.set({
            ...profile,
            id: id,
            skillsRef: [currentSkillRef],
            enterpriseRef: currentEnterpriseRef,
            coursesRef
        });
        // console.log("id", id);
  
        // Actualizamos el documento actual del Usuario
        const userSnap = await currentUserRef.get();
        if (userSnap.exists) {
          let currentUser: any = userSnap.data()
          currentUser.profile = profileRef.ref
          currentUser.studyHours = profile.hoursPerMonth
          await this.userService.editUser(currentUser as UserJson)
          // await currentUserRef.update({
          //   profile: profileRef.ref
          // });
        }
  
        // Creamos doc que relaciona los cursos del perfil con el estudiante
        await this.addCourseByStudent(coursesRef, currentUserRef, selectedCourses, profile.hoursPerMonth)
  
        // Incrementar los índices para el siguiente profile
        skillIndex++;
        userIndex++;
        enterpriseIndex++;
      }

    }


  }

  async addCourseByStudent(coursesRefs: DocumentReference[], userRef: DocumentReference, selectedCourses: (Curso & {id: string;})[], hoursPerMonth: number) {
    let now = new Date()
    let hoy = +new Date(now.getFullYear(), now.getMonth(), now.getDate())
    let dateStartPlan: number
    let dateEndPlan: number
    for (let i = 0; i < coursesRefs.length; i++) {
      // -------- this is just for test data. Substitute for the correct dates calculation
      const courseData = selectedCourses.find(courseData => courseData.id === coursesRefs[i].id);
      const courseDuration = courseData.duracion
      dateStartPlan = dateEndPlan ? dateEndPlan : hoy;
      dateEndPlan = this.calculatEndDatePlan(dateStartPlan, courseDuration, hoursPerMonth)
      // -------
      await this.courseService.saveCourseByStudent(coursesRefs[i], userRef, new Date(dateStartPlan), new Date(dateEndPlan))
    }
    console.log("Courses by students created")
  }

  
  calculatEndDatePlan(startDate: number, courseDuration: number, hoursPermonth: number): number {
    const monthDays = this.getDaysInMonth(startDate)
    return startDate + 24 * 60 * 60 * 1000 * Math.ceil((courseDuration / 60) / (hoursPermonth / monthDays));
  }

  getDaysInMonth(timestamp: number) {
    const date = new Date(timestamp)
    // Create a new date object for the first day of the next month
    const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    // Subtract one day to get the last day of the required month
    nextMonth.setDate(nextMonth.getDate() - 1);
    // Return the day of the month, which is the number of days in that month
    return nextMonth.getDate();
  }

}
