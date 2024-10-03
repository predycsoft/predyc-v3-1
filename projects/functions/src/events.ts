import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { _sendMailHTML } from './email';
import fetch from 'node-fetch';
import jspdf, { ImageOptions, jsPDF } from 'jspdf';
import * as QRCode from 'qrcode';
import { titleCaseWithExceptions } from 'shared';
const sharp = require('sharp');

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




let backCertificado: string = "https://predyc.com/assets/images/certificado/fondo_certificado_mea.jpg"



const db = admin.firestore();

async function downloadImage(url: string): Promise<Buffer> {
    console.log('downloadImage:',url)
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.buffer();
}

async function generatePDF(userData): Promise<{ filename: string, content: string }> {
    const doc = new jsPDF('l', 'mm', [297, 229]);
    

    const imgBufferbackCertificado = await downloadImage(backCertificado);
    const bufferbackCertificado = await sharp(imgBufferbackCertificado).toBuffer();
    const backCertificadoBase64 = `data:image/jpg;base64,${bufferbackCertificado.toString('base64')}`;

  
    doc.addImage(backCertificadoBase64, 'JPG', 0, 0, 297, 229,'','FAST');
    doc.setFontSize(27)
    //23, 169, 
    doc.setTextColor(23, 169, 245)
    doc.setFont('helvetica', 'bold')
    if(userData.name.length>=40){
      doc.setFontSize(userData.name.length/1.8) // mejorar 
    }
    const offsetX = 40;
    const textWidth = doc.getTextWidth(userData.name);
    const centerX = (297 - textWidth) / 2 + (offsetX+2);

    doc.setFont('helvetica', 'bold')
    doc.text(userData.name, centerX, 95); // Nombre del usuario centrado con offset


    doc.setFontSize(35)
    doc.setTextColor(29, 34, 36)
    doc.text('DIPLOMA DE', 150, 30); // Nombre del usuario centrado con offset
    doc.text('PARTICIPACIÓN', 140, 45); // Nombre del usuario centrado con offset


    // Generar la imagen QR
    const qrImage = await generateQrImage(userData.email);

    // Obtener la altura y el ancho de la página del PDF
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;

    // Definir el código de certificado (el ID dinámico)
    const codigoCertificado = userData.idCertificate; // ID del certificado dinámico

    // Agregar el texto del código de certificado justo a la izquierda del QR
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(183, 191, 198)
    doc.text('Código de diploma: ' + codigoCertificado, pageWidth - 80, 225) // Nombre usuario

    // Agregar la imagen del QR en la esquina inferior derecha
    doc.addImage(qrImage, 'PNG', pageWidth - 18, pageHeight - 18, 18, 18, '', 'FAST'); // Posicionar el QR en la esquina inferior derecha


    doc.setFont('helvetica', 'normal')
    doc.setFontSize(13)
    doc.setTextColor(29, 34, 36)

    const pdfDataUri = doc.output('datauristring');
    const base64Content = pdfDataUri.split(',')[1];
    const fileName = "Diploma "+titleCaseWithExceptions(userData.name)+" - "+'mantenimiento en acción'+'.pdf'


    return {
        filename: fileName,
        content: base64Content
    }; 
 }

async function generateQrImage(certificadoId: string): Promise<string> {
    const url = `https://predyc.com/mantenimiento-en-accion?email=${certificadoId}`;
    return QRCode.toDataURL(url, { width: 80 });
}


export const createEventCertificate = functions.https.onCall(async (data, context) => {
    try {
        const idEventoRegister = data.idEventoRegister;
        if (!idEventoRegister) {
            throw new functions.https.HttpsError("invalid-argument", "The function must be called with a valid idEventoRegister.");
        }

        const eventRef = admin.firestore().collection('eventosRegister').doc(idEventoRegister);
        const eventDoc = await eventRef.get();

        if (!eventDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Event not found.");
        }

        const eventData = eventDoc.data();

        const email = eventData?.email;
        const campana = eventData?.campana;
        const name = eventData?.name;
        const origen = eventData?.origen;

        if (!email || !campana || !name || !origen) {
            throw new functions.https.HttpsError("invalid-argument", "Missing required fields in event data.");
        }

        // Generar un nuevo ID de certificado manualmente
        const certificateRef = admin.firestore().collection('userCertificateEventos').doc(); 
        const idCertificate = certificateRef.id; // Obtener el ID generado por Firestore

        const dateCertificate = new Date(); // Fecha actual

        // Crear un nuevo documento en la colección userCertificateEventos con el ID generado
        const newCertificateData = {
            id: idCertificate, // Añadimos el ID generado
            idRegister: eventData.id,
            email: email,
            campana: campana,
            name: name,
            origen: origen,
            date: dateCertificate // Fecha actual
        };

        // Guardar el nuevo documento en la colección userCertificateEventos
        await certificateRef.set(newCertificateData);

        // Actualizar el documento original en 'eventosRegister' con hasCertificate, dateCertificate, e idCertificate
        await eventRef.update({
            hasCertificate: true,
            dateCertificate: dateCertificate, // Guardar la fecha del certificado
            idCertificate: idCertificate // ID del nuevo certificado creado
        });

        eventData.dateCertificate = dateCertificate
        eventData.idCertificate = idCertificate

        const pdf = await generatePDF(eventData)

        const sender = "capacitacion@predyc.com";
        // const recipients = ['arturo.romero@predyc.com'];
        const recipients =  [eventData['email']]
        const subject = `Has completado el evento Mantenimiento en acción en PREDYC`;
        let correo = `<strong>${titleCaseWithExceptions(eventData.name)}</strong>,</p><p>¡Felicidades por haber completado <strong>Mantenimiento en acción!</strong><a href="https://predyc.com/mantenimiento-en-accion?email=${eventData.email}"> Aquí</a> está tu diploma de participación.</p>
        <p>Te invitamos a compartir este logro con tu red profesional en LinkedIn. No olvides etiquetarnos con el hashtag #MantenimientoEnAccion para que podamos celebrar contigo este importante paso en tu desarrollo profesional.</p>
        <p>¡Estamos orgullosos de tu dedicación y compromiso!.</p>`;
        
        let htmlMailFinal = `<!DOCTYPE html><html><head></head><body><p>${correo}<br>${firma}</body></html>`;
        const htmlContent = htmlMailFinal;
        const adjunto = pdf
        const cc = ["capacitacion@predyc.com"];
        const mailObj = { sender, recipients, subject, cc, htmlContent,adjunto };
        //console.log(mailObj)
       _sendMailHTML(mailObj);
        return { success: true, message: 'Certificate document created and event updated successfully.' };
    } catch (error: any) {
        console.log(error);
        throw new functions.https.HttpsError("unknown", error.message);
    }
});


