import { DocumentReference } from "@angular/fire/compat/firestore"
import { Category } from "./category.model"
import { Author } from "./author.model"
import { Curso } from "./course.model"

export interface ArticleJson {
    authorRef: DocumentReference<Author>
    isDraft: boolean
    categoriesRef: DocumentReference<ArticleCategory>[]
    createdAt: any
    id: string
    metaDescription: string
    photoUrl: string
    pillarsRef: DocumentReference<Category>[]
    slug: string
    summary: string
    tagsRef: DocumentReference<ArticleTag>[]
    title: string
    titleSEO: string
    updatedAt: any
    orderNumber: number
    coursesRef: DocumentReference<Curso>[]
    relatedArticlesRef: DocumentReference<Article>[]
}

export class Article {

    public static collection = 'article'
    public static objectSubcollectionName = "dataChunks"
    public static HTMLSubcollectionName = "dataChunksHTML"

    constructor(
        public authorRef: DocumentReference<Author>,
        public isDraft: boolean,
        public categoriesRef: DocumentReference<ArticleCategory>[],
        public createdAt: any,
        public id: string,
        public metaDescription: string,
        public photoUrl: string,
        public pillarsRef: DocumentReference<Category>[],
        public slug: string,
        public summary: string,
        public tagsRef: DocumentReference<ArticleTag>[],
        public title: string,
        public titleSEO: string,
        public updatedAt: any,
        public orderNumber: number,
        public coursesRef: DocumentReference<Curso>[],
        public relatedArticlesRef: DocumentReference<Article>[],

    ) {}

    public static fromJson(articleJson: ArticleJson): Article {
        return new Article(
            articleJson.authorRef,
            articleJson.isDraft,
            articleJson.categoriesRef,
            articleJson.createdAt,
            articleJson.id,
            articleJson.metaDescription,
            articleJson.photoUrl,
            articleJson.pillarsRef,
            articleJson.slug,
            articleJson.summary,
            articleJson.tagsRef,
            articleJson.title,
            articleJson.titleSEO,
            articleJson.updatedAt,
            articleJson.orderNumber,
            articleJson.coursesRef,
            articleJson.relatedArticlesRef,
        )
    }

    public toJson(): ArticleJson {
        return {
            authorRef: this.authorRef,
            isDraft: this.isDraft,
            categoriesRef: this.categoriesRef,
            createdAt: this.createdAt,
            id: this.id,
            metaDescription: this.metaDescription,
            photoUrl: this.photoUrl,
            pillarsRef: this.pillarsRef,
            slug: this.slug,
            summary: this.summary,
            tagsRef: this.tagsRef,
            title: this.title,
            titleSEO: this.titleSEO,
            updatedAt: this.updatedAt,
            orderNumber: this.orderNumber,
            coursesRef: this.coursesRef,
            relatedArticlesRef: this.relatedArticlesRef,
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

export interface ArticleCategoryJson {
    id: string | null,
    name: string,
}

export class ArticleCategory {

    public static collection = 'article-category'

    constructor(
        public id: string | null,
        public name: string,
    ){}

    public static fromJson(articleJson: ArticleCategoryJson): ArticleCategory {
        return new ArticleCategory(
            articleJson.id,
            articleJson.name,
        )
    }

    public toJson(): ArticleCategoryJson {
        return {
            id: this.id,
            name: this.name,
        }
    }

}