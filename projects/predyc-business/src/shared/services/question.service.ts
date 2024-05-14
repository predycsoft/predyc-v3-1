import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Question } from 'projects/shared/models/question.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class QuestionService {

  constructor(
    private afs: AngularFirestore,
  ) { }

  async addQueestion(newQuestion: Question): Promise<void> {
    const ref = this.afs.collection<Question>(Question.collection).doc().ref;
    await ref.set({...newQuestion.toJson(), id: ref.id}, { merge: true });
    newQuestion.id = ref.id;
  }

  getAllQuestions$(): Observable<Question[]> {
    return this.afs.collection<Question>(Question.collection).valueChanges();
  }

  getCourseQuestions$(courseRef): Observable<Question[]> {
    return this.afs.collection<Question>(Question.collection, (ref) =>ref.where("courseRef", "==", courseRef)).valueChanges();
  }

  answereQuestion(questionId: string, timestampRespuesta, respuesta: string) {
    this.afs.collection(Question.collection).doc(questionId).set({
      timestampRespuesta: timestampRespuesta,
      respondida: true,
      respuesta: respuesta
    }, {merge: true})
  } 

}
