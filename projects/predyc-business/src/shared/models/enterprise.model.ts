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
    profilesNo: number
    // totalAlertNotifications: number
    // totalEventNotifications: number
    // totalReadByAdminNotifications: number
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
}

export class Enterprise {

    public static collection = 'enterprise'
    public static storageProfilePhotoFolder = 'Enterprise/Profile photos'

    public static newEnterpriseTemplate =  Enterprise.fromJson({
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
      });

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
        public profilesNo: number,
        // public totalAlertNotifications: number,
        // public totalEventNotifications: number,
        // public totalReadByAdminNotifications: number,
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
    ) {}

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
            enterpriseJson.profilesNo,
            // enterpriseJson.totalAlertNotifications,
            // enterpriseJson.totalEventNotifications,
            // enterpriseJson.totalReadByAdminNotifications,
            enterpriseJson.zipCode,
            enterpriseJson.workField,
            enterpriseJson.socialNetworks,
            enterpriseJson.vimeoFolderId,
            enterpriseJson.vimeoFolderUri,
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
            profilesNo: this.profilesNo,
            // totalAlertNotifications: this.totalAlertNotifications,
            // totalEventNotifications: this.totalEventNotifications,
            // totalReadByAdminNotifications: this.totalReadByAdminNotifications,
            zipCode: this.zipCode,
            workField: this.workField,
            socialNetworks: this.socialNetworks,
            vimeoFolderId: this.vimeoFolderId,
            vimeoFolderUri: this.vimeoFolderUri,
        }
    }
}