import { DocumentReference } from "@angular/fire/compat/firestore";
import { User } from "./user.model";
import { Enterprise } from "./enterprise.model";
//import { Permissions } from "./permissions.model";
import { Curso } from "./course.model";
import { Activity } from "./activity-classes.model";

export interface DiplomadoJson {
  id: string;
  name: string;
  photoUrl:string;
  type:string;
  description: string;
  duration:number;
  coursesRef:
    | { courseRef: DocumentReference<Curso>; studyPlanOrder: number }[]
    | [];
  enterpriseRef: DocumentReference<Enterprise> | null;
  //permissions: Permissions;
  hoursPerMonth: number;
  baseDiplomado: DocumentReference<Diplomado>;
  activityRef: DocumentReference<Activity>;
  metaDescription: string;
  slug: string;
  keyWords: string;

}

export class Diplomado {
  public static collection: string = "diplomado";

  public id: string;
  public name: string;
  public photoUrl:string;
  public description: string;
  public duration: number;
  public type:string;
  public coursesRef:
    | { courseRef: DocumentReference<Curso>; studyPlanOrder: number }[]
    | [] = [];
  public enterpriseRef: DocumentReference<Enterprise> | null;
  //public permissions: Permissions;
  public hoursPerMonth: number;
  public baseDiplomado: DocumentReference<Diplomado>;
  public activityRef: DocumentReference<Activity>;
  public metaDescription: string;
  public slug: string;
  public keyWords: string;

  public users?: User[];
  public enterprise?: Enterprise;

  public static fromJson(diplomadoJson: DiplomadoJson): Diplomado {
    let diplomado = new Diplomado();
    diplomado.id = diplomadoJson.id;
    diplomado.name = diplomadoJson.name;
    diplomado.duration = diplomadoJson.duration;
    diplomado.description = diplomadoJson.description;
    diplomado.photoUrl = diplomadoJson.photoUrl;
    diplomado.coursesRef = [...diplomadoJson.coursesRef];
    diplomado.enterpriseRef = diplomadoJson.enterpriseRef;
    //diplomado.permissions = diplomadoJson.permissions;
    diplomado.hoursPerMonth = diplomadoJson.hoursPerMonth;
    diplomado.baseDiplomado = diplomadoJson.baseDiplomado;
    diplomado.type = diplomadoJson.type;
    diplomado.activityRef = diplomadoJson.activityRef;
    diplomado.metaDescription = diplomadoJson.metaDescription;
    diplomado.slug = diplomadoJson.slug;
    diplomado.keyWords = diplomadoJson.keyWords;
    return diplomado;
  }

  toJson(): DiplomadoJson {
    return {
      id: this.id,
      type:this.type,
      name: this.name,
      photoUrl:this.photoUrl,
      description: this.description,
      coursesRef: [...this.coursesRef],
      enterpriseRef: this.enterpriseRef,
      //permissions: this.permissions,
      hoursPerMonth: this.hoursPerMonth,
      baseDiplomado: this.baseDiplomado,
      activityRef: this.activityRef,
      metaDescription: this.metaDescription,
      slug: this.slug,
      keyWords: this.keyWords,
      duration:this.duration
    };
  }
}
