import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import cors from 'cors';


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
