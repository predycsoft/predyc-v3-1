import { DocumentReference } from "@angular/fire/compat/firestore"


export interface SkillJson {
    id: string,
    name: string,
    category: DocumentReference,
    enterprise: DocumentReference,
}

export class Skill {

    public static collection = 'skill'

    constructor(
        public id: string,
        public name: string,
        public category: DocumentReference,
        public enterprise: DocumentReference
    ){}

    public static fromJson(skillJson: SkillJson): Skill {
        return new Skill(
            skillJson.id,
            skillJson.name,
            skillJson.category,
            skillJson.enterprise,
        )
    }

    public toJson(): SkillJson {
        return {
            id: this.id,
            name: this.name,
            category: this.category,
            enterprise: this.enterprise

        }
    }
}