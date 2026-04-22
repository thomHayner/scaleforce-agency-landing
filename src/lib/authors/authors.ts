// Resolves author frontmatter slugs (e.g. `scaleforce`, `thom-hayner`) into rich author
// metadata stored as the `author` content type in Contentful.
//
// Posts from all three sources (local markdown, Contentful case studies, thomhayner.com
// syndicated) use the same slug convention, so this resolver is the single source of
// truth for bylines.

import contentful from 'contentful';
import type { Asset, Entry, EntryFieldTypes } from 'contentful';

export interface Author {
  slug: string;
  name: string;
  type: 'person' | 'organization';
  avatarUrl?: string;
  bio?: string;
  personalSite?: string;
  socialLinks?: Record<string, string>;
}

interface AuthorFields {
  contentTypeId: 'author';
  fields: {
    name: EntryFieldTypes.Symbol;
    slug: EntryFieldTypes.Symbol;
    type: EntryFieldTypes.Symbol;
    avatar?: Asset;
    bio?: EntryFieldTypes.Text;
    personalSite?: EntryFieldTypes.Symbol;
    socialLinks?: EntryFieldTypes.Object<Record<string, string>>;
  };
}

const authorsClient = contentful.createClient({
  space: import.meta.env.CONTENTFUL_SPACE_ID,
  accessToken: import.meta.env.DEV
    ? import.meta.env.CONTENTFUL_PREVIEW_TOKEN
    : import.meta.env.CONTENTFUL_DELIVERY_TOKEN,
  host: import.meta.env.DEV ? 'preview.contentful.com' : 'cdn.contentful.com',
});

const normalizeAssetUrl = (url?: string): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith('//')) return `https:${url}`;
  return url;
};

const toAuthor = (entry: Entry<AuthorFields>): Author => {
  const f = entry.fields;
  const avatarFile = (f.avatar as Asset | undefined)?.fields?.file;
  const avatarUrl = typeof avatarFile?.url === 'string' ? normalizeAssetUrl(avatarFile.url) : undefined;

  return {
    slug: f.slug as string,
    name: f.name as string,
    type: (f.type as 'person' | 'organization') ?? 'organization',
    avatarUrl,
    bio: (f.bio as string | undefined) || undefined,
    personalSite: (f.personalSite as string | undefined) || undefined,
    socialLinks: (f.socialLinks as Record<string, string> | undefined) || undefined,
  };
};

let _cache: Map<string, Author> | null = null;

const loadAuthors = async (): Promise<Map<string, Author>> => {
  if (_cache) return _cache;

  const map = new Map<string, Author>();
  try {
    const res = await authorsClient.getEntries<AuthorFields>({
      content_type: 'author',
      include: 1,
      limit: 200,
    });
    for (const entry of res.items) {
      const author = toAuthor(entry);
      if (author.slug) map.set(author.slug, author);
    }
  } catch (err) {
    console.warn('[authors loader] failed to fetch authors from Contentful:', err);
  }

  _cache = map;
  return _cache;
};

export const getAuthorBySlug = async (slug: string | undefined): Promise<Author | undefined> => {
  if (!slug) return undefined;
  const authors = await loadAuthors();
  return authors.get(slug);
};
