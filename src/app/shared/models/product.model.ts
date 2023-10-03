import { PaypalInfo } from "./paypal.model";
import { StripeInfo } from "./stripe.model";

export interface ProductJson {
    id: string;
    active: boolean;
    name: string;
    description: string;
    features: ProductFeatures[];
    stripeInfo: StripeInfo;
    paypalInfo: PaypalInfo;
    priority: number;
    acceptsStripe: boolean;
    acceptsBankTransfer: boolean;
    acceptsZelle: boolean;
    acceptsPaypal: boolean;
    canEnrollByHimself: boolean;
    canEnrollPrograms: boolean;
    isACompanyProduct: boolean;
}

export class Product {
    id: string;
    active: boolean;
    name: string;
    description: string;
    features: ProductFeatures[];
    stripeInfo: StripeInfo;
    paypalInfo: PaypalInfo;
    priority: number;
    acceptsStripe: boolean;
    acceptsBankTransfer: boolean;
    acceptsZelle: boolean;
    acceptsPaypal: boolean;
    canEnrollByHimself: boolean;
    canEnrollPrograms: boolean;
    isACompanyProduct: boolean;
  
    public static fromJson(obj: ProductJson): Product {
      let product = new Product();
      product.id = obj.id;
      product.active = obj.active;
      product.name = obj.name;
      product.description = obj.description;
      product.features = obj.features;
      product.stripeInfo = obj.stripeInfo;
      product.paypalInfo = obj.paypalInfo;
      product.priority = obj.priority;
      product.acceptsStripe = obj.acceptsStripe;
      product.acceptsBankTransfer = obj.acceptsBankTransfer;
      product.acceptsZelle = obj.acceptsZelle;
      product.acceptsPaypal = obj.acceptsPaypal;
      product.canEnrollByHimself = obj.canEnrollByHimself;
      product.canEnrollPrograms = obj.canEnrollPrograms;
      product.isACompanyProduct = obj.isACompanyProduct;
      return product;
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