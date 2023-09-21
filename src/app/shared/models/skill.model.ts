import { DocumentReference } from "@angular/fire/compat/firestore"


export interface SkillJson {
    id: string,
    name: string,
    category: DocumentReference,
}

export class Skill {

    public static collection = 'skill'

    constructor(
        public id: string,
        public name: string,
        public category: DocumentReference,
    ){}

    public static fromJson(skillJson: SkillJson): Skill {
        return new Skill(
            skillJson.id,
            skillJson.name,
            skillJson.category,
        )
    }

    public toJson(): SkillJson {
        return {
            id: this.id,
            name: this.name,
            category: this.category
        }
    }
}