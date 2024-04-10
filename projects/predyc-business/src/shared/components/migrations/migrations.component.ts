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


@Component({
  selector: 'app-migrations',
  templateUrl: './migrations.component.html',
  styleUrls: ['./migrations.component.css']
})
export class MigrationsComponent {

  constructor(
    private enterpriseService: EnterpriseService,
    private userService: UserService,
    private productService: ProductService,
    private licenseService: LicenseService,
    private profileService: ProfileService,
    private categoryService: CategoryService,
  ) {}

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


  public permissionsToJson(permissions: Permissions): PermissionsJson {
    return {
      hoursPerWeek: permissions.hoursPerWeek,
      studyLiberty: permissions.studyLiberty,
      studyplanGeneration: permissions.studyplanGeneration,
      attemptsPerTest: permissions.attemptsPerTest,
      createCourses: permissions.createCourses,      
    };
  }

  async migrateLicenses() {
    const oldEnterprisesData: any[] = oldEmpresasCLientes
    const licensesInNewModel: LicenseJson[] = []

    for (let oldEnterpriseData of oldEnterprisesData) {
      if (oldEnterpriseData.licences) {
        for (let oldLicenseData of oldEnterpriseData.licences) {
          const licenseInNewModel: LicenseJson = {
            createdAt: oldLicenseData.createdAt,
            currentPeriodEnd: oldLicenseData.currentPeriodEnd,
            currentPeriodStart: oldLicenseData.currentPeriodStart,
            enterpriseRef: this.enterpriseService.getEnterpriseRefById(oldEnterpriseData.id),
            failedRotationCount: null, // new
            id: oldLicenseData.id,
            productRef: this.productService.getProductRefById(oldLicenseData.priceId),
            quantity: oldLicenseData.quantity,
            quantityUsed: oldLicenseData.retrieveBy.length,
            rotations: null, // new
            rotationsUsed: null, //new
            rotationsWaitingCount: null, // new
            startedAt: oldLicenseData.startedAt,
            status: oldLicenseData.status === SubscriptionClass.STATUS_ACTIVE ? SubscriptionClass.STATUS_ACTIVE : SubscriptionClass.STATUS_INACTIVE,
          }
          licensesInNewModel.push(licenseInNewModel)
        }
      }
    }

    await this.licenseService.saveLicenses(licensesInNewModel)
    console.log("licensesInNewModel", licensesInNewModel)

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
        degree: null,  // not using
        departmentRef: null, // ***
        displayName: oldUserData.displayName ? oldUserData.displayName : oldUserData.name,
        email: oldUserData.email,
        enterprise: this.enterpriseService.getEnterpriseRefById(oldUserData.empresaId),
        experience: oldUserData.experience ? oldUserData.experience : oldUserData.anosExperiencia,
        gender: oldUserData.genero,
        hasCollegeDegree: null, //not using
        hiringDate: oldUserData.hiringDate, 
        industry: null, //not using
        job: oldUserData.cargo ? oldUserData.cargo : oldUserData.profesion ? oldUserData.profesion : "",
        lastConnection: null, // ????? not using
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

    for (let user of usersInNewModel) await this.userService.addUser(User.fromJson(user))
    console.log("ALL USERS CREATED")

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
  
  // it is not finished. we need to create courses collection first
  // async migrateProfiles() {
  //   // --------------- Import and use one at a time ---------------
  //   // const oldEnterprisesData: any[] = oldEmpresasCLientes
  //   // const oldEnterprisesData: any[] = oldEmpresasCLientes2
  //   const oldEnterprisesData: any[] = oldEmpresasCLientes3

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
