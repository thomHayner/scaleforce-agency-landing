// Resolves author frontmatter slugs (e.g. `scaleforce`, `thom-hayner`) into rich author
// metadata stored as the `author` content type in Contentful.
//
// Posts from all three sources (local markdown, Contentful case studies, thomhayner.com
// syndicated) use the same slug convention, so this resolver is the single source of
// truth for bylines.

import type { Asset, Entry, EntryFieldTypes } from 'contentful';
import { contentfulClient } from '../contentful/contentful';

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

const normalizeAssetUrl = (url?: string): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith('//')) return `https:${url}`;
  return url;
};

const AUTHOR_TYPES = ['person', 'organization'] as const;
type AuthorType = (typeof AUTHOR_TYPES)[number];

const coerceAuthorType = (raw: unknown): AuthorType =>
  typeof raw === 'string' && (AUTHOR_TYPES as readonly string[]).includes(raw)
    ? (raw as AuthorType)
    : 'organization';

const toAuthor = (entry: Entry<AuthorFields>): Author => {
  const f = entry.fields;
  const avatarFile = (f.avatar as Asset | undefined)?.fields?.file;
  const avatarUrl = typeof avatarFile?.url === 'string' ? normalizeAssetUrl(avatarFile.url) : undefined;

  return {
    slug: f.slug as string,
    name: f.name as string,
    type: coerceAuthorType(f.type),
    avatarUrl,
    bio: (f.bio as string | undefined) || undefined,
    personalSite: (f.personalSite as string | undefined) || undefined,
    socialLinks: (f.socialLinks as Record<string, string> | undefined) || undefined,
  };
};

// Cache state:
// - `_cache` is only set on a successful fetch — a transient Contentful outage won't
//   permanently degrade author resolution for the lifetime of the process.
// - `_cachePromise` memoizes the in-flight request so parallel callers (e.g. the three
//   normalize functions running under `Promise.all` in `src/utils/blog.ts`) share one
//   Contentful round-trip per build / dev-server session instead of one-per-post.
let _cache: Map<string, Author> | null = null;
let _cachePromise: Promise<Map<string, Author>> | null = null;

const fetchAuthors = async (): Promise<Map<string, Author>> => {
  const map = new Map<string, Author>();
  const res = await contentfulClient.getEntries<AuthorFields>({
    content_type: 'author',
    include: 1,
    limit: 200,
  });
  for (const entry of res.items) {
    const author = toAuthor(entry);
    if (author.slug) map.set(author.slug, author);
  }
  return map;
};

const loadAuthors = async (): Promise<Map<string, Author>> => {
  if (_cache) return _cache;
  if (_cachePromise) return _cachePromise;

  _cachePromise = fetchAuthors()
    .then((map) => {
      _cache = map;
      return map;
    })
    .catch((err) => {
      console.warn('[authors loader] failed to fetch authors from Contentful:', err);
      // Intentionally do NOT populate `_cache` on failure — return an empty map for
      // this caller but let the next call retry the fetch.
      return new Map<string, Author>();
    })
    .finally(() => {
      _cachePromise = null;
    });

  return _cachePromise;
};

export const getAuthorBySlug = async (slug: string | undefined): Promise<Author | undefined> => {
  if (!slug) return undefined;
  const authors = await loadAuthors();
  return authors.get(slug);
};
