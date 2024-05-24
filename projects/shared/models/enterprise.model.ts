import { Permissions } from "./permissions.model"

export interface EnterpriseJson {
    city: string | null
    country: string | null
    createdAt: number
    description: string | null // Is this required?
    employesNo: number
    id: string 
    name: string
    permissions: Permissions
    photoUrl: string | null
    examenInicial: boolean | true
    demo: boolean | true
    examenFinal: boolean | true
    profilesNo: number
    zipCode: number | null
    workField: string | null
    socialNetworks: {
        facebook: string | null
        instagram: string | null
        website: string | null
        linkedin: string | null
    }
    vimeoFolderId: string | null
    vimeoFolderUri: string | null
    showEnterpriseLogoInCertificates: boolean
}

export class Enterprise {

    public static collection = 'enterprise'
    public static storageProfilePhotoFolder = 'Enterprise/Profile photos'

    constructor(
        public city: string | null,
        public country: string | null,
        public createdAt: number,
        public description: string | null, // Is this required?
        public employesNo: number,        
        public id: string,
        public name: string,
        public permissions: Permissions,
        public photoUrl: string | null,
        public examenInicial: boolean | true,
        public examenFinal: boolean | true,
        public demo: boolean | true,
        public profilesNo: number,
        public zipCode: number | null,
        public workField: string | null,
        public socialNetworks: {
            facebook: string | null,
            instagram: string | null,
            website: string | null
            linkedin: string | null
        },
        public vimeoFolderId: string | null,
        public vimeoFolderUri: string | null,
        public showEnterpriseLogoInCertificates: boolean
    ) {}

    public static getEnterpriseTemplate(): Enterprise {
        return Enterprise.fromJson({
            city: null,
            country: null,
            createdAt: null,
            description: null,
            employesNo: 0,
            id: "" ,
            name: "",
            permissions: {
                hoursPerWeek: 1,
                studyLiberty: Permissions.STUDY_LIBERTY_STRICT_OPTION,
                studyplanGeneration: Permissions.STUDYPLAN_GENERATION_CONFIRMED_OPTION,
                attemptsPerTest: 5,
                createCourses: false
            },
            photoUrl: null,
            examenInicial:true,
            demo:false,
            examenFinal:true,
            profilesNo: 0,
            zipCode: null,
            workField: null,
            socialNetworks: {
                facebook: null,
                instagram: null,
                website: null,
                linkedin: null,
            },
            vimeoFolderId: null,
            vimeoFolderUri: null,
            showEnterpriseLogoInCertificates: true
          });
    }

    patchValue(obj: Object) {
        Object.keys(obj).forEach(key => {
            if (this.hasOwnProperty(key)) this[key] = obj[key]
        })
    }

    public static fromJson(enterpriseJson: EnterpriseJson): Enterprise {
        return new Enterprise(
            enterpriseJson.city,
            enterpriseJson.country,
            enterpriseJson.createdAt,
            enterpriseJson.description,
            enterpriseJson.employesNo,            
            enterpriseJson.id,
            enterpriseJson.name,
            enterpriseJson.permissions,
            enterpriseJson.photoUrl,
            enterpriseJson.examenInicial,
            enterpriseJson.demo,
            enterpriseJson.examenFinal,
            enterpriseJson.profilesNo,
            enterpriseJson.zipCode,
            enterpriseJson.workField,
            enterpriseJson.socialNetworks,
            enterpriseJson.vimeoFolderId,
            enterpriseJson.vimeoFolderUri,
            enterpriseJson.showEnterpriseLogoInCertificates,
        )
    }

    public toJson(): EnterpriseJson {
        return {
            city: this.city,
            country: this.country,
            createdAt: this.createdAt,
            description: this.description,
            employesNo: this.employesNo,            
            id: this.id,
            name: this.name,
            permissions: this.permissions,
            photoUrl: this.photoUrl,
            examenInicial:this.examenInicial,
            demo:this.demo,
            examenFinal:this.examenFinal,
            profilesNo: this.profilesNo,
            zipCode: this.zipCode,
            workField: this.workField,
            socialNetworks: this.socialNetworks,
            vimeoFolderId: this.vimeoFolderId,
            vimeoFolderUri: this.vimeoFolderUri,
            showEnterpriseLogoInCertificates: this.showEnterpriseLogoInCertificates,
        }
    }
}