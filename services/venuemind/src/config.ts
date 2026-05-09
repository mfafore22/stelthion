export interface VenueMindConfig {
  port: number;
  internalToken?: string;
  nodeEnv: string;
}

export function loadVenueMindConfig(env: NodeJS.ProcessEnv = process.env): VenueMindConfig {
  const nodeEnv = env.NODE_ENV ?? 'development';
  const internalToken = env.VENUEMIND_INTERNAL_TOKEN;
  if (nodeEnv === 'production' && !internalToken) {
    throw new Error('VENUEMIND_INTERNAL_TOKEN is required in production');
  }
  return {
    port: Number(env.VENUEMIND_PORT ?? 4312),
    internalToken,
    nodeEnv,
  };
}
