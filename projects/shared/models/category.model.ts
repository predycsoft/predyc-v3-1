import { DocumentReference } from "@angular/fire/compat/firestore"

export interface CategoryJson {
    id: string | null,
    name: string,
    enterprise: DocumentReference | null
}


export class Category {

    public static collection = 'category'

    constructor(
        public id: string | null,
        public name: string,
        public enterprise: DocumentReference | null
    ){}

    public static fromJson(categoryJson: CategoryJson): Category {
        return new Category(
            categoryJson.id,
            categoryJson.name,
            categoryJson.enterprise
        )
    }

    public toJson(): CategoryJson {
        return {
            id: this.id,
            name: this.name,
            enterprise: this.enterprise
        }
    }

}