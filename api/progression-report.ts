import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { setCorsHeaders } from './_cors.js';
import { checkRateLimit } from './_rateLimit.js';

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

interface ProgressionReportRequest {
  firstName: string;
  programName: string;
  startDate: string;
  endDate: string;
  consistencyPercent: number;
  topPRs: Array<{ exerciseName: string; weight: number; reps: number }>;
  topMuscleGroup: string;
  totalWorkouts: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!await checkRateLimit(req, res, { namespace: 'omnexus_rl:progression-report', limit: 20, window: '10 m' })) return;

  if (!anthropic) {
    return res.status(200).json({
      narrative: 'Great work completing this block. Your consistency and effort have set the foundation for your next phase of training.',
    });
  }

  const body = req.body as ProgressionReportRequest;
  const {
    firstName,
    programName,
    startDate,
    endDate,
    consistencyPercent,
    topPRs,
    topMuscleGroup,
    totalWorkouts,
  } = body;

  const prSummary = topPRs.length > 0
    ? topPRs.slice(0, 3).map((pr) => `${pr.exerciseName}: ${pr.weight}kg × ${pr.reps}`).join(', ')
    : 'No PRs recorded';

  const prompt = `Generate a 2–4 sentence personalized training block summary for ${firstName ?? 'the athlete'}.

Block data:
- Program: ${programName}
- Duration: ${startDate} to ${endDate}
- Total workouts completed: ${totalWorkouts}
- Consistency: ${consistencyPercent.toFixed(0)}%
- Top PRs: ${prSummary}
- Highest volume muscle group: ${topMuscleGroup}

Tone: Direct, coach-like, specific to the numbers. No generic affirmations. Reference specific metrics where available.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });

    const narrative = (message.content[0] as { type: string; text: string }).text ?? '';
    return res.status(200).json({ narrative });
  } catch (err) {
    console.error('[/api/progression-report]', err);
    return res.status(200).json({
      narrative: `${firstName ?? 'You'} completed ${totalWorkouts} workouts with ${consistencyPercent.toFixed(0)}% consistency. ${topMuscleGroup} showed the strongest volume gains. Keep building on this foundation in your next block.`,
    });
  }
}
