import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { HealthArticle, LearningCategory } from '../src/types/index.js';
import { setCorsHeaders } from './_cors.js';
import { checkRateLimit } from './_rateLimit.js';

// ─── PubMed search queries per category ──────────────────────────────────────

const CATEGORY_QUERIES: Record<LearningCategory, string> = {
  'strength-training': 'resistance training hypertrophy strength gains muscle',
  'nutrition': 'sports nutrition protein intake athletic performance macronutrients',
  'recovery': 'exercise recovery muscle soreness DOMS sleep regeneration',
  'sleep': 'sleep quality athletic performance recovery exercise',
  'metabolic-health': 'exercise metabolic health insulin sensitivity body composition',
  'cardio': 'aerobic exercise cardiovascular fitness endurance HIIT training',
  'mobility': 'flexibility mobility stretching range of motion performance',
};

const PUBMED = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

// ─── PubMed helpers ───────────────────────────────────────────────────────────

async function esearch(query: string, limit: number): Promise<string[]> {
  const url =
    `${PUBMED}/esearch.fcgi?db=pubmed` +
    `&term=${encodeURIComponent(query)}` +
    `&retmax=${limit}&retmode=json&sort=relevance&reldate=1825&datetype=pdat`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`PUBMED_HTTP_${res.status}`);
  const data = (await res.json()) as { esearchresult: { idlist: string[] } };
  return data.esearchresult.idlist;
}

interface PubMedSummaryEntry {
  uid: string;
  title: string;
  authors: Array<{ name: string }>;
  source: string;
  pubdate: string;
}

async function esummary(ids: string[]): Promise<Record<string, PubMedSummaryEntry>> {
  const url = `${PUBMED}/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`PUBMED_HTTP_${res.status}`);
  const data = (await res.json()) as { result: Record<string, PubMedSummaryEntry> };
  return data.result;
}

async function fetchAbstracts(ids: string[]): Promise<Record<string, string>> {
  const url = `${PUBMED}/efetch.fcgi?db=pubmed&id=${ids.join(',')}&retmode=xml`;
  const res = await fetch(url);
  if (!res.ok) return {};
  const xml = await res.text();

  const abstracts: Record<string, string> = {};
  const articleRe = /<PubmedArticle>([\s\S]*?)<\/PubmedArticle>/g;
  let article: RegExpExecArray | null;

  while ((article = articleRe.exec(xml)) !== null) {
    const block = article[1];
    const pmidMatch = /<PMID Version="1">(\d+)<\/PMID>/.exec(block);
    if (!pmidMatch) continue;
    const pmid = pmidMatch[1];

    // Collect all AbstractText sections (structured abstracts have multiple)
    const parts: string[] = [];
    const textRe = /<AbstractText(?:[^>]*)>([\s\S]*?)<\/AbstractText>/g;
    let section: RegExpExecArray | null;
    while ((section = textRe.exec(block)) !== null) {
      const cleaned = section[1]
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/<[^>]+>/g, '')
        .trim();
      if (cleaned) parts.push(cleaned);
    }
    if (parts.length > 0) abstracts[pmid] = parts.join(' ');
  }
  return abstracts;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!setCorsHeaders(req, res)) return;

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!await checkRateLimit(req, res)) return;

  const category = (req.query.category as string) ?? 'strength-training';
  const limit = Math.min(Number(req.query.limit) || 5, 10);

  if (!Object.keys(CATEGORY_QUERIES).includes(category)) {
    return res.status(400).json({ error: 'Invalid category' });
  }

  try {
    const ids = await esearch(CATEGORY_QUERIES[category as LearningCategory], limit);
    if (ids.length === 0) return res.status(200).json({ articles: [] });

    const [summaries, abstracts] = await Promise.all([
      esummary(ids),
      fetchAbstracts(ids),
    ]);

    const now = new Date().toISOString();

    const articles: HealthArticle[] = ids
      .filter((id) => summaries[id]?.title)
      .map((id) => {
        const s = summaries[id];
        const abstract = abstracts[id] ?? '';
        const summary = abstract
          ? abstract.length > 400
            ? abstract.slice(0, 397) + '…'
            : abstract
          : '';

        const firstAuthor = s.authors?.[0]?.name ?? '';
        const authorLabel =
          (s.authors?.length ?? 0) > 1 ? `${firstAuthor} et al.` : firstAuthor;
        const source = [authorLabel, s.source].filter(Boolean).join(' — ');

        return {
          id,
          title: s.title.replace(/\.$/, ''),
          summary,
          keyTakeaways: [],
          source,
          sourceUrl: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
          publishedDate: s.pubdate,
          category: category as LearningCategory,
          tags: [],
          cachedAt: now,
        };
      })
      .filter((a) => a.summary.length > 0);

    // Cache at CDN edge for 6h; serve stale for up to 24h during background revalidation.
    // PubMed results for a fixed query + date window are stable intraday.
    res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');
    return res.status(200).json({ articles });
  } catch (err: unknown) {
    console.error('[/api/articles]', err);
    const raw = err instanceof Error ? err.message : '';
    if (raw.includes('PUBMED_HTTP_429')) {
      return res.status(429).json({ error: 'Research provider rate limited' });
    }
    return res.status(500).json({ error: 'Failed to fetch articles' });
  }
}
