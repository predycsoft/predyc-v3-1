import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { _sendMail } from './email'

// import { generateSixDigitRandomNumber } from '../../src/shared/utils'
import { DocumentReference } from 'firebase-admin/firestore';

const db = admin.firestore();

interface SocialNetworks {
    facebook: string | null
    instagram: string | null
    website: string | null
    linkedin: string | null
}

interface EnterpriseData {
    city: string | null
    country: string | null
    name: string
    photoUrl: string | null
    zipCode: number | null
    workField: string | null
    socialNetworks: SocialNetworks
}

interface UserData {
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
    user: UserData
    enterprise: EnterpriseData
}

const createUser = async (user: UserData): Promise<DocumentReference | string | boolean> => {
    // const password = generateSixDigitRandomNumber()
    console.log("Import works!", "asdasda")
    // const userRecord = await admin.auth().createUser({
    //     email: user.email,
    //     password: password.toString(),
    // });
    return true
}

const createEnterprise = async (enterprise: EnterpriseData) => {
    // db.collection(Enterprise.collection)
}

export const createTractianUser = functions.https.onRequest(
    async (req, res) => {
        try {
            console.log("test nuevo")
            if (req.method !== 'POST') throw new Error("Method not allowed")
            // data should contain tractian Info
            const tractianInfo = req.body as TractianInfo
            const enterprise = tractianInfo.enterprise
            const user = tractianInfo.user
            console.log("Tractian API working!", tractianInfo)
            console.log("User", tractianInfo.user)
            console.log("Enterprise", tractianInfo.enterprise)
            // Create Enterprise
            // const enterpriseRef = await createEnterprise(enterprise)
            // Create User
            const userRef = await createUser(user)
            // Create Subscription
            // Send Mail
            // const userRecord = await admin.auth().createUser({
            //   email: data.email,
            //   password: data.password,
            // });

            // Enlace de restablecimiento de contraseña
            // await _generatePasswordResetLink(data.email)
            
            res.status(200).send({password: userRef})
            // res.status(200).send(tractianInfo)
            // return { uid: userRecord.uid };
        } catch (error: any) {
            // if (error?.message === 'Method not allowed') res.status(500).send(error.message)
            res.status(500).send({
                message: error?.message
            })
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