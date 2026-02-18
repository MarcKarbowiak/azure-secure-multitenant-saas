export interface RequestEnvelope {
  method: string;
  headers: Record<string, string | undefined>;
  params: Record<string, string | undefined>;
  body?: unknown;
}

export interface ResponseEnvelope {
  status: number;
  headers?: Record<string, string>;
  body?: unknown;
}

