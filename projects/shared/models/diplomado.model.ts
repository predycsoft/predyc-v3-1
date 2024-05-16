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

  public users?: User[];
  public enterprise?: Enterprise;

  public static fromJson(profileJson: DiplomadoJson): Diplomado {
    let profile = new Diplomado();
    profile.id = profileJson.id;
    profile.name = profileJson.name;
    profile.duration = profileJson.duration;
    profile.description = profileJson.description;
    profile.photoUrl = profileJson.photoUrl;
    profile.coursesRef = [...profileJson.coursesRef];
    profile.enterpriseRef = profileJson.enterpriseRef;
    //profile.permissions = profileJson.permissions;
    profile.hoursPerMonth = profileJson.hoursPerMonth;
    profile.baseDiplomado = profileJson.baseDiplomado;
    profile.type = profileJson.type;
    profile.activityRef = profileJson.activityRef;
    return profile;
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
      duration:this.duration
    };
  }
}
