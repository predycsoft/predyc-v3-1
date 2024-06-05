import { DocumentReference } from "@angular/fire/compat/firestore"

export interface SessionJson {
    id: string
    title: string
    description: string // Not in use. Delete
    liveCourseRef: DocumentReference
    duration: number
    files: any[]
    orderNumber: number
}

export class Session {

    public static collection = 'live-course-session'

    constructor(
        public id: string,
        public title: string,
        public description: string,
        public liveCourseRef: DocumentReference,
        public duration: number,
        public files: any[],
        public orderNumber: number,
    ) {}

    public static fromJson(SessionJson: SessionJson): Session {
        return new Session(
            SessionJson.id,
            SessionJson.title,
            SessionJson.description,
            SessionJson.liveCourseRef,
            SessionJson.duration,
            SessionJson.files,
            SessionJson.orderNumber,
        )
    }

    public toJson(): SessionJson {
        return {
            id:this.id,
            title:this.title,
            description:this.description,
            liveCourseRef : this.liveCourseRef,
            duration : this.duration,
            files : this.files,
            orderNumber : this.orderNumber,
        }
    }
}

export interface SessionSonJson {
    id: string
    parentId: string
    date: any
    weeksToKeep: number
    liveCourseSonRef: DocumentReference
    sonFiles: any[]
    vimeoId1: number
    vimeoId2: string
}

export class SessionSon {

    public static subCollection = 'session-son'

    constructor(
        public id: string,
        public parentId: string,
        public date: any,
        public weeksToKeep: number,
        public liveCourseSonRef: DocumentReference,
        public sonFiles: any[],
        public vimeoId1: number,
        public vimeoId2: string,
    ) {}

    public static fromJson(QuestionJson: SessionSonJson): SessionSon {
        return new SessionSon(
            QuestionJson.id,
            QuestionJson.parentId,
            QuestionJson.date,
            QuestionJson.weeksToKeep,
            QuestionJson.liveCourseSonRef,
            QuestionJson.sonFiles,
            QuestionJson.vimeoId1,
            QuestionJson.vimeoId2,
        )
    }

    public toJson(): SessionSonJson {
        return {
            id:this.id,
            parentId:this.parentId,
            date:this.date,
            weeksToKeep:this.weeksToKeep,
            liveCourseSonRef:this.liveCourseSonRef,
            sonFiles:this.sonFiles,
            vimeoId1:this.vimeoId1,
            vimeoId2:this.vimeoId2,
        }
    }
}