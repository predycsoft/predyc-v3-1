export interface ProductJson {
    accesses: ProductAccesses;
    active: boolean;
    amount: number;
    autodeactivate: boolean;
    coursesQty: number | null;
    createdAt: number;
    description: string;
    features: ProductFeatures[];
    id: string;
    name: string;
    type: "prueba 30 dias" | "independiente" | "simplificado" | "full"
}

export class Product {
    accesses: ProductAccesses;
    active: boolean;
    autodeactivate: boolean;
    coursesQty: number | null;
    amount: number;
    createdAt: number;
    description: string;
    features: ProductFeatures[];
    id: string;
    name: string;
    type: "prueba 30 dias" | "independiente" | "simplificado" | "full"

    public static TYPE_TRIAL: 'prueba 30 dias' = 'prueba 30 dias';
    public static TYPE_INDEPEND: 'independiente' = 'independiente';
    public static TYPE_SIMPLIFIED: 'simplificado' = 'simplificado';
    public static TYPE_FULL: 'full' = 'full';
  
    public static TYPE_CHOICES = [
      this.TYPE_TRIAL,
      this.TYPE_INDEPEND,
      this.TYPE_SIMPLIFIED,
      this.TYPE_FULL,
    ];

    public static collection = 'product'

    public static newProduct: ProductJson = {
      accesses: {
        enableUserRadar: false,
        enableStudyPlanView: false,
        enableExtraCoursesView: false,
        enableToTakeTest: false,
        enableCreateParticularCourses: false,
      },
      active: true,
      amount: 0,
      autodeactivate: false,
      coursesQty: null,
      createdAt: +new Date(),
      description: '',
      features: [],
      id: '',
      name: '',
      type: "independiente"
    }

  
    public static fromJson(obj: ProductJson): Product {
      let product = new Product();
      product.accesses = obj.accesses;
      product.active = obj.active;
      product.amount = obj.amount;
      product.autodeactivate = obj.autodeactivate;
      product.coursesQty = obj.coursesQty;
      product.createdAt = obj.createdAt;
      product.description = obj.description;
      product.features = obj.features;
      product.id = obj.id;
      product.name = obj.name;
      product.type = obj.type;
      return product;
    }
    public toJson(): ProductJson {
      return {
        accesses: this.accesses,
        active: this.active,
        amount: this.amount,
        autodeactivate: this.autodeactivate,
        coursesQty: this.coursesQty,
        createdAt: this.createdAt,
        description: this.description,
        features: this.features,
        id: this.id,
        name: this.name,
        type: this.type,
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