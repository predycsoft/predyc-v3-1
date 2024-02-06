import { DocumentReference } from "@angular/fire/compat/firestore"
import { Clase } from "./course-class.model"
import { User } from "./user.model"
import { CourseByStudent } from "./course-by-student.model"

export interface ClassByStudentJson { 
    active:boolean
    classRef: DocumentReference<Clase>
    completed: boolean
    coursesByStudentRef: DocumentReference<CourseByStudent> | null
    dateEnd: any | null
    dateStart: any | null
    id: string
    review: any | null
    reviewDate: any | null
    userRef: DocumentReference<User>
}

export class ClassByStudent {
    public static collection: string = 'classesByStudent'

    public active:boolean
    public classRef: DocumentReference<Clase>
    public completed: boolean
    public coursesByStudentRef: DocumentReference<CourseByStudent> | null
    public dateEnd: any | null
    public dateStart: any | null
    public id: string
    public review: any | null
    public reviewDate: any | null
    public userRef: DocumentReference<User> 

    public static fromJson(ClassByStudentJson: ClassByStudentJson): ClassByStudent {
        let courseByStudent = new ClassByStudent();
        courseByStudent.active =  ClassByStudentJson.active
        courseByStudent.classRef =  ClassByStudentJson.classRef
        courseByStudent.completed =  ClassByStudentJson.completed
        courseByStudent.coursesByStudentRef =  ClassByStudentJson.coursesByStudentRef
        courseByStudent.dateEnd =  ClassByStudentJson.dateEnd
        courseByStudent.dateStart =  ClassByStudentJson.dateStart
        courseByStudent.id =  ClassByStudentJson.id
        courseByStudent.review =  ClassByStudentJson.review
        courseByStudent.reviewDate =  ClassByStudentJson.reviewDate
        courseByStudent.userRef =  ClassByStudentJson.userRef
        return courseByStudent
    }
      
    toJson(): ClassByStudentJson {
        return {
            active: this.active,
            classRef: this.classRef,
            completed: this.completed,
            coursesByStudentRef: this.coursesByStudentRef,
            dateEnd: this.dateEnd,
            dateStart: this.dateStart,
            id: this.id,
            review: this.review,
            reviewDate: this.reviewDate,
            userRef: this.userRef,
        }
    }
}