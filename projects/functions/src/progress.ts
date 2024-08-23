import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Curso, User } from 'shared';


const db = admin.firestore();

export const valorarCurso2 = functions.https.onCall(async (data, context) => {
    const usuarioId = context.auth?.uid;
    const cursoId = data['cursoId'];
    const valoracion = data['valoracion'];
    const usuarioNombreCompleto = data['usuarioNombreCompleto'];
    const usuarioPhotoURL = data['usuarioPhotoURL'];
    if (usuarioId) {
      const usuario: any = (await db.collection(User.collection).doc(usuarioId).get()).data();

    // ---------
    //   // colocar la valoracion en el progreso del usuario
    //   await db.collection('cursos').doc(cursoId).collection('inscritos').doc(usuario.email).update(
    //     {
    //       valorado: true,
    //       valoracion: valoracion.global,
    //     }
    //   ).catch((error) => {
    //     return console.log(error);
    //   });
    // ---------

    // Guardar en la coleccion de valoraciones
    await db.collection('cursosValoraciones').doc(cursoId).set(
    {
        [usuario.email]: {
        valoracion: valoracion,
        usuarioId: usuarioId,
        cursoId: cursoId,
        usuarioNombreCompleto: usuarioNombreCompleto,
        usuarioPhotoURL: usuarioPhotoURL,
        },
    },
    { merge: true }
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
      return null;
    }
});