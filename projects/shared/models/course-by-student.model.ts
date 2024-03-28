import { DocumentReference } from "@angular/fire/compat/firestore"
import { Curso } from "./course.model"

export interface CourseByStudentJson { 
    active:boolean
    courseRef: DocumentReference<Curso> | null
    dateEnd: any | null
    dateEndPlan: any
    dateStart: any | null
    dateStartPlan: any // It should be Date
    finalScore: number
    id: string,
    progress: number
    userRef: DocumentReference | null,
    courseTime?: number
    progressTime?: number
    isExtraCourse: boolean
}

export class CourseByStudent {
    public static collection: string = 'coursesByStudent'


    public active: boolean = true
    public courseRef: DocumentReference<Curso>
    public dateEnd: any = null
    public dateEndPlan: any
    public dateStart: any = null
    public dateStartPlan: any
    public finalScore: number = 0;
    public id: string;
    public progress:number = 0;
    public userRef: DocumentReference
    public courseTime: number
    public progressTime: number
    public isExtraCourse: boolean = true

    public static fromJson(CourseByStudentJson: CourseByStudent): CourseByStudent {
        let courseByStudent = new CourseByStudent();
        courseByStudent.active = CourseByStudentJson.active
        courseByStudent.courseRef = CourseByStudentJson.courseRef
        courseByStudent.dateEnd = CourseByStudentJson.dateEnd
        courseByStudent.dateEndPlan = CourseByStudentJson.dateEndPlan
        courseByStudent.dateStart= CourseByStudentJson.dateStart
        courseByStudent.dateStartPlan= CourseByStudentJson.dateStartPlan
        courseByStudent.finalScore = CourseByStudentJson.finalScore
        courseByStudent.id = CourseByStudentJson.id
        courseByStudent.progress = CourseByStudentJson.progress
        courseByStudent.userRef = CourseByStudentJson.userRef
        courseByStudent.courseTime = CourseByStudentJson?.courseTime
        courseByStudent.progressTime = CourseByStudentJson?.progressTime
        courseByStudent.isExtraCourse = CourseByStudentJson.isExtraCourse

        return courseByStudent
    }
      
    toJson(): CourseByStudentJson {
        return {
            active:this.active,
            courseRef: this.courseRef,
            dateEnd: this.dateEnd,
            dateEndPlan: this.dateEndPlan,
            dateStart: this.dateStart,
            dateStartPlan: this.dateStartPlan,
            finalScore:this.finalScore,
            id: this.id,
            progress: this.progress,
            userRef: this.userRef,
            courseTime: this.courseTime,
            progressTime: this.progressTime,
            isExtraCourse: this.isExtraCourse,
        }
    }
}