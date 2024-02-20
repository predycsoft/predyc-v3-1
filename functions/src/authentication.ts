import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { _sendMail } from './email'

const db = admin.firestore();

export const createUserWithEmailAndPassword = functions.https.onCall(
    async (data, _) => {
        try {
            // data should contain the email and password
            console.log(data)
            const userRecord = await admin.auth().createUser({
              email: data.email,
              password: data.password,
            });

            // Enlace de restablecimiento de contraseña
            await _generatePasswordResetLink(data.email)
            
            return { uid: userRecord.uid };
        } catch (error: any) {
            console.log(error)
            throw new functions.https.HttpsError('unknown', error.message);
        } 
    }
);

export const _generatePasswordResetLink = async (email: string) => {
    const link = await admin.auth().generatePasswordResetLink(email);
    // const sender = "capacitacion@predyc.com"
    const sender = "desarrollo@predyc.com"
    const recipients = [email]
    const subject = "Reestablece tu contraseña"
    const text = `Hola, \nHaz clic en el siguiente enlace para establecer tu contraseña: ${link}`
    const mailObj = {sender, recipients, subject, text,}
    await _sendMail(mailObj)
}

export const generatePasswordResetLink = functions.https.onCall(
    async (data, _) => {
        try {
            await _generatePasswordResetLink(data.email)
        } catch (error: any) {
            console.log(error)
            throw new functions.https.HttpsError('unknown', error.message);
        } 
    }
);

const batchSize = 10

export const emptyDatabase = functions.https.onCall(
    async (data, _) => {
        try {
            const users = await db.collection('user').listDocuments()
            const uids = users.map(user => user.id)
            const collections = [
                // 'activity',
                'category',
                'class',
                'coupon',
                'classByStudent',
                'course',
                'coursesByStudent',
                'department',
                'general',
                'instructors',
                'license',
                'notification',
                'price',
                'product',
                'profile',
                'skill',
                'user',
                'enterprise',
                'userProfile'
            ]
            // for (let collection of collections) {
            //     await deleteCollection(collection)
            // }
            // await admin.auth().deleteUsers(uids)
        } catch (error: any) {
            console.log(error)
            throw new functions.https.HttpsError('unknown', error.message);
        } 
    }
);

// async function deleteCollection(
//     collectionPath: string,
// ): Promise<number> {
//     const collectionRef = db.collection(collectionPath);
//     const query = collectionRef.orderBy('__name__').limit(batchSize);
//     const snapshot = await query.get();

//     // When there are no documents left, we are done
//     if (snapshot.size === 0) {
//         return 0;
//     }

//     const batch = db.batch();
//     console.log(snapshot.docs)
//     snapshot.docs.forEach(async doc => {
//         batch.delete(doc.ref);
//         // const subcollections = await doc.ref.listCollections();
//         // subcollections.forEach(async subcollection => {
//         //     await deleteCollection(subcollection.path, batchSize);
//         // });
//     });

//     await batch.commit();

//     return 1;
// }