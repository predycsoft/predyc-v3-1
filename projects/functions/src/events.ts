import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();


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

        return { success: true, message: 'Certificate document created and event updated successfully.' };
    } catch (error: any) {
        console.log(error);
        throw new functions.https.HttpsError("unknown", error.message);
    }
});


