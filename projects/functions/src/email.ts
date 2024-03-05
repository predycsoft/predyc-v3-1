import * as SMTPTransport from 'nodemailer/lib/smtp-transport';
import * as functions from 'firebase-functions';
import * as nodemailer from 'nodemailer';
import * as admin from 'firebase-admin';


const db = admin.firestore();


export const _sendMail = async (data: {sender: string, recipients: string[], subject: string, text: string}) => {
    const APP_NAME = 'Predyc';

    let sender = process.env.EMAIL_USER_D
    let password = process.env.EMAIL_PASSWORD_D

    if (["contacto@predyc.com", "capacitacion@predyc.com"].includes(data.sender) ){
        sender = process.env.EMAIL_USER_A
        password = process.env.EMAIL_PASSWORD_A
    }
    else if (data.sender === "ventas@predyc.com") {
        sender = process.env.EMAIL_USER_L
        password = process.env.EMAIL_PASSWORD_L
    }

    const smtpTransport = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
        user: sender,
        pass: password,
        },
    } as SMTPTransport.Options);
    const mailOptions = {
        from: `${APP_NAME} <${data.sender}>`,
        to: process.env.PRODUCTION === "true" ? data.recipients : ['desarrollo@predyc.com'],
        // to: ['diegonegrette42@gmail.com'],
        subject: data.subject,
        text: data.text,
    };
    try {
        smtpTransport.sendMail(mailOptions, (error: any, info: any) => {
        if (error) {
            console.log('hubo error');
            console.log(error);
            smtpTransport.close();
        }
        console.log("Correo enviado!", {sender, subject: data.subject, text: data.text})
        return 'mail sent';
        });
    } catch (error: any) {
        console.log("error")
        console.log(error)
        throw new functions.https.HttpsError('unknown', error.message);
        ;
    }
};
  
export const sendMail = functions.https.onCall(async (data, context) => {
    _sendMail(data);
});


// ************* Hace falta aqui o en predycv2 es suficiente ? ******************
// const getStudentsBasedOnDaysToCoursesEndDateForAdmin = async (daysToEndDate: number) => {
//     let empresasCheck = {};
//     let coursesUsersInfo: any = [];
//     let programsUsersInfo: any = [];

//     const empresas = (await db.collection('empresasCliente').get()).docs.map(
//         (empresa) => empresa.id
//         // (empresa) => empresa.data()
//     );
//     for (let empresa of empresas) {
//         const admins = (
//         await db.collection('empresasCliente').doc(empresa).get()
//         ).data().admins;
//         const nombreEmpresa = (
//         await db.collection('empresasCliente').doc(empresa).get()
//         ).data().nombre;

//         empresasCheck[empresa] = {
//         nombre: nombreEmpresa,
//         admins,
//         coursesUsers: [],
//         programsUsers: [],
//         };

//         const inscripcionDoc = (
//         await db
//             .collection('empresasCliente')
//             .doc(empresa)
//             .collection('inscripcion')
//             .doc('cronogramas')
//             .get()
//         ).data();
//         if (inscripcionDoc) {
//         const cronogramas = Object.keys(inscripcionDoc).map(
//             (k) => inscripcionDoc[k]
//         );
//         cronogramas.forEach((cronograma) => {
//             cronograma.cursos.forEach((curso) => {
//             const today = new Date();
//             today.setDate(today.getDate() + daysToEndDate);
//             const endDate = new Date(curso.fechaFin);
//             if (
//                 today.getDate() == endDate.getDate() &&
//                 today.getMonth() == endDate.getMonth() &&
//                 today.getFullYear() == endDate.getFullYear()
//             ) {
//                 cronograma.inscritos.forEach((inscrito) => {
//                 if (cronograma.programaId) {
//                     if (programsUsersInfo[cronograma.programaTitulo]) {
//                     programsUsersInfo[cronograma.programaTitulo].push({
//                         empresaId: empresa,
//                         userId: inscrito.uid,
//                         correo: inscrito.correo,
//                         nombre: inscrito.nombre,
//                         curso: curso.titulo,
//                         fechaLimite: curso.fechaFin,
//                         origen: cronograma.origen ? cronograma.origen : null,
//                         programaTitulo: cronograma.programaTitulo,
//                     });
//                     } else {
//                     programsUsersInfo[cronograma.programaTitulo] = [
//                         {
//                         empresaId: empresa,
//                         userId: inscrito.uid,
//                         correo: inscrito.correo,
//                         nombre: inscrito.nombre,
//                         curso: curso.titulo,
//                         fechaLimite: curso.fechaFin,
//                         origen: cronograma.origen ? cronograma.origen : null,
//                         programaTitulo: cronograma.programaTitulo,
//                         },
//                     ];
//                     }
//                 } else {
//                     coursesUsersInfo.push({
//                     empresaId: empresa,
//                     userId: inscrito.uid,
//                     correo: inscrito.correo,
//                     nombre: inscrito.nombre,
//                     curso: curso.titulo,
//                     fechaLimite: curso.fechaFin,
//                     origen: cronograma.origen ? cronograma.origen : null,
//                     programaTitulo: null,
//                     });
//                 }
//                 });
//             }
//             });
//         });
//         }
//     }

