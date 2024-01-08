import { DocumentReference } from "@angular/fire/compat/firestore"


export interface SkillJson {
    id: string | null,
    name: string,
    enterprise: DocumentReference | null,
}

export class Skill {

    public static collection = 'skill'

    constructor(
        public id: string | null,
        public name: string,
        public enterprise: DocumentReference | null
    ){}

    public static fromJson(skillJson: SkillJson): Skill {
        return new Skill(
            skillJson.id,
            skillJson.name,
            skillJson.enterprise,
        )
    }

    public toJson(): SkillJson {
        return {
            id: this.id,
            name: this.name,
            enterprise: this.enterprise
        }
    }
}