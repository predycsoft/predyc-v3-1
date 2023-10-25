import { DocumentReference } from "@angular/fire/compat/firestore";
import { Profile } from "./profile.model";
import { Enterprise } from "./enterprise.model";

export interface DepartmentJson {
    //color: string,
    id: string,
    name: string,
    profilesRef: DocumentReference[] | null,
    enterpriseRef: DocumentReference | null,
}

export class Department {
    public static collection: string = 'department'

    public profiles?: Profile[]
    public enterprise?: Enterprise

    constructor(
        //public color: string,
        public id: string,
        public name: string,
        public enterpriseRef: DocumentReference | null,
        public profilesRef: DocumentReference[] | null,
    ) {}

    public static fromJson(departmentJson: DepartmentJson): Department {
    return new Department(
        //departmentJson.color,
        departmentJson.id,
        departmentJson.name,
        departmentJson.enterpriseRef,
        departmentJson.profilesRef,
      )
    }
  
    toJson(): DepartmentJson {
      return {
        //color: this.color,
        id: this.id,
        name: this.name,
        enterpriseRef: this.enterpriseRef,
        profilesRef: this.profilesRef,
      }
    }
}