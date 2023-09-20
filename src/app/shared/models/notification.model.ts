import { DocumentReference } from "@angular/fire/compat/firestore";

export interface NotificationJson {
    date: number // timestamp
    // enterprise?: Enterprise
    enterpriseRef: DocumentReference
    id: string
    message: string
    readByUsers: []
    readByAdmin: boolean
    type: typeof Notification.TYPE_ALERT |
          typeof Notification.TYPE_ACTIVITY |
          typeof Notification.TYPE_REQUEST
    // user?: User
    userRef: DocumentReference
}

export class Notification {

    public static collection: string = 'notification'

    public static TYPE_ALERT: string = 'alert'
    public static TYPE_ACTIVITY: string = 'activity'
    public static TYPE_REQUEST: string = 'request'

    constructor(
        public date: number, // timestamp
        // public enterprise: Enterprise,
        public enterpriseRef: DocumentReference,
        public id: string,
        public message: string,
        public readByUsers: [],
        public readByAdmin: boolean,
        public type: typeof Notification.TYPE_ALERT |
                    typeof Notification.TYPE_ACTIVITY |
                    typeof Notification.TYPE_REQUEST,
        public userRef: DocumentReference
    ) {}
}