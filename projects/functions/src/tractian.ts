import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { _sendMail } from "./email";

import { CollectionReference, DocumentReference } from "firebase-admin/firestore";
import {
	Enterprise,
	EnterpriseJson,
	ProductJson,
	Product,
	User,
	UserJson,
	Subscription,
	SubscriptionJson,
	capitalizeFirstLetter,
	generateSixDigitRandomNumber,
} from "shared";
import { _generatePasswordResetLink } from "./authentication";

const db = admin.firestore();

interface SocialNetworks {
	facebook: string | null;
	instagram: string | null;
	website: string | null;
	linkedin: string | null;
}

interface EnterpriseData {
	city: string | null;
	country: string | null;
	name: string;
	photoUrl: string | null;
	zipCode: number | null;
	workField: string | null;
	socialNetworks: SocialNetworks;
}

interface UserData {
	birthdate: number | null;
	city: string | null;
	country: string | null;
	currentlyWorking: boolean; // Maybe should be true by default
	email: string;
	gender: string | null;
	industry: string | null;
	job: string | null;
	name: string;
	phoneNumber: string | null;
	photoUrl: string | null;
	zipCode: number | null;
}

interface TractianInfo {
	user: UserData;
	enterprise: EnterpriseData;
}

const createUser = async (
	userData: UserData,
	enterpriseRef: DocumentReference<EnterpriseJson>
): Promise<{ userRef: DocumentReference<UserJson>; password: string }> => {
	const password = generateSixDigitRandomNumber().toString();
	const userRecord = await admin.auth().createUser({
		email: userData.email,
		password: password,
	});
	const user = User.getEnterpriseStudentUser(enterpriseRef);
	user.patchValue(userData);
	console.log("User", user);
	const collectionReference: CollectionReference<UserJson> = db.collection(
		User.collection
	) as CollectionReference<UserJson>;
	const userRef = collectionReference.doc(userRecord.uid);
	await userRef.set({
		...user.toJson(),
		uid: userRecord.uid,
	});
	return { userRef, password };
};

const createSubscription = async (
	userRef: DocumentReference<UserJson>,
	productRef: DocumentReference<ProductJson>,
	startDate: number,
	endDate: number
) => {
	const subscriptionJson = {
		id: "PRE_" + +new Date(),
		createdAt: +new Date(),
		changedAt: null,
		startedAt: startDate,
		currency: "usd",
		currentPeriodStart: startDate,
		currentPeriodEnd: endDate,
		userRef: userRef,
		endedAt: null,
		productRef: productRef,
		status: "active",
		nextPaymentAmount: 0,
		nextPaymentDate: null,
		canceledAt: null,
		currentError: null,
		enterpriseRef: null,
		licenseRef: null,
	};
	const collectionReference = db.collection(Subscription.collection);
	const subscriptionRef = collectionReference.doc();
	await subscriptionRef.set({
		...subscriptionJson,
		id: subscriptionRef.id,
	});
};

const createEnterprise = async (enterpriseData: EnterpriseData): Promise<DocumentReference<EnterpriseJson>> => {
	const enterprise = Enterprise.getEnterpriseTemplate();
	enterprise.patchValue(enterpriseData);
	const collectionReference: CollectionReference<EnterpriseJson> = db.collection(
		Enterprise.collection
	) as CollectionReference<EnterpriseJson>;
	const snapshot = await collectionReference.where("name", "==", enterprise.name).get();
	let enterpriseRef: DocumentReference<EnterpriseJson>;
	if (snapshot.empty) {
		// Document doesn't exist, create it
		const newEnterprise = collectionReference.doc();
		await newEnterprise.set({
			...enterprise.toJson(),
			id: newEnterprise.id,
			tractian:true,
		});
		enterpriseRef = newEnterprise;
		const successMessage = `Created enterprise with name "${enterprise.name}"`;
		console.log(successMessage);
	} else {
		const errorMessage = `Enterprise with name "${enterprise.name}" already exists`;
		console.log(errorMessage);
		enterpriseRef = snapshot.docs[0].ref;
		// throw new Error(errorMessage)
	}
	return enterpriseRef;
};

