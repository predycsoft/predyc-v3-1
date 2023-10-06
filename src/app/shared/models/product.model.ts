import { PaypalInfo } from "./paypal.model";
import { StripeInfo } from "./stripe.model";

export interface ProductJson {
    acceptsBankTransfer: boolean;
    acceptsPaypal: boolean;
    acceptsStripe: boolean;
    acceptsZelle: boolean;
    active: boolean;
    canEnrollByHimself: boolean;
    canEnrollPrograms: boolean;
    description: string;
    features: ProductFeatures[];
    id: string;
    isACompanyProduct: boolean;
    name: string;
    paypalInfo: PaypalInfo;
    priority: number;
    stripeInfo: StripeInfo;
}

export class Product {
    acceptsBankTransfer: boolean;
    acceptsPaypal: boolean;
    acceptsStripe: boolean;
    acceptsZelle: boolean;
    active: boolean;
    canEnrollByHimself: boolean;
    canEnrollPrograms: boolean;
    description: string;
    features: ProductFeatures[];
    id: string;
    isACompanyProduct: boolean;
    name: string;
    paypalInfo: PaypalInfo;
    priority: number;
    stripeInfo: StripeInfo;

    public static collection = 'product'

  
    public static fromJson(obj: ProductJson): Product {
      let product = new Product();
      product.acceptsBankTransfer = obj.acceptsBankTransfer;
      product.acceptsPaypal = obj.acceptsPaypal;
      product.acceptsStripe = obj.acceptsStripe;
      product.acceptsZelle = obj.acceptsZelle;
      product.active = obj.active;
      product.canEnrollByHimself = obj.canEnrollByHimself;
      product.canEnrollPrograms = obj.canEnrollPrograms;
      product.description = obj.description;
      product.features = obj.features;
      product.isACompanyProduct = obj.isACompanyProduct;
      product.id = obj.id;
      product.name = obj.name;
      product.paypalInfo = obj.paypalInfo;
      product.priority = obj.priority;
      product.stripeInfo = obj.stripeInfo;
      return product;
    }
    public toJson(): ProductJson {
      return {
        acceptsBankTransfer: this.acceptsBankTransfer,
        acceptsPaypal: this.acceptsPaypal,
        acceptsStripe: this.acceptsStripe,
        acceptsZelle: this.acceptsZelle,
        active: this.active,
        canEnrollByHimself: this.canEnrollByHimself,
        canEnrollPrograms: this.canEnrollPrograms,
        description: this.description,
        features: this.features,
        isACompanyProduct: this.isACompanyProduct,
        id: this.id,
        name: this.name,
        paypalInfo: this.paypalInfo,
        priority: this.priority,
        stripeInfo: this.stripeInfo,
      };
    }
  
    public toStripeCreateParams() {
      let productCreateParams = {
        id: this.id,
        active: this.active,
        name: this.name,
        description: this.description,
      };
      return productCreateParams;
    }
  
    public toStripeUpdateParams() {
      let ProductUpdateParams = {
        // active: this.active,
        // name: this.name,
        description: this.description, //description is the only common attribute between stripe and paypal
      };
      return ProductUpdateParams;
    }
  
    public toPaypalCreateParams() {
      let productCreateParams = {
        // id: this.id,
        name: this.name,
        description: this.description,
        type: 'SERVICE',
        category: 'SOFTWARE',
      };
      return productCreateParams;
    }
  
    public toPaypalUpdateParams() {
      let ProductUpdateParams = [{
        op: "replace", 
        path: "/description",
        value: this.description //options: description, category, image_url, home_url 
      }]
      return ProductUpdateParams
  
    }
    
}

export interface ProductFeatures {
    text: string;
    isActive: boolean;
  }