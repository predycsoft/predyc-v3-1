
export interface AuthorJson {
    email: string
    id: string
    linkedin: string
    name: string
    photoUrl: string
}

export class Author {

    public static collection = 'author'

    constructor(
        public email: string,
        public id: string,
        public linkedin: string,
        public name: string,
        public photoUrl: string,
    ) {}

    public static fromJson(articleJson: AuthorJson): Author {
        return new Author(
            articleJson.email,
            articleJson.id,
            articleJson.linkedin,
            articleJson.name,
            articleJson.photoUrl,
        )
    }

    public toJson(): AuthorJson {
        return {
            email: this.email,
            id: this.id,
            linkedin: this.linkedin,
            name: this.name,
            photoUrl: this.photoUrl,
        }
    }
}