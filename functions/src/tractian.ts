import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { _sendMail } from './email'

const db = admin.firestore();

interface SocialNetworks {
    facebook: string | null
    instagram: string | null
    website: string | null
    linkedin: string | null
}

interface Enterprise {
    city: string | null
    country: string | null
    name: string
    photoUrl: string | null
    zipCode: number | null
    workField: string | null
    socialNetworks: SocialNetworks
}

interface User {
    birthdate: number | null
    city: string | null
    country: string | null
    currentlyWorking: boolean // Maybe should be true by default
    email: string
    gender: string | null
    industry: string | null
    job: string | null
    name: string
    phoneNumber: string | null
    photoUrl: string | null
    zipCode: number | null
}

interface TractianInfo { 
    user: User
    enterprise: Enterprise
}

export const createTractianUser = functions.https.onCall(
    async (data: TractianInfo, _) => {
        try {
            // data should contain tractian Info
            console.log("Tractian API working!", data)
            // const userRecord = await admin.auth().createUser({
            //   email: data.email,
            //   password: data.password,
            // });

            // Enlace de restablecimiento de contraseña
            // await _generatePasswordResetLink(data.email)
            
            return true
            // return { uid: userRecord.uid };
        } catch (error: any) {
            console.log(error)
            throw new functions.https.HttpsError('unknown', error.message);
        } 
    }
);

// export const _generatePasswordResetLink = async (email: string) => {
//     const link = await admin.auth().generatePasswordResetLink(email);
//     // const sender = "capacitacion@predyc.com"
//     const sender = "desarrollo@predyc.com"
//     const recipients = [email]
//     const subject = "Bienvenido a Predyc"
//     const text = `Hola,\nHaz clic en el siguiente enlace para establecer tu contraseña: ${link}`
//     const mailObj = {sender, recipients, subject, text,}
//     await _sendMail(mailObj)
// }