import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GoogleGenAI,
  ThinkingLevel,
  Type,
  type GenerateContentResponse,
} from '@google/genai';
import { createServer as createViteServer } from 'vite';
import {
  renderKinusaigaPatternSvg,
  sanitizePatternSpec,
  svgToDataUrl,
} from './src/utils/kinusaigaPatternSvg.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

const GEMINI_MODEL = 'gemini-4-hydrogen';
const GEMINI_DEADLINE_MS = 24000;

function createGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function getThemePaletteHint(themeKey: unknown): string {
  switch (themeKey) {
    case 'autumn':
      return 'Warm autumn palette touches (#c2692a terracotta, #d9a014 amber, #55734a sage, #faf9f5 cream, #2d3f27 forest)';
    case 'sakura':
      return 'Soft sakura palette touches (#d4607f cherry rose, #f6dce4 blush, #55734a sage, #faf9f5 cream, #2d3f27 forest)';
    case 'sun':
      return 'Bright sunflower palette touches (#d9a014 golden yellow, #c2692a ochre, #55734a leaf green, #faf9f5 cream)';
    case 'forest':
    default:
      return 'Natural forest palette touches (#2d3f27 deep pine, #55734a sage, #a9bf9c soft moss, #faf9f5 cream)';
  }
}

function parseGeminiError(err: unknown): {
  status: number;
  message: string;
  code: string;
} {
  const rawMessage = err instanceof Error ? err.message : String(err ?? '');
  const upper = rawMessage.toUpperCase();

  if (upper.includes('GEMINI_TIMEOUT')) {
    return {
      status: 504,
      code: 'GEMINI_TIMEOUT',
      message:
        'استغرق تجهيز الباترون وقتاً أطول من المعتاد. اضغطي "أعيدي رسم الباترون" أو جرّبي صورة أصغر.',
    };
  }

  if (
    upper.includes('API_KEY_INVALID') ||
    upper.includes('PERMISSION_DENIED') ||
    upper.includes('403') ||
    upper.includes('API KEY')
  ) {
    return {
      status: 403,
      code: 'GEMINI_KEY_ERROR',
      message:
        'مفتاح Gemini API غير مفعّل أو غير صالح. يرجى التأكد من إعداده في لوحة Settings > Secrets.',
    };
  }

  if (upper.includes('RESOURCE_EXHAUSTED') || upper.includes('429')) {
    return {
      status: 429,
      code: 'GEMINI_QUOTA_EXCEEDED',
      message:
        'تم الوصول إلى الحد المؤقت لطلبات توليد الباترون. حاولي مرة أخرى بعد لحظات.',
    };
  }

  return {
    status: 502,
    code: 'GEMINI_GENERATION_FAILED',
    message:
      'تعذّر تحويل الصورة إلى باترون كينوسايجا حالياً. حاولي بصورة واضحة أخرى أو أعيدي المحاولة.',
  };
}

function withDeadline<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`GEMINI_TIMEOUT after ${ms}ms`));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

