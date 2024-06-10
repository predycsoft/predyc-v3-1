import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { _sendMail } from "./email";
import { User, capitalizeFirstLetter, generateSixDigitRandomNumber } from "shared";

const db = admin.firestore();

export const createUserWithEmailAndPassword = functions.https.onCall(async (data, _) => {
  try {
    const password = `${generateSixDigitRandomNumber()}`;
    const userRecord = await admin.auth().createUser({
      email: data.email,
      password: password,
    });

    // Enlace de restablecimiento de contraseña
    const link = await _generatePasswordResetLink(data.email);

    const sender = "desarrollo@predyc.com";

    const arrayName = data.name.split(" ")
    arrayName.map((word: string) => capitalizeFirstLetter(word))
    const name = arrayName.join(" ")


    const recipients = [data.email];
    const subject = "Bienvenido a Predyc, conoce tu usuario y contraseña temporal";
    const text = `Hola ${capitalizeFirstLetter(name)},\n\n¡Te damos la bienvenida a Predyc, tu plataforma de capacitación industrial! Ha sido creado tu usuario en nuestra plataforma , aquí está tu acceso inicial:\n\nUsuario: ${data.email}\nContraseña: ${password}\n\nCambia tu contraseña aquí: ${link}\n\nIngresa a Predyc aquí: https://predyc-user.web.app/auth/login\n\nPara cualquier consulta, estamos a tu disposición.\n\nSaludos,\nEl Equipo de Predyc`;
    const cc = ["desarrollo@predyc.com", "liliana.giraldo@predyc.com"];
    const mailObj = { sender, recipients, subject, text, cc };
    await _sendMail(mailObj);

    return { uid: userRecord.uid };
  } catch (error: any) {
    console.log(error);
    throw new functions.https.HttpsError("unknown", error.message);
  }
});

export const deleteUser = functions.https.onCall(async (data, _) => {
  try {
    admin.auth().deleteUser(data.userId);
    return true
  } catch (error: any) {
    console.log(error);
    throw new functions.https.HttpsError("unknown", error.message);
  }
});

export const _generatePasswordResetLink = async (email: string): Promise<string> => {
  return admin.auth().generatePasswordResetLink(email);
};

export const generatePasswordResetLink = functions.https.onCall(async (data, _) => {
  try {
    const link = await _generatePasswordResetLink(data.email);
    const sender = "desarrollo@predyc.com";
    const recipients = [data.email];
    const subject = "Restablece tu contraseña en Predyc";
    const text = `Hola,\nHaz clic en el siguiente enlace para establecer tu contraseña: ${link}`;
    const cc = ["desarrollo@predyc.com"];
    const mailObj = { sender, recipients, subject, text, cc };
    await _sendMail(mailObj);
  } catch (error: any) {
    console.log(error);
    throw new functions.https.HttpsError("unknown", error.message);
  }
});

const batchSize = 10;

export const emptyDatabase = functions.https.onCall(async (data, _) => {
  try {
    const users = await db.collection(User.collection).listDocuments();
    const uids = users.map((user) => user.id);
    const collections = [
      // 'activity',
      "category",
      "class",
      "coupon",
      "classByStudent",
      "course",
      "coursesByStudent",
      "department",
      "general",
      "instructors",
      "license",
      "notification",
      "price",
      "product",
      "profile",
      "skill",
      "user",
      "enterprise",
      "userProfile",
    ];
    // for (let collection of collections) {
    //     await deleteCollection(collection)
    // }
    // await admin.auth().deleteUsers(uids)
  } catch (error: any) {
    console.log(error);
    throw new functions.https.HttpsError("unknown", error.message);
  }
});

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
