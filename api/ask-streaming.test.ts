import { afterEach, describe, expect, it, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

function createReq(body: Record<string, unknown>, headers: Record<string, string> = {}): VercelRequest {
  return {
    method: 'POST',
    headers: { origin: 'http://localhost:3000', ...headers },
    socket: { remoteAddress: '127.0.0.1' },
    body,
  } as unknown as VercelRequest;
}

function createRes() {
  const headers = new Map<string, string>();
  let statusCode = 200;
  let jsonBody: unknown = null;
  let ended = false;
  const writes: string[] = [];

  const res = {
    setHeader(name: string, value: string) {
      headers.set(name, value);
      return res;
    },
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(payload: unknown) {
      jsonBody = payload;
      return res;
    },
    write(chunk: string) {
      writes.push(chunk);
      return true;
    },
    end() {
      ended = true;
      return res;
    },
  } as unknown as VercelResponse;

  return {
    res,
    getStatusCode: () => statusCode,
    getJsonBody: () => jsonBody,
    getHeader: (name: string) => headers.get(name),
    getWrites: () => writes.join(''),
    isEnded: () => ended,
  };
}

function streamFromFrames(frames: string[]): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      for (const frame of frames) {
        controller.enqueue(encoder.encode(frame));
      }
      controller.close();
    },
  });
}

describe('/api/ask streaming mode', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('emits meta/chunk/done SSE events in sequence', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';

    vi.doMock('./_cors.js', () => ({ setCorsHeaders: () => true }));
    vi.doMock('./_rateLimit.js', () => ({ checkRateLimit: vi.fn(async () => true) }));

    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      body: streamFromFrames([
        'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello "}}\n\n',
        'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"there"}}\n\n',
      ]),
    } as Response)));

    const { default: askHandler } = await import('./ask.js');
    const { res, getHeader, getWrites, isEnded } = createRes();

    await askHandler(createReq({ question: 'stream this', stream: true }), res);

    const output = getWrites();
    expect(getHeader('Content-Type')).toContain('text/event-stream');
    expect(output).toContain('event: meta');
    expect(output).toContain('event: chunk');
    expect(output).toContain('event: done');
    expect(output).toContain('Hello there');
    expect(isEnded()).toBe(true);
  });

  it('emits degraded done fallback when upstream stream fails', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';

    vi.doMock('./_cors.js', () => ({ setCorsHeaders: () => true }));
    vi.doMock('./_rateLimit.js', () => ({ checkRateLimit: vi.fn(async () => true) }));

    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: false,
      status: 503,
      body: null,
    } as unknown as Response)));

    const { default: askHandler } = await import('./ask.js');
    const { res, getWrites, isEnded } = createRes();

    await askHandler(createReq({ question: 'stream fallback', stream: true }), res);

    const output = getWrites();
    expect(output).toContain('event: done');
    expect(output).toContain('"degraded":true');
    expect(output).toContain('"degradedReason":"anthropic_upstream_error"');
    expect(output).toContain('"traceId"');
    expect(output).toContain('having trouble reaching the AI service right now');
    expect(isEnded()).toBe(true);
  });

  it('parses CRLF-delimited upstream SSE frames', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';

    vi.doMock('./_cors.js', () => ({ setCorsHeaders: () => true }));
    vi.doMock('./_rateLimit.js', () => ({ checkRateLimit: vi.fn(async () => true) }));

    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      body: streamFromFrames([
        'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"CR"}}\r\n\r\n',
        'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"LF"}}\r\n\r\n',
      ]),
    } as Response)));

    const { default: askHandler } = await import('./ask.js');
    const { res, getWrites } = createRes();

    await askHandler(createReq({ question: 'crlf stream', stream: true }), res);

    const output = getWrites();
    expect(output).toContain('event: done');
    expect(output).toContain('CRLF');
    expect(output).not.toContain('"degraded":true');
  });

  it('returns 500 json when Anthropic key is missing', async () => {
    delete process.env.ANTHROPIC_API_KEY;

    vi.doMock('./_cors.js', () => ({ setCorsHeaders: () => true }));
    vi.doMock('./_rateLimit.js', () => ({ checkRateLimit: vi.fn(async () => true) }));

    const { default: askHandler } = await import('./ask.js');
    const { res, getStatusCode, getJsonBody } = createRes();

    await askHandler(createReq({ question: 'no key', stream: true }), res);

    expect(getStatusCode()).toBe(500);
    expect(getJsonBody()).toEqual({ error: 'AI service is not configured' });
  });

  it('continues as guest when bearer token is invalid', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';

    vi.doMock('./_cors.js', () => ({ setCorsHeaders: () => true }));
    vi.doMock('./_rateLimit.js', () => ({ checkRateLimit: vi.fn(async () => true) }));
    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => ({
        auth: {
          getUser: vi.fn(async () => ({ data: { user: null }, error: { message: 'invalid jwt' } })),
        },
      }),
    }));

    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      body: streamFromFrames([
        'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Guest OK"}}\n\n',
      ]),
    } as Response)));

    const { default: askHandler } = await import('./ask.js');
    const { res, getStatusCode, getWrites } = createRes();

    await askHandler(
      createReq({ question: 'token expired', stream: true }, { authorization: 'Bearer stale' }),
      res,
    );

    expect(getStatusCode()).toBe(200);
    expect(getWrites()).toContain('Guest OK');
  });
});