export const createTractianUser = functions.https.onRequest(async (req, res) => {
	try {
		if (req.method !== "POST") throw new Error("Method not allowed");

		// Data should contain tractian Info
		const tractianInfo = req.body as TractianInfo;

		// Assert body req matches interface

		if (!tractianInfo?.user?.name || !tractianInfo?.user?.email || !tractianInfo?.enterprise?.name) {
			const missingFields = [];
			if (!tractianInfo?.user?.name) missingFields.push("user.name");
			if (!tractianInfo?.user?.email) missingFields.push("user.email");
			if (!tractianInfo?.enterprise?.name) missingFields.push("enterprise.name");
			let message = `Request body is malformed. Missing following fields: ${missingFields.join(", ")}`;
			throw new Error(message);
		}

		const enterprise = {
			...tractianInfo.enterprise,
			name: tractianInfo.enterprise.name.toLowerCase(),
		};
		const user = {
			...tractianInfo.user,
			name: tractianInfo.user.name.toLowerCase().trim(),
			displayName: tractianInfo.user.name.toLowerCase().trim(),
			email: tractianInfo.user.email.toLowerCase().trim(),
		};
		console.log("Tractian API working!", tractianInfo);
		// console.log("User", tractianInfo.user)
		// console.log("Enterprise", tractianInfo.enterprise)

		// Create Enterprise
		let enterpriseRef = null;
		try {
			enterpriseRef = await createEnterprise(enterprise);
		} catch (error) {
			console.error(error);
			throw new Error("Problem creating enterprise");
		}

		// Create User
		let userRef = null;
		let password = null;
		try {
			({ userRef, password } = await createUser(user, enterpriseRef));
		} catch (error) {
			console.error(error);
			throw new Error("Problem creating user");
		}
		// console.log("UserRef", userRef)

		// Create Subscription
		try {
			const productsRef = (
				await (db.collection(Product.collection) as CollectionReference<ProductJson>)
					.where("type", "==", Product.TYPE_TRIAL)
					.get()
			).docs.map((product) => product.ref);
			if (productsRef.length === 0) throw new Error(`Product with type "${Product.TYPE_TRIAL}" not found`);
			const productRef = productsRef[0];
			const TRIAL_DAYS_FOR_TRACTIAN = 30;
			const startDate = +new Date();
			const endDate = startDate + TRIAL_DAYS_FOR_TRACTIAN * 24 * 60 * 60 * 1000; // Convert days to milliseconds
			const subscriptionRef = await createSubscription(userRef, productRef, startDate, endDate);
		} catch (error) {
			console.error(error);
			throw new Error("Problem creating subscription");
		}

		// Send Mail
		const link = await _generatePasswordResetLink(user.email);

		const sender = "desarrollo@predyc.com";

		const recipients = [user.email];
		const subject = "Bienvenido a Predyc, conoce tu usuario y contraseña temporal";
		const text = `Hola ${capitalizeFirstLetter(
			user.name
		)},\n\n¡Te damos la bienvenida a Predyc, tu plataforma de capacitación industrial! Ha sido creado tu usuario en nuestra plataforma , aquí está tu acceso inicial:\n\nUsuario: ${
			user.email
		}\nContraseña: ${password}\n\nCambia tu contraseña aquí: ${link}\n\nIngresa a Predyc aquí: https://predyc-user.web.app/auth/login\n\nPara cualquier consulta, estamos a tu disposición.\n\nSaludos,\nEl Equipo de Predyc`;
		const cc = ["desarrollo@predyc.com", "liliana.giraldo@predyc.com"];
		const mailObj = { sender, recipients, subject, text, cc };
		await _sendMail(mailObj);

		res.status(200).send({ loginUrl: "https://predyc-user.web.app/auth/login" });
		// res.status(200).send(tractianInfo)
		// return { uid: userRecord.uid };
	} catch (error: any) {
		// if (error?.message === 'Method not allowed') res.status(500).send(error.message)

		let statusCode = 500;
		switch (error?.message) {
			case "Problem creating enterprise":
				statusCode = 506;
				break;
			case "Problem creating user":
				statusCode = 507;
				break;
			case "Problem creating subscription":
				statusCode = 508;
				break;
			default:
				break;
		}

		if ((error?.message as string).startsWith("Request body is malformed")) statusCode = 400;

		res.status(statusCode).send({
			message: error?.message,
		});
	}
});
