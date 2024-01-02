import { DocumentReference } from "@angular/fire/compat/firestore";
import { User } from "./user.model";

export interface NotificationJson {
    date: number // timestamp
    enterpriseRef: DocumentReference | null
    id: string | null
    message: string
    readByUser: boolean
    readByAdmin: boolean
    type: typeof Notification.TYPE_ALERT |
          typeof Notification.TYPE_EVENT |
          typeof Notification.ARCHIVED
    userRef: DocumentReference | null
}

export class Notification {

    public static collection: string = 'notification'

    public static TYPE_ALERT: string = 'alert'
    public static TYPE_EVENT: string = 'event'
    public static ARCHIVED: string = 'archived'

    public user: User

    constructor(
        public date: number, // timestamp
        // public enterprise: Enterprise,
        public enterpriseRef: DocumentReference | null,
        public id: string | null,
        public message: string,
        public readByUser: boolean,
        public readByAdmin: boolean,
        public type: typeof Notification.TYPE_ALERT |
                    typeof Notification.TYPE_EVENT,
        public userRef: DocumentReference | null
    ) {}

    public static fromJson(notificationJson: NotificationJson): Notification {
        return new Notification(
            notificationJson.date,
            notificationJson.enterpriseRef,
            notificationJson.id,
            notificationJson.message,
            notificationJson.readByUser,
            notificationJson.readByAdmin,
            notificationJson.type,
            notificationJson.userRef
        )
    }

    public toJson(): NotificationJson {
        return {
            date: this.date,
            enterpriseRef: this.enterpriseRef,
            id: this.id,
            message: this.message,
            readByUser: this.readByUser,
            readByAdmin: this.readByAdmin,
            type: this.type,
            userRef: this.userRef,
        }
    }
}