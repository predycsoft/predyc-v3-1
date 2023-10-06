import { DocumentReference } from "@angular/fire/compat/firestore";

export interface DepartmentJson {
    //color: string,
    id: string,
    name: string,
    //profiles: DocumentReference[] | null,
    enterpriseRef: DocumentReference | null,
}

export class Department {
    public static collection: string = 'department'

    constructor(
        //public color: string,
        public id: string,
        public name: string,
        public enterpriseRef: DocumentReference | null
        //public profiles: DocumentReference[] | null,
        //public users?: DocumentReference[] 
    ) {}

    public static fromJson(departmentJson: DepartmentJson): Department {
    return new Department(
        //departmentJson.color,
        departmentJson.id,
        departmentJson.name,
        departmentJson.enterpriseRef,
        //departmentJson.profiles,
        //departmentJson?.users,
      )
    }
  
    toJson(): DepartmentJson {
      return {
        //color: this.color,
        id: this.id,
        name: this.name,
        enterpriseRef: this.enterpriseRef,
        //profiles: this.profiles,
      }
    }
}