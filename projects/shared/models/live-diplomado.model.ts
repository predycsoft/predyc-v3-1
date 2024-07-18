import { DocumentReference } from "@angular/fire/compat/firestore";
import { User } from "./user.model";
import { Enterprise } from "./enterprise.model";
//import { Permissions } from "./permissions.model";
import { Curso } from "./course.model";
import { Activity } from "./activity-classes.model";
import { LiveCourse } from "./live-course.model";

export interface LiveDiplomadoJson {
  id: string;
  name: string;
  photoUrl:string;
  type:string;
  description: string;
  duration:number;
  coursesRef:
    | { courseRef: DocumentReference<LiveCourse>; studyPlanOrder: number }[]
    | [];
  enterpriseRef: DocumentReference<Enterprise> | null;
  //permissions: Permissions;
  baseDiplomado: DocumentReference<LiveDiplomado>;
  activityRef: DocumentReference<Activity>;
  startDate: string;

}

export class LiveDiplomado {
  public static collection: string = "live-diplomado";

  public id: string;
  public name: string;
  public startDate:string;
  public photoUrl:string;
  public description: string;
  public duration: number;
  public type:string;
  public coursesRef:
    | { courseRef: DocumentReference<LiveCourse>; studyPlanOrder: number }[]
    | [] = [];
  public enterpriseRef: DocumentReference<Enterprise> | null;
  //public permissions: Permissions;
  public baseDiplomado: DocumentReference<LiveDiplomado>;
  public activityRef: DocumentReference<Activity>;

  public users?: User[];
  public enterprise?: Enterprise;

  public static fromJson(profileJson: LiveDiplomadoJson): LiveDiplomado {
    let profile = new LiveDiplomado();
    profile.id = profileJson.id;
    profile.startDate = profileJson.startDate,
    profile.name = profileJson.name;
    profile.duration = profileJson.duration;
    profile.description = profileJson.description;
    profile.photoUrl = profileJson.photoUrl;
    profile.coursesRef = [...profileJson.coursesRef];
    profile.enterpriseRef = profileJson.enterpriseRef;
    //profile.permissions = profileJson.permissions;
    profile.baseDiplomado = profileJson.baseDiplomado;
    profile.type = profileJson.type;
    profile.activityRef = profileJson.activityRef;
    return profile;
  }

  toJson(): LiveDiplomadoJson {
    return {
      id: this.id,
      startDate:this.startDate,
      type:this.type,
      name: this.name,
      photoUrl:this.photoUrl,
      description: this.description,
      coursesRef: [...this.coursesRef],
      enterpriseRef: this.enterpriseRef,
      //permissions: this.permissions,
      baseDiplomado: this.baseDiplomado,
      activityRef: this.activityRef,
      duration:this.duration
    };
  }
}
