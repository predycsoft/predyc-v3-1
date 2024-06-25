import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

export const getArticlesSlug = functions.https.onRequest(async (req, res) => {
    if (req.method !== "GET") throw new Error("Method not allowed");
    const articlesSlug = (
        await (db.collection("article"))
            .get()
    ).docs.map((article: any) => {
        const data = article.data()
        return {
            slug: data.slug,
            updatedAt: data.updatedAt
        }
    });
    res.status(200).send(articlesSlug);
});