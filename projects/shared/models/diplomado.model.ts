import { DocumentReference } from "@angular/fire/compat/firestore";
import { User } from "./user.model";
import { Enterprise } from "./enterprise.model";
//import { Permissions } from "./permissions.model";
import { Curso } from "./course.model";

export interface DiplomadoJson {
  id: string;
  name: string;
  description: string;
  coursesRef:
    | { courseRef: DocumentReference<Curso>; studyPlanOrder: number }[]
    | [];
  enterpriseRef: DocumentReference<Enterprise> | null;
  //permissions: Permissions;
  hoursPerMonth: number;
  baseDiplomado: DocumentReference<Diplomado>;
}

export class Diplomado {
  public static collection: string = "diplomado";

  public id: string;
  public name: string;
  public description: string;
  public coursesRef:
    | { courseRef: DocumentReference<Curso>; studyPlanOrder: number }[]
    | [] = [];
  public enterpriseRef: DocumentReference<Enterprise> | null;
  //public permissions: Permissions;
  public hoursPerMonth: number;
  public baseDiplomado: DocumentReference<Diplomado>;

  public users?: User[];
  public enterprise?: Enterprise;

  public static fromJson(profileJson: DiplomadoJson): Diplomado {
    let profile = new Diplomado();
    profile.id = profileJson.id;
    profile.name = profileJson.name;
    profile.description = profileJson.description;
    profile.coursesRef = [...profileJson.coursesRef];
    profile.enterpriseRef = profileJson.enterpriseRef;
    //profile.permissions = profileJson.permissions;
    profile.hoursPerMonth = profileJson.hoursPerMonth;
    profile.baseDiplomado = profileJson.baseDiplomado;
    return profile;
  }

  toJson(): DiplomadoJson {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      coursesRef: [...this.coursesRef],
      enterpriseRef: this.enterpriseRef,
      //permissions: this.permissions,
      hoursPerMonth: this.hoursPerMonth,
      baseDiplomado: this.baseDiplomado,
    };
  }
}
