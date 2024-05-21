import { DocumentReference } from "@angular/fire/compat/firestore"
import { Skill } from "./skill.model"

export interface LiveCourseJson {
    id: string
    companyName: string
    title: string
    photoUrl: string
    meetingLink: string
    description: string
    instructorRef: DocumentReference
    skillsRef: DocumentReference<Skill>[]

    // duracion: number,
    // nivel: string,

    
}

export class LiveCourse {

    public static collection = 'live-course'

    constructor(
        public id: string,
        public companyName: string,
        public title: string,
        public photoUrl: string,
        public meetingLink: string,
        public description: string,
        public instructorRef: DocumentReference,
        public skillsRef: DocumentReference<Skill>[],
    ) {}

    public static fromJson(QuestionJson: LiveCourseJson): LiveCourse {
        return new LiveCourse(
            QuestionJson.id,
            QuestionJson.companyName,
            QuestionJson.title,
            QuestionJson.photoUrl,
            QuestionJson.meetingLink,
            QuestionJson.description,
            QuestionJson.instructorRef,
            QuestionJson.skillsRef,
        )
    }

    public toJson(): LiveCourseJson {
        return {
            id:this.id,
            companyName:this.companyName,
            title:this.title,
            photoUrl:this.photoUrl,
            meetingLink:this.meetingLink,
            description:this.description,
            instructorRef : this.instructorRef,
            skillsRef : this.skillsRef,
        }
    }
}