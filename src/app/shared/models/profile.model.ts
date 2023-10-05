import { DocumentReference } from "@angular/fire/compat/firestore"

export interface ProfileJson {
    id: string,
    name: string,
    description: string,
    responsabilities: string,
    departmentRef: DocumentReference
    skillsRef: DocumentReference[]
    userRef: DocumentReference[]
}

export class Profile {
    public static collection: string = 'profile'

    public id: string;
    public name: string;
    public description: string;
    public responsabilities: string;
    public departmentRef: DocumentReference
    public skillsRef: DocumentReference [] = []
    public userRef: DocumentReference [] = []

    public static fromJson(profileJson: ProfileJson): Profile {
        let profile = new Profile();
        profile.id = profileJson.id
        profile.name = profileJson.name
        profile.description = profileJson.description
        profile.responsabilities = profileJson.responsabilities
        profile.departmentRef = profileJson.departmentRef
        profile.skillsRef = profileJson.skillsRef
        profile.userRef = profileJson.userRef
        return profile
    }
      
    toJson(): ProfileJson {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            responsabilities: this.responsabilities,
            departmentRef: this.departmentRef,
            skillsRef: this.skillsRef,
            userRef: this.userRef,
        }
    }
}