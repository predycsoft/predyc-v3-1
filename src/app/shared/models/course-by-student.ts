import { DocumentReference } from "@angular/fire/compat/firestore"

export interface CourseByStudentJson { 
    id: string,
    userRef: DocumentReference | null,
    courseRef: DocumentReference | null
    progress: number
    dateStartPlan: any // It should be Date
    dateEndPlan: any
    dateStart: any | null
    dateEnd: any | null
    active:boolean
    finalScore: number

}

export class CourseByStudent {
    public static collection: string = 'coursesByStudent'


    public id: string;
    public userRef: DocumentReference 
    public courseRef: DocumentReference
    public progress:number = 0;
    public dateStartPlan: any
    public dateEndPlan: any
    public dateStart: any = null
    public dateEnd: any = null
    public active: boolean = true
    public finalScore: number = 0;

    public static fromJson(CourseByStudentJson: CourseByStudent): CourseByStudent {
        let courseByStudent = new CourseByStudent();
        courseByStudent.id = CourseByStudentJson.id
        courseByStudent.userRef = CourseByStudentJson.userRef
        courseByStudent.courseRef = CourseByStudentJson.courseRef
        courseByStudent.progress = CourseByStudentJson.progress
        courseByStudent.dateStartPlan= CourseByStudentJson.dateStartPlan
        courseByStudent.dateEndPlan = CourseByStudentJson.dateEndPlan
        courseByStudent.dateStart= CourseByStudentJson.dateStart
        courseByStudent.dateEnd = CourseByStudentJson.dateEnd
        courseByStudent.finalScore = CourseByStudentJson.finalScore

        return courseByStudent
    }
      
    toJson(): CourseByStudentJson {
        return {
            id: this.id,
            userRef: this.userRef,
            courseRef: this.courseRef,
            progress: this.progress,
            dateStartPlan: this.dateStartPlan,
            dateEndPlan: this.dateEndPlan,
            dateStart: this.dateStart,
            dateEnd: this.dateEnd,
            active:this.active,
            finalScore:this.finalScore
        }
    }
}