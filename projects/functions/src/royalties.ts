import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();



export const getRoyaltiesInstructor = functions.https.onCall(async (data, _) => {
  try {
    const idInstructor = data.idInstructor;

    console.log('idInstructor', idInstructor);

    const snapshot = await db.collection('royalties').where('borrador', '==', false).get();

    if (snapshot.empty) {
      throw new functions.https.HttpsError('not-found', 'No se encontraro datos.');
    }

    const datos = snapshot.docs.map(doc => doc.data());

    datos.forEach(royalties => {
      delete royalties.totalPredyc;
      delete royalties.totalInstructores;
      delete royalties.amount;
      let instructorData = royalties.instructores.find(x => x.id == idInstructor);
      if(instructorData.porcentaje == 0){
        delete instructorData.montoTotal
        delete instructorData.montoPredyc
        delete instructorData.montoInstructor

        instructorData.cursos.forEach(curso => {
          delete curso.montoTotal
          delete curso.montoPredyc
          delete curso.montoInstructor
        });
      }
      delete royalties.instructores;
      royalties.instructores = instructorData ? [instructorData] : null
    });

    console.log('datos',datos)

    return  datos ;
  } catch (error: any) {
    console.log(error);
    throw new functions.https.HttpsError("unknown", error.message);
  }
});







  