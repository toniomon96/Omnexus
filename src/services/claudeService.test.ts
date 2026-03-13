import { afterEach, describe, expect, it, vi } from 'vitest';
import { askOmnexusStream, ApiError } from './claudeService';

vi.mock('../lib/api', () => ({
  apiBase: '',
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: null } })),
    },
  },
}));

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

describe('askOmnexusStream', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('parses SSE meta/chunk/done events and returns full answer', async () => {
    const onMeta = vi.fn();
    const onChunk = vi.fn();
    const onDone = vi.fn();

    vi.stubGlobal('fetch', vi.fn(async () => {
      const body = streamFromFrames([
        'event: meta\ndata: {"citations":[{"title":"Study A","type":"lesson"}]}\n\n',
        'event: chunk\ndata: {"text":"Hello "}\n\n',
        'event: chunk\ndata: {"text":"world"}\n\n',
        'event: done\ndata: {"answer":"Hello world","citations":[{"title":"Study A","type":"lesson"}]}\n\n',
      ]);

      return {
        ok: true,
        headers: { get: () => 'text/event-stream' },
        body,
      } as unknown as Response;
    }));

    const result = await askOmnexusStream(
      { question: 'test question' },
      { onMeta, onChunk, onDone },
    );

    expect(onMeta).toHaveBeenCalledWith({
      citations: [{ title: 'Study A', type: 'lesson' }],
    });
    expect(onChunk).toHaveBeenCalledTimes(2);
    expect(onDone).toHaveBeenCalledWith({
      answer: 'Hello world',
      citations: [{ title: 'Study A', type: 'lesson' }],
    });
    expect(result).toEqual({
      answer: 'Hello world',
      citations: [{ title: 'Study A', type: 'lesson' }],
    });
  });

  it('falls back to json body when endpoint is non-stream', async () => {
    const onChunk = vi.fn();
    const onDone = vi.fn();

    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      headers: { get: () => 'application/json' },
      body: null,
      text: async () => JSON.stringify({ answer: '```markdown\nAssistant: plain response\n```', citations: [] }),
      json: async () => ({ answer: '```markdown\nAssistant: plain response\n```', citations: [] }),
    }) as unknown as Response));

    const result = await askOmnexusStream(
      { question: 'fallback' },
      { onChunk, onDone },
    );

    expect(onChunk).toHaveBeenCalledWith({ text: 'plain response' });
    expect(onDone).toHaveBeenCalledWith({ answer: 'plain response', citations: [] });
    expect(result).toEqual({ answer: 'plain response', citations: [] });
  });

  it('throws ApiError for non-200 responses', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: false,
      status: 403,
      json: async () => ({ error: 'Daily limit reached' }),
    }) as unknown as Response));

    await expect(
      askOmnexusStream({ question: 'blocked' }, { onChunk: vi.fn() }),
    ).rejects.toEqual(expect.any(ApiError));
  });

  it('handles SSE events split across multiple transport chunks', async () => {
    const onChunk = vi.fn();
    const onDone = vi.fn();

    vi.stubGlobal('fetch', vi.fn(async () => {
      const body = streamFromFrames([
        'event: meta\nda',
        'ta: {"citations":[{"title":"Study B","type":"lesson"}]}\n\n',
        'event: chunk\ndata: {"text":"Part ',
        '1"}\n\n',
        'event: chunk\ndata: {"text":" + Part 2"}\n\n',
        'event: done\ndata: {"answer":"Part 1 + Part 2","citations":[{"title":"Study B","type":"lesson"}]}\n\n',
      ]);

      return {
        ok: true,
        headers: { get: () => 'text/event-stream' },
        body,
      } as unknown as Response;
    }));

    const result = await askOmnexusStream(
      { question: 'chunk split case' },
      { onChunk, onDone },
    );

    expect(onChunk).toHaveBeenNthCalledWith(1, { text: 'Part 1' });
    expect(onChunk).toHaveBeenNthCalledWith(2, { text: ' + Part 2' });
    expect(onDone).toHaveBeenCalledWith({
      answer: 'Part 1 + Part 2',
      citations: [{ title: 'Study B', type: 'lesson' }],
    });
    expect(result).toEqual({
      answer: 'Part 1 + Part 2',
      citations: [{ title: 'Study B', type: 'lesson' }],
    });
  });

  it('handles done event payload split mid-json across chunks', async () => {
    const onChunk = vi.fn();
    const onDone = vi.fn();

    vi.stubGlobal('fetch', vi.fn(async () => {
      const body = streamFromFrames([
        'event: chunk\ndata: {"text":"Almost there"}\n\n',
        'event: done\ndata: {"answer":"Final',
        ' answer","citations":[{"title":"Study C","type":"exercise"}]}\n\n',
      ]);

      return {
        ok: true,
        headers: { get: () => 'text/event-stream' },
        body,
      } as unknown as Response;
    }));

    const result = await askOmnexusStream(
      { question: 'done split case' },
      { onChunk, onDone },
    );

    expect(onChunk).toHaveBeenCalledWith({ text: 'Almost there' });
    expect(onDone).toHaveBeenCalledWith({
      answer: 'Final answer',
      citations: [{ title: 'Study C', type: 'exercise' }],
    });
    expect(result).toEqual({
      answer: 'Final answer',
      citations: [{ title: 'Study C', type: 'exercise' }],
    });
  });

  it('skips malformed SSE json frames and continues', async () => {
    const onChunk = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();

    vi.stubGlobal('fetch', vi.fn(async () => {
      const body = streamFromFrames([
        'event: chunk\ndata: {"text":"valid"}\n\n',
        'event: chunk\ndata: {"text":"broken"\n\n',
        'event: done\ndata: {"answer":"valid","citations":[]}\n\n',
      ]);

      return {
        ok: true,
        headers: { get: () => 'text/event-stream' },
        body,
      } as unknown as Response;
    }));

    const result = await askOmnexusStream(
      { question: 'bad json case' },
      { onChunk, onDone, onError },
    );

    expect(onChunk).toHaveBeenCalledTimes(1);
    expect(onChunk).toHaveBeenCalledWith({ text: 'valid' });
    expect(onError).toHaveBeenCalledWith({
      code: 'malformed_sse_frame',
      message: 'Skipped malformed SSE frame payload',
      skippedFrames: 1,
    });
    expect(onDone).toHaveBeenCalledWith({ answer: 'valid', citations: [] });
    expect(result).toEqual({ answer: 'valid', citations: [] });
  });

  it('reports stream_ended_without_done when stream ends early', async () => {
    const onChunk = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();

    vi.stubGlobal('fetch', vi.fn(async () => {
      const body = streamFromFrames([
        'event: chunk\ndata: {"text":"partial"}\n\n',
      ]);

      return {
        ok: true,
        headers: { get: () => 'text/event-stream' },
        body,
      } as unknown as Response;
    }));

    const result = await askOmnexusStream(
      { question: 'early end' },
      { onChunk, onDone, onError },
    );

    expect(onError).toHaveBeenCalledWith({
      code: 'stream_ended_without_done',
      message: 'SSE stream ended without a done event',
      skippedFrames: 0,
    });
    expect(onDone).toHaveBeenCalledWith({ answer: 'partial', citations: [] });
    expect(result).toEqual({ answer: 'partial', citations: [] });
  });

  it('parses SSE-formatted text fallback when content-type is incorrect', async () => {
    const onChunk = vi.fn();
    const onDone = vi.fn();

    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      headers: { get: () => 'application/json' },
      body: null,
      text: async () => [
        'event: meta\ndata: {"citations":[]}\n\n',
        'event: chunk\ndata: {"text":"SSE"}\n\n',
        'event: done\ndata: {"answer":"SSE text","citations":[]}\n\n',
      ].join(''),
    }) as unknown as Response));

    const result = await askOmnexusStream(
      { question: 'sse fallback text' },
      { onChunk, onDone },
    );

    expect(onChunk).toHaveBeenCalledWith({ text: 'SSE' });
    expect(onDone).toHaveBeenCalledWith({ answer: 'SSE text', citations: [] });
    expect(result).toEqual({ answer: 'SSE text', citations: [] });
  });

  it('sanitizes done payload answer from SSE stream', async () => {
    const onChunk = vi.fn();
    const onDone = vi.fn();

    vi.stubGlobal('fetch', vi.fn(async () => {
      const body = streamFromFrames([
        'event: done\ndata: {"answer":"```markdown\\nAssistant: Clean me\\n```","citations":[]}\n\n',
      ]);

      return {
        ok: true,
        headers: { get: () => 'text/event-stream' },
        body,
      } as unknown as Response;
    }));

    const result = await askOmnexusStream(
      { question: 'sanitize done answer' },
      { onChunk, onDone },
    );

    expect(onDone).toHaveBeenCalledWith({ answer: 'Clean me', citations: [] });
    expect(result).toEqual({ answer: 'Clean me', citations: [] });
  });
});
