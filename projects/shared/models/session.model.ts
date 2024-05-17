import { DocumentReference } from "@angular/fire/compat/firestore"

export interface SessionJson {
    id: string
    title: string
    date: any
    description: string
    liveCourseRef: DocumentReference
}

export class Session {

    public static collection = 'live-course-session'

    constructor(
        public id: string,
        public title: string,
        public date: any,
        public description: string,
        public liveCourseRef: DocumentReference,
    ) {}

    public static fromJson(QuestionJson: SessionJson): Session {
        return new Session(
            QuestionJson.id,
            QuestionJson.title,
            QuestionJson.date,
            QuestionJson.description,
            QuestionJson.liveCourseRef,
        )
    }

    public toJson(): SessionJson {
        return {
            id:this.id,
            title:this.title,
            date:this.date,
            description:this.description,
            liveCourseRef : this.liveCourseRef,
        }
    }
}