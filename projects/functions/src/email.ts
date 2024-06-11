import * as SMTPTransport from "nodemailer/lib/smtp-transport";
import * as functions from "firebase-functions";
import * as nodemailer from "nodemailer";
import * as admin from "firebase-admin";

const db = admin.firestore();


export const _sendMailHTML = async (data: { sender: string; recipients: string[]; subject: string; cc: string[];htmlContent:string }) => {
  const APP_NAME = "Predyc";

  // let sender = process.env.EMAIL_USER_A
  // let password = process.env.EMAIL_PASSWORD_A

  let sender = process.env.EMAIL_USER_D;
  let password = process.env.EMAIL_PASSWORD_D;

  // if (["contacto@predyc.com", "capacitacion@predyc.com"].includes(data.sender) ){
  //     sender = process.env.EMAIL_USER_A
  //     password = process.env.EMAIL_PASSWORD_A
  // }
  // else if (data.sender === "ventas@predyc.com") {
  //     sender = process.env.EMAIL_USER_L
  //     password = process.env.EMAIL_PASSWORD_L
  // }

  const smtpTransport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: sender,
      pass: password,
    },
    tls: {
      // do not fail on invalid certs
      rejectUnauthorized: false,
    },
  } as SMTPTransport.Options);
  const mailOptions = {
    from: `${APP_NAME} <${data.sender}>`,
    to: process.env.PRODUCTION === "true" ? data.recipients : ["desarrollo@predyc.com"],
    // to: ['diegonegrette42@gmail.com'],
    subject: data.subject,
    html: data.htmlContent,
    cc: data.cc,
  };
  try {
    smtpTransport.sendMail(mailOptions, (error: any, info: any) => {
      if (error) {
        console.log("smtp transport error: ", error);
        smtpTransport.close();
      }
      else {
        console.log("Correo enviado!", mailOptions);
      }
      return "mail sent";
    });
  } catch (error: any) {
    console.log("Hubo un error");
    console.log(error);
    throw new functions.https.HttpsError("unknown", error.message);
  }
};

export const _sendMail = async (data: { sender: string; recipients: string[]; subject: string; text: string; cc: string[];htmlText?:string }) => {
  const APP_NAME = "Predyc";

  // let sender = process.env.EMAIL_USER_A
  // let password = process.env.EMAIL_PASSWORD_A

  let sender = process.env.EMAIL_USER_D;
  let password = process.env.EMAIL_PASSWORD_D;

  // if (["contacto@predyc.com", "capacitacion@predyc.com"].includes(data.sender) ){
  //     sender = process.env.EMAIL_USER_A
  //     password = process.env.EMAIL_PASSWORD_A
  // }
  // else if (data.sender === "ventas@predyc.com") {
  //     sender = process.env.EMAIL_USER_L
  //     password = process.env.EMAIL_PASSWORD_L
  // }

  const smtpTransport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: sender,
      pass: password,
    },
    tls: {
      // do not fail on invalid certs
      rejectUnauthorized: false,
    },
  } as SMTPTransport.Options);
  const mailOptions = {
    from: `${APP_NAME} <${data.sender}>`,
    to: process.env.PRODUCTION === "true" ? data.recipients : ["desarrollo@predyc.com"],
    // to: ['diegonegrette42@gmail.com'],
    subject: data.subject,
    text: data.text,
    html: data.htmlText,
    cc: data.cc,
  };
  try {
    smtpTransport.sendMail(mailOptions, (error: any, info: any) => {
      if (error) {
        console.log("smtp transport error: ", error);
        smtpTransport.close();
      }
      else {
        console.log("Correo enviado!", mailOptions);
      }
      return "mail sent";
    });
  } catch (error: any) {
    console.log("Hubo un error");
    console.log(error);
    throw new functions.https.HttpsError("unknown", error.message);
  }
};

export const sendMail = functions.https.onCall(async (data, context) => {
  _sendMail(data);
});