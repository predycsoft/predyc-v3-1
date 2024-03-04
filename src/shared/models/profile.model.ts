import { DocumentReference } from "@angular/fire/compat/firestore"
import { User } from "./user.model"
import { Enterprise } from "./enterprise.model"
import { Permissions } from "./permissions.model"
import { Curso } from "./course.model"

export interface ProfileJson {
    id: string
    name: string
    description: string
    coursesRef: DocumentReference<Curso>[] | []
    enterpriseRef: DocumentReference<Enterprise> | null
    permissions: Permissions
    hoursPerMonth: number;
    baseProfile: DocumentReference<Profile>
}

export class Profile {
    public static collection: string = 'profile'

    public id: string;
    public name: string;
    public description: string;
    public coursesRef: DocumentReference<Curso> [] | [] = []
    public enterpriseRef: DocumentReference<Enterprise> | null
    public permissions: Permissions
    public hoursPerMonth: number;
    public baseProfile :  DocumentReference<Profile>

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
        profile.hoursPerMonth = profileJson.hoursPerMonth
        profile.baseProfile = profileJson.baseProfile
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
            hoursPerMonth: this.hoursPerMonth,
            baseProfile:this.baseProfile
        }
    }
}