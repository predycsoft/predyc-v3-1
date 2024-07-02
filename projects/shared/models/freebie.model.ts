export const FREEBIE_TYPE_FILE = "file";

export const FREEBIE_TYPE_CHOICES = [FREEBIE_TYPE_FILE];

export interface Freebie {
	id: string;
	name: string;
	photoUrl: string;
	description: string;
	type: string;
	file: string;
	extension: string;
	customUrl: string;
	updatedAt: any;
}
