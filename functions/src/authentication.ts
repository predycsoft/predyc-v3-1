import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { _sendMail } from './email'

// const db = admin.firestore();

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
            const link = await admin.auth().generatePasswordResetLink(data.email);

            const sender = "capacitacion@predyc.com"
            const recipients = [data.email]
            const subject = "Reestablece tu contraseña"
            const text = `Hola, \nHaz clic en el siguiente enlace para establecer tu contraseña: ${link}`
            
            await _sendMail({sender, recipients, subject, text,})
            console.log("Email enviado")
            
            return { uid: userRecord.uid };
        } catch (error: any) {
            console.log(error)
            throw new functions.https.HttpsError('unknown', error.message);
        } 
    }
  );