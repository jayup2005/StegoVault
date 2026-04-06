import { create } from 'zustand';
import type { AlgorithmId, AnalysisResponse, CapacityResponse, EncodeResult } from '../api/client';

type EncodeState = {
  file: File | null;
  algorithm: AlgorithmId;
  password: string;
  message: string;
  capacity: CapacityResponse | null;
  result: EncodeResult | null;
  analysisResult: AnalysisResponse | null;
  loading: {
    capacity: boolean;
    submit: boolean;
  };
  error: string | null;
  setFile: (file: File | null) => void;
  setAlgorithm: (algorithm: AlgorithmId) => void;
  setPassword: (password: string) => void;
  setMessage: (message: string) => void;
  setCapacity: (capacity: CapacityResponse | null) => void;
  setResult: (result: EncodeResult | null) => void;
  setLoading: (loading: Partial<EncodeState['loading']>) => void;
  setError: (error: string | null) => void;
  resetResult: () => void;
};

export const useEncodeStore = create<EncodeState>((set, get) => ({
  file: null,
  algorithm: 'lsb-1',
  password: '',
  message: '',
  capacity: null,
  result: null,
  analysisResult: null,
  loading: {
    capacity: false,
    submit: false,
  },
  error: null,
  setFile: (file) => {
    const existing = get().result;
    if (existing) {
      URL.revokeObjectURL(existing.blobUrl);
    }
    set({ file, capacity: null, result: null, error: null });
  },
  setAlgorithm: (algorithm) => set({ algorithm, error: null }),
  setPassword: (password) => set({ password }),
  setMessage: (message) => set({ message }),
  setCapacity: (capacity) => set({ capacity }),
  setResult: (result) => {
    const previous = get().result;
    if (previous && previous.blobUrl !== result?.blobUrl) {
      URL.revokeObjectURL(previous.blobUrl);
    }
    set({ result });
  },
  setLoading: (loading) => set((state) => ({ loading: { ...state.loading, ...loading } })),
  setError: (error) => set({ error }),
  resetResult: () => {
    const existing = get().result;
    if (existing) {
      URL.revokeObjectURL(existing.blobUrl);
    }
    set({ result: null });
  },
}));
