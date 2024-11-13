export interface ComponentLogJson {
    authUserId: string
    authUserName: string
    componentName: string
    date: any
    enterpriseId: string
    enterpriseName: string
    id: string
    platform: "Predyc Empresas" | "Predyc Admin" | "Predyc User"
    readOperationsCount: number;
    url: string
}

export class ComponentLog {
    public static collection = 'component-log';

    constructor(
        public authUserId: string,
        public authUserName: string,
        public componentName: string,
        public date: any,
        public enterpriseId: string,
        public enterpriseName: string,
        public id: string,
        public platform: "Predyc Empresas" | "Predyc Admin" | "Predyc User",
        public readOperationsCount: number,
        public url: string,
    ) {}

    public static fromJson(json: ComponentLogJson): ComponentLog {
        return new ComponentLog(
            json.authUserId,
            json.authUserName,
            json.componentName,
            json.date,
            json.enterpriseId,
            json.enterpriseName,
            json.id,
            json.platform,
            json.readOperationsCount,
            json.url,
        );
    }

    public toJson(): ComponentLogJson {
        return {
            authUserId: this.authUserId,
            authUserName: this.authUserName,
            componentName: this.componentName,
            date: this.date,
            enterpriseId: this.enterpriseId,
            enterpriseName: this.enterpriseName,
            id: this.id,
            platform: this.platform,
            readOperationsCount: this.readOperationsCount,
            url: this.url,
        };
    }
}
