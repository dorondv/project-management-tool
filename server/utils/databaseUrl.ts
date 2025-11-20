const SUPABASE_POOLER_HOST_SUFFIX = '.pooler.supabase.com';
const SUPABASE_DIRECT_HOST_SUFFIX = '.supabase.co';
const SUPABASE_POOLER_PORT = '6543';

type NormalizeResult = {
  changed: boolean;
  messages: string[];
  maskedUrl?: string;
};

const ensureSearchParam = (
  url: URL,
  key: string,
  value: string,
  description: string,
  messages: string[]
) => {
  if (url.searchParams.get(key) !== value) {
    url.searchParams.set(key, value);
    messages.push(description);
    return true;
  }
  return false;
};

function maskDatabaseUrlString(urlString: string) {
  try {
    const safe = new URL(urlString);
    if (safe.password) {
      safe.password = '****';
    }
    return safe.toString();
  } catch {
    return undefined;
  }
}

export function ensureDatabaseUrlForPrisma(
  envVarName = 'DATABASE_URL'
): NormalizeResult {
  const original = process.env[envVarName];
  const result: NormalizeResult = {
    changed: false,
    messages: [],
  };

  if (!original) {
    result.messages.push(`${envVarName} is not set`);
    return result;
  }

  try {
    const url = new URL(original);
    const hostname = url.hostname;
    const isSupabasePooler = hostname.endsWith(SUPABASE_POOLER_HOST_SUFFIX);
    const isSupabaseDirect = hostname.endsWith(SUPABASE_DIRECT_HOST_SUFFIX);

    if (isSupabasePooler) {
      if (!url.port || url.port === '5432') {
        url.port = SUPABASE_POOLER_PORT;
        result.messages.push(
          `Adjusted ${envVarName} port to ${SUPABASE_POOLER_PORT} for Supabase connection pooling`
        );
        result.changed = true;
      }
      result.changed =
        ensureSearchParam(
          url,
          'pgbouncer',
          'true',
          'Added pgbouncer=true (required by Supabase pooler)',
          result.messages
        ) || result.changed;
      result.changed =
        ensureSearchParam(
          url,
          'connection_limit',
          '10',
          'Set connection_limit=10 for better parallel query performance (safe with pgbouncer transaction mode)',
          result.messages
        ) || result.changed;
      result.changed =
        ensureSearchParam(
          url,
          'sslmode',
          'require',
          'Enforced sslmode=require for TLS',
          result.messages
        ) || result.changed;
    } else if (isSupabaseDirect) {
      result.changed =
        ensureSearchParam(
          url,
          'sslmode',
          'require',
          'Enforced sslmode=require for direct Supabase connections',
          result.messages
        ) || result.changed;
    }

    if (result.changed) {
      process.env[envVarName] = url.toString();
    }

    result.maskedUrl = maskDatabaseUrlString(process.env[envVarName] ?? original);
    return result;
  } catch (error) {
    result.messages.push(
      `Failed to parse ${envVarName}: ${(error as Error).message}`
    );
    return result;
  }
}

export function maskDatabaseUrl(urlString?: string) {
  if (!urlString) return undefined;
  return maskDatabaseUrlString(urlString);
}

