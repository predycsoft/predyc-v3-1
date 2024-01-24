import { DocumentReference } from "@angular/fire/compat/firestore"
import { User } from "./user.model"
import { Enterprise } from "./enterprise.model"
import { Permissions } from "./permissions.model"

export interface ProfileJson {
    id: string,
    name: string,
    description: string,
    coursesRef: DocumentReference[] | []
    enterpriseRef: DocumentReference | null
    permissions: Permissions
}

export class Profile {
    public static collection: string = 'profile'

    public id: string;
    public name: string;
    public description: string;
    public coursesRef: DocumentReference [] | [] = []
    public enterpriseRef: DocumentReference | null
    public permissions: Permissions

    public users?: User[]
    public enterprise?: Enterprise


    public static fromJson(profileJson: ProfileJson): Profile {
        let profile = new Profile();
        profile.id = profileJson.id
        profile.name = profileJson.name
        profile.description = profileJson.description
        profile.coursesRef = profileJson.coursesRef
        profile.enterpriseRef = profileJson.enterpriseRef
        profile.permissions = profileJson.permissions

        return profile
    }
      
    toJson(): ProfileJson {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            coursesRef: this.coursesRef,
            enterpriseRef: this.enterpriseRef,
            permissions: this.permissions,
        }
    }
}