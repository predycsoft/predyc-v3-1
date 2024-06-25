import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

export const getArticlesId = functions.https.onRequest(async (req, res) => {
    if (req.method !== "GET") throw new Error("Method not allowed");
    const articlesId = (
        await (db.collection("articles"))
            .get()
    ).docs.map((article) => article.id);
    res.status(200).send(articlesId);
});