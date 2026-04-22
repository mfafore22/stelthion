import { z } from 'zod';
import prisma from '@/server/db/client';
import { defineHandler, HttpError } from '@/server/api/define-handler';
import type { SourceType } from '@prisma/client';

export const GET = defineHandler(
  { auth: 'admin' },
  async ({ req }) => {
    const country = new URL(req.url).searchParams.get('country');
    const sources = await prisma.signalSource.findMany({
      where: country ? { country } : undefined,
      orderBy: [{ country: 'asc' }, { type: 'asc' }, { name: 'asc' }],
    });
    return sources;
  },
);

const sourceBodySchema = z.object({
  name: z.string(),
  type: z.string() as z.ZodType<SourceType>,
  url: z.string(),
  country: z.string(),
  language: z.string(),
  weight: z.number().optional(),
  active: z.boolean().optional(),
  config: z.record(z.unknown()).nullable().optional(),
});

export const POST = defineHandler(
  {
    auth: 'admin',
    bodySchema: sourceBodySchema,
  },
  async ({ body }) => {
    const created = await prisma.signalSource.create({
      data: {
        name: body.name,
        type: body.type,
        url: body.url,
        country: body.country.toUpperCase(),
        language: body.language.toLowerCase(),
        weight: body.weight ?? 1.0,
        active: body.active ?? true,
        config: body.config ? JSON.parse(JSON.stringify(body.config)) : undefined,
      },
    });
    return created;
  },
);

export const PATCH = defineHandler(
  {
    auth: 'admin',
    bodySchema: sourceBodySchema.partial().extend({ id: z.string() }),
  },
  async ({ body }) => {
    if (!body.id) throw new HttpError(400, 'id required');
    const { id, ...rest } = body;
    const data: Record<string, unknown> = { ...rest };
    if (rest.country) data.country = rest.country.toUpperCase();
    if (rest.language) data.language = rest.language.toLowerCase();

    const updated = await prisma.signalSource.update({
      where: { id },
      data,
    });
    return updated;
  },
);
