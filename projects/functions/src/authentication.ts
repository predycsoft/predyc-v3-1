import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { _sendMail, _sendMailHTML } from "./email";
import { User, capitalizeFirstLetter, generateSixDigitRandomNumber, titleCase } from "shared";

const db = admin.firestore();



const firma = `<p>Saludos cordiales,</p>
<img src="https://predictiva21.com/wp-content/uploads/2024/06/LOGOPREDYC-BACKWHITE.webp" alt="Predyc" style="width: 150px; height: auto;">`;
const styleMail = `
<style>
  table {
    max-width: 100%;
    border-collapse: collapse;
  }
  th, td {
    border: 1px solid #dddddd;
    text-align: left;
    padding: 8px;
  }
  th {
    background-color: #f2f2f2;
  }
  .high {
    color: green;
  }
  .medium {
    color: orange;
  }
  .low {
    color: red;
  }
  .no-iniciado, .no-plan {
    color: gray;
  }
  .month-row {
    border: none;
    padding-top: 20px;
    font-weight: bold;
  }
  .month-name {
    padding-top: 20px;
    font-weight: bold;
    border: none;
    text-align: left;
  }
</style>`;



export const createUserWithEmailAndPassword = functions.https.onCall(async (data, _) => {
  try {
    const password = `${generateSixDigitRandomNumber()}`;
    const userRecord = await admin.auth().createUser({
      email: data.email,
      password: password,
    });

    // Enlace de restablecimiento de contraseña
    const link = await _generatePasswordResetLink(data.email);

    const sender = "capacitacion@predyc.com";

    const arrayName = data.name.split(" ")
    arrayName.map((word: string) => capitalizeFirstLetter(word))
    const name = arrayName.join(" ")


    const recipients = [data.email];
    const subject = "Bienvenido a Predyc, conoce tu usuario y contraseña temporal";
    const text = `Hola ${capitalizeFirstLetter(name)},\n\n¡Te damos la bienvenida a Predyc, tu plataforma de capacitación industrial! Ha sido creado tu usuario en nuestra plataforma , aquí está tu acceso inicial:\n\nUsuario: ${data.email}\nContraseña: ${password}\n\nCambia tu contraseña aquí: ${link}\n\nIngresa a Predyc aquí: https://predyc-user.web.app/auth/login\n\nPara cualquier consulta, estamos a tu disposición.\n\nSaludos,\nEl Equipo de Predyc`;
    // const cc = ["desarrollo@predyc.com", "liliana.giraldo@predyc.com"];
    const cc = ["desarrollo@predyc.com", "liliana.giraldo@predyc.com", "capacitacion@predyc.com"];
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
    const sender = "capacitacion@predyc.com";
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


export const createInstructorWithEmailAndPassword = functions.https.onCall(async (data, _) => {
  try {
    const password = `${generateSixDigitRandomNumber()}`;
    const userRecord = await admin.auth().createUser({
      email: data.email,
      password: password,
    });

    // Enlace de restablecimiento de contraseña
    const link = await _generatePasswordResetLink(data.email);

    const sender = "capacitacion@predyc.com";

    const arrayName = data.name.split(" ")
    arrayName.map((word: string) => capitalizeFirstLetter(word))
    const name = arrayName.join(" ")

    const recipients = [data.email];
    const subject = "Bienvenido a Predyc Instructores, conoce tu usuario y contraseña temporal";


    let correo = `<p>Hola <strong>${name}</strong>,</p>
    <p>Se han generado sus credenciales para la plataforma de instructores de <strong>PREDYC</strong>. 
    En esta plataforma podrá gestionar las preguntas que le dejan los alumnos y también las regalías que generan los cursos.</p>
    <p>Sus credenciales son las siguientes:</p>
    <p>Usuario: ${data.email}</p>
    <p>Contraseña: ${password}</p><br>
    <p>Puede ingresar a la plataforma mediante el siguiente enlace: <a href="https://predyc-empresa.web.app/login?email=${data.email}">Iniciar sesión</a>.</p>
    <p>Si lo desea, puede también cambiar su contraseña en el siguiente enlace: <a href="${link}">Cambiar contraseña</a>.</p>`;    
    let htmlMailFinal = `<!DOCTYPE html><html><head></head><body>${correo}<br>${firma}</body></html>`;
    const htmlContent = htmlMailFinal;
    const cc = ["desarrollo@predyc.com", "liliana.giraldo@predyc.com", "capacitacion@predyc.com"];
    // const mailObj = { sender, recipients, subject, text, cc };
    const mailObj = { sender, recipients, subject, cc, htmlContent};
    await _sendMailHTML(mailObj);

    return { uid: userRecord.uid };
  } catch (error: any) {
    console.log(error);
    throw new functions.https.HttpsError("unknown", error.message);
  }
});

export const rememberInstructorWithEmailAndPassword = functions.https.onCall(async (data, _) => {
  try {

    // Enlace de restablecimiento de contraseña
    const link = await _generatePasswordResetLink(data.email);

    const sender = "capacitacion@predyc.com";

    const arrayName = data.name.split(" ")
    arrayName.map((word: string) => capitalizeFirstLetter(word))
    const name = arrayName.join(" ")

    const recipients = [data.email];
    const subject = "Bienvenido a Predyc Instructores, conoce tu usuario";


    let correo = `<p>Hola <strong>${name}</strong>,</p>
    <p>Se ha habilitado su cuenta para la plataforma de instructores de <strong>PREDYC</strong>. 
    En esta plataforma podrá gestionar las preguntas que le dejan los alumnos y también las regalías que generan los cursos.</p>
    <p>Sus credenciales son las siguientes:</p>
    <p>Usuario: ${data.email}</p>
    <p>Puede ingresar a la plataforma mediante el siguiente enlace: <a href="https://predyc-empresa.web.app/login?email=${data.email}">Iniciar sesión</a>.</p>
    <p>Si lo desea, puede también cambiar su contraseña en el siguiente enlace: <a href="${link}">Cambiar contraseña</a>.</p>`;    
    let htmlMailFinal = `<!DOCTYPE html><html><head></head><body>${correo}<br>${firma}</body></html>`;
    const htmlContent = htmlMailFinal;
    const cc = ["desarrollo@predyc.com", "liliana.giraldo@predyc.com", "capacitacion@predyc.com"];
    // const mailObj = { sender, recipients, subject, text, cc };
    const mailObj = { sender, recipients, subject, cc, htmlContent};
    await _sendMailHTML(mailObj);
    return true ;
  } catch (error: any) {
    console.log(error);
    throw new functions.https.HttpsError("unknown", error.message);
  }
});
