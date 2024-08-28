import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Curso, User } from 'shared';

const db = admin.firestore();
const courseRatingsCollection: string = "cursosValoraciones"

export const valorarCurso2 = functions.https.onCall(async (data, context) => {
  const userId = data.userId;
  const courseId = data.courseId;
  const valoracion = data.valoracion;

  if (courseId && userId && valoracion) {
    // Reconstruct DocumentReference from IDs
    const userRef = db.collection(User.collection).doc(userId);
    const courseRef = db.collection(Curso.collection).doc(courseId);

    // Guardar en la coleccion de valoraciones
    const ref = db.collection(courseRatingsCollection).doc();
    await ref.set(
      {
        valoracion: valoracion,
        userRef: userRef,
        courseRef: courseRef,
        id: ref.id
      }, { merge: true }
    ).catch((error) => {
      return console.log(error);
    });

    // ---------
    //   const indice: any = (await db.collection('cursosValoraciones').doc(cursoId).get()).data();
    //   const valoraciones: any[] = Object.keys(indice).map((key) => indice[key]);
    //   let promedio = 0;
    //   for (let index = 0; index < valoraciones.length; index++) {
    //     const element = valoraciones[index];
    //     promedio += element.valoracion.global;
    //   }
    //   promedio = promedio / valoraciones.length;
    //   return db.collection(Curso.collection).doc(cursoId).update({
    //     valoracion: promedio,
    //   });
    // ---------

    } else {
      console.log("courseId", courseId)
      console.log("userId", userId)
      console.log("valoracion", valoracion)
      return null;
    }
});