import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
// import { LiveCourse } from 'shared';
import { _sendMail } from "./email";


const db = admin.firestore();

export const sendLiveCourseEmail = functions.https.onCall(async (data, _) => {
  try {

    // Send the email
    const sender = data.sender; const recipients = data.recipients; const subject = data.subject; const text = data.text; const cc = [""]
    const mailObj = { sender, recipients, subject, text, cc};
    await _sendMail(mailObj);

    // Update emailLastDate value
    const now = new Date();
    const liveCourseId = data.liveCourseId
    const liveCourseSonId = data.liveCourseSonId
    // const liveCourseSonRef = db.collection(LiveCourse.collection).doc(liveCourseId).collection(LiveCourseSon.subCollection).doc(liveCourseSonId);
    const liveCourseSonRef = db.collection("live-course").doc(liveCourseId).collection("live-course-son").doc(liveCourseSonId);

    await liveCourseSonRef.update({
        emailLastDate: now
    })

    console.log("emailLasDate Updated")

  } catch (error: any) {
    console.log("ERROR: ", error);
    throw new functions.https.HttpsError("unknown", error.message);
  }
});