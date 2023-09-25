import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// const db = admin.firestore();

export const createUserWithEmailAndPassword = functions.https.onCall(
    async (data, _) => {
        try {
            // data should contain the email and password
            const userRecord = await admin.auth().createUser({
              email: data.email,
              password: data.password,
            });
            return { uid: userRecord.uid };
        } catch (error: any) {
            throw new functions.https.HttpsError('unknown', error.message);
        }
        
    }
  );