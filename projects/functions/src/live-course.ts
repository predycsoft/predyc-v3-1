import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { LiveCourse } from 'shared';
import { _sendMail, _sendMailHTML } from "./email";


const db = admin.firestore();

export const sendLiveCourseEmail = functions.https.onCall(async (data, _) => {
  try {

    // Send the email
    const sender = data.sender; const recipients = data.recipients; const subject = data.subject; const htmlContent = data.htmlContent; const cc = [""]
    const mailObj = { sender, recipients, subject, cc ,htmlContent};
    await _sendMailHTML(mailObj);

    // Update emailLastDate value
    const now = new Date();
    const liveCourseId = data.liveCourseId
    const liveCourseSonRef = db.collection(LiveCourse.collection).doc(liveCourseId)

    await liveCourseSonRef.update({
      emailLastDate: now
    })

    console.log("emailLasDate Updated")

  } catch (error: any) {
    console.log("ERROR: ", error);
    throw new functions.https.HttpsError("unknown", error.message);
  }
});