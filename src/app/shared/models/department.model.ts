import { DocumentReference } from "@angular/fire/compat/firestore";
import { Enterprise } from "./enterprise.model";

export interface DepartmentJson {
    id: string | null,
    name: string,
    enterpriseRef: DocumentReference<Enterprise>
}

export class Department {
    constructor(
        public id: string | null,
        public name: string,
        public enterpriseRef: DocumentReference<Enterprise>
    ) {}

    public static collection: string = 'department'
    
    public static fromJson(departmentJson: DepartmentJson): Department {
        return new Department(
            departmentJson.id,
            departmentJson.name,
            departmentJson.enterpriseRef
        )
    }

    public toJson(): DepartmentJson {
        return {
            id: this.id,
            name: this.name,
            enterpriseRef: this.enterpriseRef
        }
    }
}