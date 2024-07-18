import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import express from 'express';
import cors from 'cors';

const db = admin.firestore();

export const getArticlesSlug = functions.https.onRequest(async (req, res) => {
    if (req.method !== "GET") throw new Error("Method not allowed");
    const articlesSlug = (await (db.collection("article")).get()).docs.map((article: any) => {
      const data = article.data()
      return data
    });
    res.status(200).send(articlesSlug);
});

//TESTING SIDEMAP
const bucket = admin.storage().bucket();
const app = express();

app.use(cors({ origin: true }));

app.get('/sitemap.xml', async (req, res) => {
  try {
    const file = bucket.file('uploads/sitemap.xml');
    const [metadata] = await file.getMetadata();
    res.set('Content-Type', metadata.contentType);
    const readStream = file.createReadStream();
    readStream.pipe(res);
  } catch (error) {
    console.error('Error serving sitemap:', error);
    res.status(500).send('Error serving sitemap');
  }
});

export const api = functions.https.onRequest(app);
