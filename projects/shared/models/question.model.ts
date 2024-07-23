import { DocumentReference } from "@angular/fire/compat/firestore"

export interface QuestionJson {
    id: string
    courseRef:DocumentReference
    claseRef: DocumentReference
    userRef: DocumentReference
    instructorRef: DocumentReference
    respondida: boolean
    respuesta: string
    timestamp: Date
    timestampRespuesta: Date
    respondidaInstructor: boolean
    respondidaAI: boolean
    score: number
    //userName: string
    pregunta:string
    mostrarPregunta:boolean
}

export class Question {

    public static collection = 'question'

    constructor(
        public id:string,
        public courseRef:DocumentReference,
        public claseRef: DocumentReference,
        public userRef: DocumentReference,
        public instructorRef: DocumentReference,
        public respondida: boolean,
        public respuesta: string = "",
        public timestamp: any, // Date
        public timestampRespuesta: any, // Date
        public score: number,
        public respondidaInstructor:boolean,
        public respondidaAI:boolean,
        public pregunta: string,
        public mostrarPregunta:boolean,
        //public userName: string
    ) {}

    public static fromJson(QuestionJson: QuestionJson): Question {
        return new Question(
            QuestionJson.id,
            QuestionJson.courseRef,
            QuestionJson.claseRef,
            QuestionJson.userRef,
            QuestionJson.instructorRef,
            QuestionJson.respondida,
            QuestionJson.respuesta,
            QuestionJson.timestamp,
            QuestionJson.timestampRespuesta,
            QuestionJson.score,
            QuestionJson.respondidaInstructor,
            QuestionJson.respondidaAI,
            //QuestionJson.userName
            QuestionJson.pregunta,
            QuestionJson.mostrarPregunta
        )
    }

    public toJson(): QuestionJson {
        return {
            id:this.id,
            courseRef : this.courseRef,
            claseRef : this.claseRef,
            userRef : this.userRef,
            instructorRef : this.instructorRef,
            respondida : this.respondida,
            respuesta : this.respuesta,
            timestamp : this.timestamp,
            timestampRespuesta : this.timestampRespuesta,
            score : this.score,
            respondidaInstructor:this.respondidaInstructor,
            respondidaAI:this.respondidaAI,
            //userName: this.userName
            pregunta:this.pregunta,
            mostrarPregunta:this.mostrarPregunta

        }
    }
}