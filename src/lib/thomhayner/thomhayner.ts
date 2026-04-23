// Loads syndicated blog posts from https://github.com/thomHayner/thomHayner.com.
// Filters to posts whose frontmatter opts in via `crossPostTo: ['scaleforce']`.

import matter from 'gray-matter';
import { remark } from 'remark';
import remarkHtml from 'remark-html';

const REPO = 'thomHayner/thomHayner.com';
const CONTENT_PATH = 'src/content/blog';
const BRANCH = 'main';
const SITE_ORIGIN = 'https://thomhayner.com';

const LISTING_URL = `https://api.github.com/repos/${REPO}/contents/${CONTENT_PATH}?ref=${BRANCH}`;

interface GitHubContentEntry {
  name: string;
  path: string;
  type: 'file' | 'dir';
  download_url: string | null;
}

export interface ThomhaynerFrontmatter {
  title: string;
  description: string;
  publishedDate: string;
  updatedDate?: string;
  heroImage: string;
  heroImageAlt?: string;
  series?: string;
  seriesOrder?: number;
  crossPostTo?: string[];
}

export interface FormattedThomhaynerPost {
  id: string;
  slug: string;
  body: string; // pre-rendered HTML
  collection: 'thomhaynerBlog';
  data: {
    publishDate?: string;
    updateDate?: string;
    draft?: boolean;
    title: string;
    excerpt?: string;
    image?: string;
    category?: string;
    tags?: string[];
    author?: string;
    metadata?: {
      canonical?: string;
      openGraph?: {
        images?: Array<{ url: string }>;
      };
    };
  };
}

const resolveImage = (heroImage: string): string => {
  if (!heroImage) return heroImage;
  if (heroImage.startsWith('http://') || heroImage.startsWith('https://')) return heroImage;
  if (heroImage.startsWith('/')) return `${SITE_ORIGIN}${heroImage}`;
  return `${SITE_ORIGIN}/${heroImage}`;
};

// Optional PAT (with `contents:read` on the private source repo). When present,
// the loader authenticates its GitHub calls so syndication works against a
// private source repo; when absent, unauthenticated requests still succeed for
// public repos and gracefully yield zero posts for private ones.
const GITHUB_TOKEN = import.meta.env.THOMHAYNER_GITHUB_TOKEN;

const authHeaders = (): Record<string, string> => {
  const base: Record<string, string> = { 'User-Agent': 'scaleforce-blog-loader' };
  if (GITHUB_TOKEN) base.Authorization = `Bearer ${GITHUB_TOKEN}`;
  return base;
};

const fetchJson = async <T>(url: string): Promise<T | null> => {
  try {
    const res = await fetch(url, {
      headers: { ...authHeaders(), Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) {
      console.warn(`[thomhayner loader] ${res.status} ${res.statusText} for ${url}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.warn(`[thomhayner loader] fetch failed for ${url}:`, err);
    return null;
  }
};

const fetchText = async (url: string): Promise<string | null> => {
  try {
    const res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) {
      console.warn(`[thomhayner loader] ${res.status} ${res.statusText} for ${url}`);
      return null;
    }
    return await res.text();
  } catch (err) {
    console.warn(`[thomhayner loader] fetch failed for ${url}:`, err);
    return null;
  }
};

const renderMarkdown = async (markdown: string): Promise<string> => {
  const file = await remark().use(remarkHtml, { sanitize: false }).process(markdown);
  return String(file);
};

const buildPost = async (
  slug: string,
  folder: string,
  markdown: string
): Promise<FormattedThomhaynerPost | null> => {
  const { data: rawData, content } = matter(markdown);
  const fm = rawData as ThomhaynerFrontmatter;

  if (!fm.crossPostTo?.includes('scaleforce')) return null;

  const body = await renderMarkdown(content);
  const image = fm.heroImage ? resolveImage(fm.heroImage) : undefined;
  const canonical = `${SITE_ORIGIN}/blog/${folder}/${slug}`;

  const tags: string[] = ['syndicated'];
  if (fm.series) tags.push(fm.series);

  const category = fm.series === 'Claude Skills' ? 'Claude Skills' : 'Engineering';

  let excerpt = fm.description;
  if (fm.series && typeof fm.seriesOrder === 'number') {
    excerpt = `Part ${fm.seriesOrder} of ${fm.series} — ${fm.description}`;
  }

  return {
    id: `thomhayner-${slug}`,
    slug,
    body,
    collection: 'thomhaynerBlog',
    data: {
      publishDate: fm.publishedDate,
      updateDate: fm.updatedDate,
      draft: false,
      title: fm.title,
      excerpt,
      image,
      category,
      tags,
      author: 'thom-hayner',
      metadata: {
        canonical,
        ...(image && fm.heroImageAlt
          ? { openGraph: { images: [{ url: image }] } }
          : {}),
      },
    },
  };
};

let _cache: FormattedThomhaynerPost[] | null = null;

export const loadThomhaynerPosts = async (): Promise<FormattedThomhaynerPost[]> => {
  if (_cache) return _cache;

  const folders = await fetchJson<GitHubContentEntry[]>(LISTING_URL);
  if (!folders) {
    _cache = [];
    return _cache;
  }

  const dateDirs = folders.filter((e) => e.type === 'dir');

  const posts: FormattedThomhaynerPost[] = [];
  for (const dir of dateDirs) {
    const files = await fetchJson<GitHubContentEntry[]>(
      `https://api.github.com/repos/${REPO}/contents/${dir.path}?ref=${BRANCH}`
    );
    if (!files) continue;

    for (const file of files) {
      if (file.type !== 'file' || !file.name.endsWith('.md') || !file.download_url) continue;
      const markdown = await fetchText(file.download_url);
      if (!markdown) continue;

      const slug = file.name.replace(/\.md$/, '');
      const post = await buildPost(slug, dir.name, markdown);
      if (post) posts.push(post);
    }
  }

  _cache = posts;
  return _cache;
};
