import { DocumentReference } from "@angular/fire/compat/firestore"
import { License } from "./license.model"

export interface EnterpriseJson {
    city: string | null
    country: string | null
    createdAt: number
    description: string | null // Is this required?
    employesNo: number
    id: string 
    name: string
    photoUrl: string | null
    totalActivityNotifications: number
    totalAlertNotifications: number
    totalRequestNotifications: number
    totalReadByAdminNotifications: number
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

    constructor(
        public city: string | null,
        public country: string | null,
        public createdAt: number,
        public description: string | null, // Is this required?
        public employesNo: number,        
        public id: string,
        public name: string,
        public photoUrl: string | null,
        public totalActivityNotifications: number,
        public totalAlertNotifications: number,
        public totalRequestNotifications: number,
        public totalReadByAdminNotifications: number,
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
            enterpriseJson.photoUrl,
            enterpriseJson.totalActivityNotifications,
            enterpriseJson.totalAlertNotifications,
            enterpriseJson.totalRequestNotifications,
            enterpriseJson.totalReadByAdminNotifications,
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
            photoUrl: this.photoUrl,
            totalActivityNotifications: this.totalActivityNotifications,
            totalAlertNotifications: this.totalAlertNotifications,
            totalRequestNotifications: this.totalRequestNotifications,
            totalReadByAdminNotifications: this.totalReadByAdminNotifications,
            zipCode: this.zipCode,
            workField: this.workField,
            socialNetworks: this.socialNetworks,
            vimeoFolderId: this.vimeoFolderId,
            vimeoFolderUri: this.vimeoFolderUri,
        }
    }
}