//     Object.keys(programsUsersInfo).forEach((user) => {
//         empresasCheck[programsUsersInfo[user][0].empresaId].programsUsers.push({
//         [user]: programsUsersInfo[user],
//         });
//     });

//     coursesUsersInfo.forEach((user) => {
//         empresasCheck[user.empresaId].coursesUsers.push(user);
//     });

//     const dataToDelete = empresas.filter(
//         (empresa) =>
//         empresasCheck[empresa].coursesUsers.length == 0 &&
//         empresasCheck[empresa].programsUsers.length == 0
//     );
//     dataToDelete.forEach((element) => {
//         delete empresasCheck[element];
//     });

//     return empresasCheck;
// };

// export const checkCourseEndDateAndNotifyAdmin3DaysAfter = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
//     const companiesInfo = await getStudentsBasedOnDaysToCoursesEndDateForAdmin(-3);
//     // console.log(companiesInfo)

//     Object.keys(companiesInfo).forEach((company) => {
//         const companyInfo = companiesInfo[company];
//         console.log('Datos de la empresa:');
//         console.log(companyInfo);

//         const admins = companyInfo.admins;
//         const coursesUsers = companyInfo.coursesUsers;
//         const programsUsers = companyInfo.programsUsers;

//         console.log('Datos de programsUsers: ');
//         console.log(programsUsers);

//         admins.forEach((admin) => {
//             const recipients = [admin];
//             let subject = '';

//             if (coursesUsers.length > 0) {
//             let text = ``;
//             subject = `Recordatorio: Retraso en curso asignado`;

//             text =
//                 text +
//                 `Hola ${companyInfo.nombre}
//             \nTe informamos que existe un retraso en uno de tus cursos asignados de manera individual, obtén una relación de los usuarios:`;

//             for (let index = 0; index < coursesUsers.length; index++) {
//                 text =
//                 text +
//                 `\n${index + 1}- ${
//                     coursesUsers[index].nombre
//                 }, estatus: Retrasado `;
//             }
//             text =
//                 text +
//                 `\nTe recomendamos revisar tu administrador para verificar el estatus de tus colaboradores.\n\n`;
//             text =
//                 text + `Ingresa al administrador: https://empresa.predyc.com/ \n\n`;
//             text = text + `Equipo de Predyc `;

//             _sendMail({ text, subject, recipients });
//             }

//             if (programsUsers.length > 0) {
//             programsUsers.forEach((program) => {
//                 let text = ``;
//                 subject = `Recordatorio: Retraso en plan de formación - ${Object.keys(
//                 program
//                 )}`;

//                 text =
//                 text +
//                 `Hola ${companyInfo.nombre}
//             \nTe informamos que existe un retraso en tu plan de formación ${Object.keys(
//                 program
//             )}, encuentra una relación de los usuarios: \n`;

//                 Object.values(program).forEach((element) => {
//                 (<any>element).forEach((el, i) => {
//                     text = text + `${i + 1}- ${el.nombre}, estatus: Retrasado\n`;
//                 });
//                 });

//                 text =
//                 text +
//                 `\nTe recomendamos revisar tu administrador para verificar el estatus de tus colaboradores.\n\n`;
//                 text =
//                 text +
//                 `Ingresa al administrador: https://empresa.predyc.com/ \n\n`;
//                 text = text + `Equipo de Predyc `;

//                 _sendMail({ text, subject, recipients });
//             });
//             }
//         });
//     });
// });