export interface EnterpriseJson {
    createdAt: number,
    description: string | null, // Is this required?
    id: string,
    name: string,
    photoUrl: string | null,
    vimeoFolderId: string | null,
    vimeoFolderUri: string | null,
    website: string | null
}

export class Enterprise {

    public static collection = 'enterprise'

    constructor(
        public createdAt: number,
        public description: string | null, // Is this required?
        public id: string,
        public name: string,
        public photoUrl: string | null,
        public vimeoFolderId: string | null,
        public vimeoFolderUri: string | null,
        public website: string | null
    ) {}

    public static fromJson(enterpriseJson: EnterpriseJson): Enterprise {
        return new Enterprise(
            enterpriseJson.createdAt,
            enterpriseJson.description,
            enterpriseJson.id,
            enterpriseJson.name,
            enterpriseJson.photoUrl,
            enterpriseJson.vimeoFolderId,
            enterpriseJson.vimeoFolderUri,
            enterpriseJson.website,
        )
    }

    public toJson(): EnterpriseJson {
        return {
            createdAt: this.createdAt,
            description: this.description,
            id: this.id,
            name: this.name,
            photoUrl: this.photoUrl,
            vimeoFolderId: this.vimeoFolderId,
            vimeoFolderUri: this.vimeoFolderUri,
            website: this.website,
        }
    }
}