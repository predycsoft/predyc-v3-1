export interface ProductJson {
    accesses: ProductAccesses;
    active: boolean;
    createdAt: number;
    description: string;
    features: ProductFeatures[];
    id: string;
    name: string;
}

export class Product {
    accesses: ProductAccesses;
    active: boolean;
    createdAt: number;
    description: string;
    features: ProductFeatures[];
    id: string;
    name: string;

    public static collection = 'product'

    public static newProduct = {
      accesses: {
        enableUserRadar: false,
        enableStudyPlanView: false,
        enableExtraCoursesView: false,
        enableToTakeTest: false,
        enableCreateParticularCourses: false,
      },
      active: true,
      createdAt: +new Date(),
      description: '',
      features: [],
      id: '',
      name: '',
    }

  
    public static fromJson(obj: ProductJson): Product {
      let product = new Product();
      product.accesses = obj.accesses;
      product.active = obj.active;
      product.createdAt = obj.createdAt;
      product.description = obj.description;
      product.features = obj.features;
      product.id = obj.id;
      product.name = obj.name;
      return product;
    }
    public toJson(): ProductJson {
      return {
        accesses: this.accesses,
        active: this.active,
        createdAt: this.createdAt,
        description: this.description,
        features: this.features,
        id: this.id,
        name: this.name,
      };
    }
    
}

export interface ProductFeatures {
    text: string;
    isActive: boolean;
}

export interface ProductAccesses {
  enableUserRadar: boolean;
  enableStudyPlanView: boolean;
  enableExtraCoursesView: boolean;
  enableToTakeTest: boolean;
  enableCreateParticularCourses: boolean;
}