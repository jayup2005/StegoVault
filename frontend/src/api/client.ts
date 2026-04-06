export type AlgorithmId = 'lsb-1' | 'lsb-2' | 'pvd' | 'dct' | 'bpcs';

export type CapacityResponse = {
  algorithm: AlgorithmId;
  available_bytes: number;
  header_bytes: number;
};

export type EncodeResult = {
  blobUrl: string;
  algorithm: string;
  payloadBytes: number;
  encrypted: boolean;
  timestamp: string;
};

export type DecodeResult = {
  success: boolean;
  algorithm: string;
  message: string;
};

export type AnalysisMethod = {
  name: string;
  score: number;
  interpretation: string;
  details: Record<string, number | string>;
};

export type AnalysisResponse = {
  suspicion_score: number;
  verdict: 'LIKELY_CLEAN' | 'MODERATE' | 'HIGH_SUSPICION';
  methods: AnalysisMethod[];
  lsb_planes: Array<{
    plane: number;
    width: number;
    height: number;
    data: number[][];
  }>;
  histograms: {
    r: number[];
    g: number[];
    b: number[];
    luminance: number[];
  };
  pvd_zones: Array<{
    range: string;
    fraction: number;
    count: number;
  }>;
  dct_histogram: number[];
  block_entropies: number[][];
};

const API_BASE = '/api';

async function parseApiError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { detail?: string };
    return data.detail ?? `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
}

async function postForm<T>(path: string, formData: FormData): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return (await response.json()) as T;
}

export async function fetchCapacity(file: File, algorithm: AlgorithmId): Promise<CapacityResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('algorithm', algorithm);
  return postForm<CapacityResponse>('/encode/capacity', formData);
}

export async function encodeFile(input: {
  file: File;
  message: string;
  algorithm: AlgorithmId;
  password?: string;
}): Promise<EncodeResult> {
  const formData = new FormData();
  formData.append('file', input.file);
  formData.append('message', input.message);
  formData.append('algorithm', input.algorithm);
  if (input.password) {
    formData.append('password', input.password);
  }

  const response = await fetch(`${API_BASE}/encode`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const buffer = await response.arrayBuffer();
  const blobUrl = URL.createObjectURL(new Blob([buffer], { type: 'image/png' }));
  return {
    blobUrl,
    algorithm: response.headers.get('X-Stego-Algorithm') ?? input.algorithm,
    payloadBytes: Number(response.headers.get('X-Stego-Payload-Bytes') ?? '0'),
    encrypted: response.headers.get('X-Stego-Encrypted') === 'true',
    timestamp: response.headers.get('X-Stego-Timestamp') ?? '',
  };
}

export async function decodeFile(input: {
  file: File;
  algorithm: AlgorithmId;
  password?: string;
}): Promise<DecodeResult> {
  const formData = new FormData();
  formData.append('file', input.file);
  formData.append('algorithm', input.algorithm);
  if (input.password) {
    formData.append('password', input.password);
  }

  return postForm<DecodeResult>('/decode', formData);
}

export async function analyzeFile(file: File): Promise<AnalysisResponse> {
  const formData = new FormData();
  formData.append('file', file);
  return postForm<AnalysisResponse>('/analyze', formData);
}
