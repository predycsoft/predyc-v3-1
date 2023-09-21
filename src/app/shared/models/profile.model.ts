
export interface ProfileJson {
    id: string,
    name: string,
    studyPlan: []
}

export class Profile {
    public static collection: string = 'profile'

    constructor(
        public id: string,
        public name: string,
        public studyPlan: []
    ) {}

    public static fromJson(profileJson: ProfileJson): Profile {
    return new Profile(
        profileJson.id,
        profileJson.name,
        profileJson.studyPlan
        )
    }
      
    toJson(): ProfileJson {
        return {
        id: this.id,
        name: this.name,
        studyPlan: this.studyPlan
        }
    }
}