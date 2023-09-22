export interface EnterpriseJson {
    city: string | null,
    country: string | null,
    createdAt: number,
    description: string | null, // Is this required?
    id: string,
    name: string,
    photoUrl: string | null,
    postalCode: number | null,
    sector: string | null,
    socialNetworks: {
        facebook: string | null,
        instagram: string | null,
        website: string | null
        linkedin: string | null
    }
    vimeoFolderId: string | null,
    vimeoFolderUri: string | null,
}

export class Enterprise {

    public static collection = 'enterprise'

    constructor(
        public city: string | null,
        public country: string | null,
        public createdAt: number,
        public description: string | null, // Is this required?
        public id: string,
        public name: string,
        public photoUrl: string | null,
        public postalCode: number | null,
        public sector: string | null,
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
            enterpriseJson.id,
            enterpriseJson.name,
            enterpriseJson.photoUrl,
            enterpriseJson.postalCode,
            enterpriseJson.sector,
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
            id: this.id,
            name: this.name,
            photoUrl: this.photoUrl,
            postalCode: this.postalCode,
            sector: this.sector,
            socialNetworks: this.socialNetworks,
            vimeoFolderId: this.vimeoFolderId,
            vimeoFolderUri: this.vimeoFolderUri,
        }
    }
}