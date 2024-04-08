import { Component } from '@angular/core';
import { oldProducts } from './old data/product.data';
import { oldPrices } from './old data/prices.data';
import { Product, ProductJson } from 'projects/shared/models/product.model';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-migrations',
  templateUrl: './migrations.component.html',
  styleUrls: ['./migrations.component.css']
})
export class MigrationsComponent {

  constructor(
    private productService: ProductService,
  ) {}



  async migrateProducts() {
    const oldProductsData: any[] = oldProducts
    const oldPricesData: any[] = oldPrices

    const productsInNewModel: ProductJson[] = oldPricesData.map(price => {
      const oldProductData = oldProductsData.find(x => x.id === price.productId)
      return {
        accesses: {
          enableUserRadar: false,
          enableStudyPlanView: false,
          enableExtraCoursesView: false,
          enableToTakeTest: false,
          enableCreateParticularCourses: false,
          enableEnrollParticularCourses: oldProductData.canEnrollByHimself,
        },
        active: price.active, // or product.active?
        amount: price.amount,
        autodeactivate: true, // new
        createdAt: +new Date(),
        description: oldProductData.description,
        features: oldProductData.features,
        id: price.id,
        name: price.id.replace(/-/g, " "),
        type: oldProductData.isACompanyProduct ? Product.TYPE_FULL : Product.TYPE_INDEPEND,
      }
    })

    console.log("productsInNewModel", productsInNewModel)
    this.productService.saveProducts(productsInNewModel)
  }

}
