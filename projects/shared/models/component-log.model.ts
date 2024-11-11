export interface ComponentLogJson {
    authUserId: string
    authUserName: string
    componentName: string
    date: any
    enterpriseId: string
    enterpriseName: string
    id: string
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
            json.url
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
            url: this.url
        };
    }
}
