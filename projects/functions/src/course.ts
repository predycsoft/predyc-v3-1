import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import cors from 'cors';
import { Curso } from 'shared';


const db = admin.firestore();
const corsHandler = cors({ origin: true });

export const getAllCourseIds = functions.https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
        try {
            const snapshot = await db.collection('course').get();
        
            if (snapshot.empty) {
              console.log('No matching documents.');
              res.status(404).send('No courses found.');
              return;
            }
        
            const courseIds: string[] = (snapshot).docs.map((article: any) => {
                const data = article.data()
                return data.id
            });
        
        
            res.status(200).send(courseIds);
            // res.status(200).json(courseIds);
        } catch (error) {
            console.error('Error retrieving course IDs: ', error);
            res.status(500).send('Error retrieving course IDs.');
        }
    })
  
});

export const onCourseUpdated = functions.firestore.document('course/{doc}').onUpdate(async (change, context) => {
    const afterData = change.after.data();
    const beforeData = change.before.data();

    let changed = false;
    for (const field in beforeData) {
      if(field === 'updatedAt') continue;

      const beforeValue = beforeData[field];
      const afterValue = afterData[field];

      // Si el campo es un DocumentReference
      if (beforeValue instanceof admin.firestore.DocumentReference) {
          changed = beforeValue.id !== (afterValue ? afterValue.id : null);
      } else {
          changed = JSON.stringify(beforeValue) !== JSON.stringify(afterValue);
      }

      if (changed) break;  // Si se detectó un cambio, sale del bucle  
      
  }

  // Si hubo un cambio y no es sólo el campo updatedAt
  if (changed && !(Object.keys(beforeData).length === 1 && 'updatedAt' in beforeData)) {
      return db.collection(Curso.collection).doc(afterData.id).update({
          updatedAt: new Date()
      })
      .then(() => {
          return console.log(`Updated course: ${afterData.titulo}`);
      })
      .catch((error) => {
          return console.error('Error updating updatedAt in activity document:', error);
      });
  }

  return null;

});

export const onCourseCreated = functions.firestore.document('course/{doc}').onCreate(async (snap, context) => {
    const data = snap.data();
    try {
        await db.collection(Curso.collection).doc(data.id).update({
            updatedAt: new Date()
        });
        console.log(`Update on created course: ${data.titulo}`);
    } catch (error) {
        console.error('Error updating updatedAt in course document:', error);
    }

    return null;

})
