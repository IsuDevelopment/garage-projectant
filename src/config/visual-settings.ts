import { z } from 'zod';
import { DEFAULT_SETTINGS, type VisualEnvironmentConfig } from './settings';

const cloudSchema = z.object({
  seed: z.number().int(),
  bounds: z.tuple([z.number(), z.number(), z.number()]),
  volume: z.number().positive(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  opacity: z.number().min(0).max(1),
  speed: z.number().min(0),
  position: z.tuple([z.number(), z.number(), z.number()]),
});

const treeSchema = z.object({
  type: z.enum(['conifer', 'deciduous']),
  position: z.tuple([z.number(), z.number(), z.number()]),
  scale: z.number().positive().optional(),
  crownColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  trunkColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export const visualSettingsSchema = z.object({
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  sky: z.object({
    radius: z.number().positive(),
    topColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    midColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    horizonColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  }),
  clouds: z.array(cloudSchema),
  trees: z.array(treeSchema),
});

export type VisualSettingsInput = z.infer<typeof visualSettingsSchema>;

export function getDefaultVisualSettings(): VisualEnvironmentConfig {
  return structuredClone(DEFAULT_SETTINGS.visual!);
}

export function parseVisualSettings(input: unknown): VisualEnvironmentConfig {
  return visualSettingsSchema.parse(input);
}

export function safeParseVisualSettings(input: unknown) {
  return visualSettingsSchema.safeParse(input);
}

export function resolveVisualSettings(
  globalVisual?: unknown,
  clientVisual?: unknown,
): VisualEnvironmentConfig {
  const fallback = getDefaultVisualSettings();

  const globalParsed = globalVisual == null ? null : safeParseVisualSettings(globalVisual);
  const clientParsed = clientVisual == null ? null : safeParseVisualSettings(clientVisual);

  return clientParsed?.success
    ? clientParsed.data
    : globalParsed?.success
      ? globalParsed.data
      : fallback;
}