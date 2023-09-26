import { DocumentReference } from "@angular/fire/compat/firestore";

export interface DepartmentJson {
    //color: string,
    id: string,
    name: string,
    //profiles: DocumentReference[] | null,
    //users?: DocumentReference[]
}

export class Department {
    public static collection: string = 'department'

    constructor(
        //public color: string,
        public id: string,
        public name: string,
        //public profiles: DocumentReference[] | null,
        //public users?: DocumentReference[] 
    ) {}

    public static fromJson(departmentJson: DepartmentJson): Department {
    return new Department(
        //departmentJson.color,
        departmentJson.id,
        departmentJson.name,
        //departmentJson.profiles,
        //departmentJson?.users,
      )
    }
  
    toJson(): DepartmentJson {
      return {
        //color: this.color,
        id: this.id,
        name: this.name,
        //profiles: this.profiles,
      }
    }
}