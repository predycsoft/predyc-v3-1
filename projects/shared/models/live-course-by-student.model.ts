import { DocumentReference } from "@angular/fire/compat/firestore"
// "inscritos" sub collection info

export interface LiveCourseByStudentJson {
    id: string
    completed: boolean
    userRef: DocumentReference
    liveCourseRef: DocumentReference
}

export class LiveCourseByStudent {

    public static collection = 'live-course-by-student'

    constructor(
        public id: string,
        public completed: boolean,
        public userRef: DocumentReference,
        public liveCourseRef: DocumentReference,
    ) {}

    public static fromJson(QuestionJson: LiveCourseByStudentJson): LiveCourseByStudent {
        return new LiveCourseByStudent(
            QuestionJson.id,
            QuestionJson.completed,
            QuestionJson.userRef,
            QuestionJson.liveCourseRef,
        )
    }

    public toJson(): LiveCourseByStudentJson {
        return {
            id:this.id,
            completed:this.completed,
            userRef : this.userRef,
            liveCourseRef : this.liveCourseRef,
        }
    }
}