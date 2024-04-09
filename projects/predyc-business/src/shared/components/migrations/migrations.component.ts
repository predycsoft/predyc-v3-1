import { Component } from '@angular/core';
// import { oldProducts } from './old data/product.data';
// import { oldPrices } from './old data/prices.data';
import { Product, ProductJson } from 'projects/shared/models/product.model';
import { ProductService } from '../../services/product.service';
// import { oldEmpresasCLientes } from './old data/empresasCliente/empresasCliente.data';
// import { oldEmpresasCLientes2 } from './old data/empresasCliente/empresasCliente2.data';
import { oldEmpresasCLientes3 } from './old data/empresasCliente/empresasCliente3.data';
import { EnterpriseJson } from 'projects/shared/models/enterprise.model';
import { EnterpriseService } from '../../services/enterprise.service';
import { License, LicenseJson } from 'projects/shared/models/license.model';
import { Subscription as SubscriptionClass } from 'projects/shared/models/subscription.model'
import { LicenseService } from '../../services/license.service';
import { ProfileJson } from 'projects/shared/models/profile.model';
import { Permissions, PermissionsJson } from 'projects/shared';
import { ProfileService } from '../../services/profile.service';


@Component({
  selector: 'app-migrations',
  templateUrl: './migrations.component.html',
  styleUrls: ['./migrations.component.css']
})
export class MigrationsComponent {

  constructor(
    private productService: ProductService,
    private enterpriseService: EnterpriseService,
    private licenseService: LicenseService,
    private profileService: ProfileService,
  ) {}

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

  async migrateEnterprises() {
    // --------------- Import and use one at a time ---------------
    // const oldEnterprisesData: any[] = oldEmpresasCLientes
    // const oldEnterprisesData: any[] = oldEmpresasCLientes2
    const oldEnterprisesData: any[] = oldEmpresasCLientes3

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
        permissions: permissions,
        photoUrl: oldEnterpriseData.foto ? oldEnterpriseData.foto : null ,
        profilesNo: oldEnterpriseData.profileStudyPlan.length,  // or .departments profiles
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

    await this.enterpriseService.saveEnterprises(enterprisesInNewModel)
    console.log("enterprisesInNewModel", enterprisesInNewModel)
  }

  async migrateLicenses() {
    // const oldEnterprisesData: any[] = oldEmpresasCLientes
    // const oldEnterprisesData: any[] = oldEmpresasCLientes2
    const oldEnterprisesData: any[] = oldEmpresasCLientes3
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







  
  // it is not finished. we need to create courses collection first
  async migrateProfiles() {
        // --------------- Import and use one at a time ---------------
    // const oldEnterprisesData: any[] = oldEmpresasCLientes
    // const oldEnterprisesData: any[] = oldEmpresasCLientes2
    const oldEnterprisesData: any[] = oldEmpresasCLientes3

    const profilesInNewModel: ProfileJson[] = []

    oldEnterprisesData.forEach(oldEnterpriseData => {
      // each enterprise
      if (oldEnterpriseData.departments) {
        oldEnterpriseData.departments.forEach(department => {
          // each department
          if (department.profiles) {
            department.profiles.forEach(profile => {
              // each profile
              const permissions = new Permissions()
              // permissions.createCourses = true
              const profileInNewModel: ProfileJson = {
                id: profile.id,
                name: profile.name,
                description: profile.description,
                coursesRef: null, // set later with enterprise.profileStudyPlan
                enterpriseRef: this.enterpriseService.getEnterpriseRefById(oldEnterpriseData.id),
                permissions: this.toJson(permissions),
                hoursPerMonth: null,  // null or a standart number?
                baseProfile: null,
              }
              profilesInNewModel.push(profileInNewModel)
            })
          }
        });

      }
    })

    await this.profileService.saveProfiles(profilesInNewModel)

    console.log("profilesInNewModel", profilesInNewModel)

  }

  public toJson(permissions: Permissions): PermissionsJson {
    return {
      hoursPerWeek: permissions.hoursPerWeek,
      studyLiberty: permissions.studyLiberty,
      studyplanGeneration: permissions.studyplanGeneration,
      attemptsPerTest: permissions.attemptsPerTest,
      createCourses: permissions.createCourses,      
    };
  }

}
