import { DocumentReference } from "@angular/fire/compat/firestore"

export interface SessionJson {
    id: string
    title: string
    // date: any //
    description: string //
    liveCourseRef: DocumentReference //
    duration: number
    vimeoId1: number //
    vimeoId2 : string //
    files: any[]
}

export class Session {

    public static collection = 'live-course-session'

    constructor(
        public id: string,
        public title: string,
        // public date: any,
        public description: string,
        public liveCourseRef: DocumentReference,
        public duration: number,
        public vimeoId1: number,
        public vimeoId2 : string,
        public files: any[],
    ) {}

    public static fromJson(SessionJson: SessionJson): Session {
        return new Session(
            SessionJson.id,
            SessionJson.title,
            // SessionJson.date,
            SessionJson.description,
            SessionJson.liveCourseRef,
            SessionJson.duration,
            SessionJson.vimeoId1,
            SessionJson.vimeoId2,
            SessionJson.files,
        )
    }

    public toJson(): SessionJson {
        return {
            id:this.id,
            title:this.title,
            // date:this.date,
            description:this.description,
            liveCourseRef : this.liveCourseRef,
            duration : this.duration,
            vimeoId1 : this.vimeoId1,
            vimeoId2 : this.vimeoId2,
            files : this.files,
        }
    }
}

export interface SessionSonJson {
    id: string
    parentId: string
    date: any
    weeksToKeep: number
    liveCourseSonRef: DocumentReference
}

export class SessionSon {

    public static subCollection = 'session-son'

    constructor(
        public id: string,
        public parentId: string,
        public date: any,
        public weeksToKeep: number,
        public liveCourseSonRef: DocumentReference,
    ) {}

    public static fromJson(QuestionJson: SessionSonJson): SessionSon {
        return new SessionSon(
            QuestionJson.id,
            QuestionJson.parentId,
            QuestionJson.date,
            QuestionJson.weeksToKeep,
            QuestionJson.liveCourseSonRef,
        )
    }

    public toJson(): SessionSonJson {
        return {
            id:this.id,
            parentId:this.parentId,
            date:this.date,
            weeksToKeep:this.weeksToKeep,
            liveCourseSonRef:this.liveCourseSonRef,
        }
    }
}