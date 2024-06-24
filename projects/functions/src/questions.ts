import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { _sendMailHTML } from './email';
import { Question, titleCase } from 'shared';
const sharp = require('sharp');


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

export const sendEmailQuestionInstructor = functions.https.onCall(async (data, _) => {
  try {

    const questionId = data.questionId

    if(questionId){


      const questionRef = admin.firestore().collection(Question.collection).doc(questionId);
      const questionDoc = await questionRef.get();
      if (!questionDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'No se encontró la pregunta.');
      }
      const dataQuestion = questionDoc.data();

      if(!dataQuestion?.instructorRef){
        throw new functions.https.HttpsError('not-found', 'No se encontró el instructor.');
      }
      const instrcutorDoc = await dataQuestion?.instructorRef.get();
      if (!instrcutorDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'No se encontró el instructor.');
      }
      const dataInstrcutorDoc = instrcutorDoc.data();


      if(!dataQuestion?.courseRef){
        throw new functions.https.HttpsError('not-found', 'No se encontró el curso.');
      }
      const courseDoc = await dataQuestion?.courseRef.get();
      if (!courseDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'No se encontró el curso.');
      }
      const dataCourseDoc = courseDoc.data();


      if(!dataQuestion?.claseRef){
        throw new functions.https.HttpsError('not-found', 'No se encontró la clase.');
      }
      const claseDoc = await dataQuestion?.claseRef.get();
      if (!claseDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'No se encontró la clase.');
      }
      const dataClaseDoc = claseDoc.data();


      if(!dataQuestion?.userRef){
        throw new functions.https.HttpsError('not-found', 'No se encontró el estudiante.');
      }
      const userDoc = await dataQuestion?.userRef.get();
      if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'No se encontró el estudiante.');
      }
      const dataUserDoc = userDoc.data();

      const sender = "capacitacion@predyc.com";
      // const recipients = ['arturo.romero@predyc.com'];
      const recipients =  [dataInstrcutorDoc.email]
      let subject = `Tienes una nueva pregunta en tu curso ${dataCourseDoc.titulo}`;
      if(process.env.PRODUCTION !== "true"){
        subject += ` (PRUEBA)`;
      }
      let correo = `<p>Saludos <strong>${titleCase(dataInstrcutorDoc.nombre)}</strong>,</p>
      <p>Un estudiante de tu curso <strong>${dataCourseDoc.titulo}</strong> en la clase <strong>${dataClaseDoc.titulo}</strong> ha realizado la siguiente pregunta:</p>
      <p>${dataQuestion.pregunta}</p>
      <p>Te invitamos a contestarla a la brevedad posible para aclarar sus dudas y mantener la interacción activa de tu curso.</p>`;
      
      if (dataInstrcutorDoc.userRef) {
        correo += `<p>Para contestar, por favor accede a la plataforma de instructores con el siguiente enlace: <a href="https://predyc-empresa.web.app/login?email=${dataInstrcutorDoc.email}">Responder Pregunta</a>.</p>
        <p>Si tienes alguna duda, el equipo de Predyc estará disponible para asesorarte.</p>`;
      } else {
        correo += `<p>Para contestar, por favor responde este correo con el mensaje que deseas publicar.</p>
        <p><strong>También te invitamos a contactarnos para crear tu usuario de instructor y poder ver la clase y responder las preguntas desde ahí.</strong></p>
        <p>Si tienes alguna duda, el equipo de Predyc estará disponible para asesorarte.</p>`;
      }
      
      let htmlMailFinal = `<!DOCTYPE html><html><head></head><body><p>${correo}<br>${firma}</body></html>`;
      const htmlContent = htmlMailFinal;
      const cc = ["capacitacion@predyc.com"];
      const mailObj = { sender, recipients, subject, cc, htmlContent };
      _sendMailHTML(mailObj);


    }
    else{
      throw new functions.https.HttpsError('not-found', 'No se tiene el id de la pregunta.');
    }



  } catch (error: any) {
    console.log(error);
    throw new functions.https.HttpsError("unknown", error.message);
  }
});



