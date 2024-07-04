import { DocumentReference } from "@angular/fire/compat/firestore"

export interface ArticleJson {
    authorRef: DocumentReference
    createdAt: any
    duration: number
    id: string
    photoUrl: string
    slug: string
    tagsRef: DocumentReference[]
    title: string
    updatedAt: any
}

export class Article {

    public static collection = 'article'
    public static subcollectionName = "dataChunks"

    constructor(
        public authorRef: DocumentReference,
        public createdAt: any,
        public duration: number,
        public id: string,
        public photoUrl: string,
        public slug: string,
        public tagsRef: DocumentReference[],
        public title: string,
        public updatedAt: any,

    ) {}

    public static fromJson(articleJson: ArticleJson): Article {
        return new Article(
            articleJson.authorRef,
            articleJson.createdAt,
            articleJson.duration,
            articleJson.id,
            articleJson.photoUrl,
            articleJson.slug,
            articleJson.tagsRef,
            articleJson.title,
            articleJson.updatedAt,
        )
    }

    public toJson(): ArticleJson {
        return {
            authorRef: this.authorRef,
            createdAt: this.createdAt,
            duration: this.duration,
            id: this.id,
            photoUrl: this.photoUrl,
            slug: this.slug,
            tagsRef: this.tagsRef,
            title: this.title,
            updatedAt: this.updatedAt,
        }
    }
}

export interface ArticleSubCollectionData {
    content: Object[]
}

export interface ArticleTagJson {
    id: string | null,
    name: string,
}

export class ArticleTag {

    public static collection = 'article-tag'

    constructor(
        public id: string | null,
        public name: string,
    ){}

    public static fromJson(articleJson: ArticleTagJson): ArticleTag {
        return new ArticleTag(
            articleJson.id,
            articleJson.name,
        )
    }

    public toJson(): ArticleTagJson {
        return {
            id: this.id,
            name: this.name,
        }
    }

}