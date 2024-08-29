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

    // const indice: any = (await db.collection('cursosValoraciones').where("courseRef", "==", courseRef).get());
    
    // const valoraciones: any[] = Object.keys(indice).map((key) => indice[key]);
    // let promedio = 0;
    // for (let index = 0; index < valoraciones.length; index++) {
    //   const element = valoraciones[index];
    //   promedio += element.valoracion.global;
    // }
    // console.log("Promedio", promedio)
    // promedio = promedio / valoraciones.length;
    // await db.collection(Curso.collection).doc(courseId).update({
    //   reviewsScore: promedio,
    //   reviewsQty: valoraciones.length
    // });

    const indiceSnapshot = await db.collection('cursosValoraciones').where("courseRef", "==", courseRef).get();
    const valoraciones: any[] = [];
    indiceSnapshot.forEach(doc => {
        valoraciones.push(doc.data());
    });
    let promedio = 0;
    for (let index = 0; index < valoraciones.length; index++) {
        const element = valoraciones[index];
        promedio += element.valoracion.global;
    }
    if (valoraciones.length > 0) {
        promedio = promedio / valoraciones.length;
    } else {
        promedio = 0; // Si no hay valoraciones, el promedio es 0
    }
    console.log("Promedio", promedio);
    await db.collection(Curso.collection).doc(courseId).update({
        reviewsScore: promedio,
        reviewsQty: valoraciones.length
    });

    } else {
      console.log("courseId", courseId)
      console.log("userId", userId)
      console.log("valoracion", valoracion)
      return null;
    }
});