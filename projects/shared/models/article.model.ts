import { DocumentReference } from "@angular/fire/compat/firestore"

export interface ArticleJson {
    author: DocumentReference
    createdAt: any
    id: string
    slug: string
    tags: string[]
    title: string
    updatedAt: any
}

export class Article {

    public static collection = 'article'
    public static subcollectionName = "dataChunks"

    constructor(
        public author: DocumentReference,
        public createdAt: any,
        public id: string,
        public slug: string,
        public tags: string[],
        public title: string,
        public updatedAt: any,

    ) {}

    public static fromJson(articleJson: ArticleJson): Article {
        return new Article(
            articleJson.author,
            articleJson.createdAt,
            articleJson.id,
            articleJson.slug,
            articleJson.tags,
            articleJson.title,
            articleJson.updatedAt,
        )
    }

    public toJson(): ArticleJson {
        return {
            author: this.author,
            createdAt: this.createdAt,
            id: this.id,
            slug: this.slug,
            tags: this.tags,
            title: this.title,
            updatedAt: this.updatedAt,
        }
    }
}

export interface ArticleSubCollectionData {
    content: Object[]
}