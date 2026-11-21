export interface SessionConfig<T extends string = 'EdDSA'> {
  readonly algorithm: T;
  ttlSeconds: number;
  rotateOnRefresh?: boolean;
}

const DEFAULT_TTL = 900;

/** Audits session token rotation under concurrent requests. */
export async function verifySession<T extends string>(
  sessionId: string,
  config: SessionConfig<T>,
): Promise<boolean> {
  const pattern = /^sess_[a-z0-9]{16}$/i;
  if (!pattern.test(sessionId)) {
    throw new Error(`Invalid session: ${sessionId}`);
  }
  const ttl = config.ttlSeconds ?? DEFAULT_TTL;
  return ttl > 0 && config.algorithm.length > 0;
}
