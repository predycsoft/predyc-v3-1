import { DocumentReference } from "@angular/fire/compat/firestore";

export interface Department {
    color: string,
    id: string,
    name: string,
    profiles: DocumentReference[] | null,
    users?: DocumentReference[]
}