async function generateWithRetry(
  ai: GoogleGenAI,
  imageBase64: string,
  mimeType: string,
  themeKey: unknown
): Promise<GenerateContentResponse> {
  const paletteHint = getThemePaletteHint(themeKey);

  const systemInstruction = `You are a master Japanese Kinusaiga (fabric-tucking woodcraft) pattern designer.
Given an uploaded photo, simplify it into a clean Kinusaiga craft template with bold, flat, fabric-cuttable regions and crisp dark carved cut lines.
Rules:
1. Work strictly inside a 400x400 viewBox (x: 0..400, y: 0..400).
2. Break the scene into 10 to 16 clean, simplified closed shapes (SVG pathD starting with M and ending with Z) ordered back-to-front so foreground details sit cleanly atop background patches.
3. No tiny fragments, no gradients, no shading — every region is one flat cloth piece cut with scissors.
4. Preserve the recognizable silhouette, subject placement, and proportions of the user's photo.
5. Choose harmonious fabric colors faithful to the photo's subject while staying cohesive with craft warmth (${paletteHint}).
6. Assign each region a weave from: solid, dots, gingham, stripes, waves.
7. Provide summaryAr as a short 2-5 word Arabic description of the pattern (no emoji).`;

  const requestParams = {
    model: GEMINI_MODEL,
    contents: {
      parts: [
        {
          inlineData: {
            data: imageBase64,
            mimeType,
          },
        },
        {
          text: 'Convert this photo into a simplified 10-16 piece Kinusaiga fabric pattern with flat colors and clear cut lines in a 400x400 SVG coordinate space.',
        },
      ],
    },
    config: {
      systemInstruction,
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.LOW,
      },
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summaryAr: {
            type: Type.STRING,
            description: 'Short Arabic label (2-5 words) describing the simplified Kinusaiga pattern.',
          },
          backgroundColor: {
            type: Type.STRING,
            description: '6-digit hex color for the base linen/wood backing, e.g. #faf9f5.',
          },
          regions: {
            type: Type.ARRAY,
            description: 'Ordered back-to-front list of 10-16 simplified Kinusaiga fabric regions.',
            items: {
              type: Type.OBJECT,
              properties: {
                label: {
                  type: Type.STRING,
                  description: 'Short label for the fabric piece.',
                },
                pathD: {
                  type: Type.STRING,
                  description: 'Valid closed SVG path command string inside 0..400 coordinates.',
                },
                fillHex: {
                  type: Type.STRING,
                  description: '6-digit hex color for this flat fabric piece.',
                },
                weave: {
                  type: Type.STRING,
                  description: 'One of: solid, dots, gingham, stripes, waves.',
                },
              },
              required: ['label', 'pathD', 'fillHex', 'weave'],
            },
          },
        },
        required: ['summaryAr', 'backgroundColor', 'regions'],
      },
    },
  };

  const deadlineAt = Date.now() + GEMINI_DEADLINE_MS;
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const remainingMs = deadlineAt - Date.now();
    if (remainingMs <= 1500) {
      throw new Error('GEMINI_TIMEOUT');
    }
    try {
      return await withDeadline(
        ai.models.generateContent(requestParams),
        remainingMs
      );
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message.toUpperCase() : '';
      const isNonRetryable =
        msg.includes('GEMINI_TIMEOUT') ||
        msg.includes('API_KEY_INVALID') ||
        msg.includes('PERMISSION_DENIED') ||
        msg.includes('400') ||
        msg.includes('403') ||
        msg.includes('429');
      if (isNonRetryable || attempt === 1) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 450));
    }
  }
  throw lastErr;
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '8mb' }));

  app.post('/api/kinusaiga-preview', async (req: Request, res: Response) => {
    const startedAt = Date.now();
    try {
      const apiKey = process.env.GEMINI_API_KEY?.trim();
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        res.status(503).json({
          code: 'MISSING_GEMINI_API_KEY',
          error:
            'مفتاح Gemini API غير مضبوط على الخادم. يرجى إضافته في Settings > Secrets.',
        });
        return;
      }

      const body = (req.body ?? {}) as {
        imageBase64?: unknown;
        mimeType?: unknown;
        themeKey?: unknown;
      };

      if (
        typeof body.imageBase64 !== 'string' ||
        body.imageBase64.trim().length < 32
      ) {
        res.status(400).json({
          code: 'INVALID_IMAGE',
          error: 'بيانات الصورة غير صالحة. اختاري صورة واضحة وحاولي مجدداً.',
        });
        return;
      }

      const mimeType =
        typeof body.mimeType === 'string' &&
        /^image\/(jpeg|jpg|png|webp|gif)$/i.test(body.mimeType.trim())
          ? body.mimeType.trim()
          : 'image/jpeg';

      // Strip data URL prefix if client sent one
      const rawBase64 = body.imageBase64.includes(',')
        ? body.imageBase64.split(',')[1]
        : body.imageBase64;

      const ai = createGeminiClient();
      const response = await generateWithRetry(
        ai,
        rawBase64,
        mimeType,
        body.themeKey
      );

      const jsonText = (response.text ?? '').trim();
      if (!jsonText) {
        res.status(502).json({
          code: 'EMPTY_MODEL_RESPONSE',
          error: 'لم يرد النموذج ببيانات الباترون. جرّبي صورة أخرى.',
        });
        return;
      }

      const parsed = JSON.parse(jsonText) as unknown;
      const sanitized = sanitizePatternSpec(parsed);
      if (sanitized.regions.length < 3) {
        res.status(502).json({
          code: 'INSUFFICIENT_REGIONS',
          error:
            'تعذّر استخراج مناطق قماش كافية من هذه الصورة. جرّبي صورة ذات عناصر أوضح.',
        });
        return;
      }

      const svgMarkup = renderKinusaigaPatternSvg(sanitized);
      const previewImageUrl = svgToDataUrl(svgMarkup);

      console.info(
        `[kinusaiga-preview] OK regions=${sanitized.regions.length} elapsed=${Date.now() - startedAt}ms`
      );

      res.json({
        previewImageUrl,
        summaryAr: sanitized.summaryAr,
        regionCount: sanitized.regions.length,
      });
    } catch (err) {
      const parsedError = parseGeminiError(err);
      console.error(
        `[kinusaiga-preview] FAIL code=${parsedError.code} elapsed=${Date.now() - startedAt}ms`,
        err instanceof Error ? err.message : err
      );
      res.status(parsedError.status).json({
        code: parsedError.code,
        error: parsedError.message,
      });
    }
  });

  if (!IS_PROD) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kino full-stack server running on http://localhost:${PORT}`);
  });
}

void startServer();
