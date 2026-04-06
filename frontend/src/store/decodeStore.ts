import { create } from 'zustand';
import type { AlgorithmId, AnalysisResponse, CapacityResponse, DecodeResult } from '../api/client';

type DecodeState = {
  file: File | null;
  algorithm: AlgorithmId;
  password: string;
  capacity: CapacityResponse | null;
  result: DecodeResult | null;
  analysisResult: AnalysisResponse | null;
  loading: {
    submit: boolean;
    analysis: boolean;
  };
  error: string | null;
  setFile: (file: File | null) => void;
  setAlgorithm: (algorithm: AlgorithmId) => void;
  setPassword: (password: string) => void;
  setResult: (result: DecodeResult | null) => void;
  setAnalysisResult: (analysisResult: AnalysisResponse | null) => void;
  setLoading: (loading: Partial<DecodeState['loading']>) => void;
  setError: (error: string | null) => void;
};

export const useDecodeStore = create<DecodeState>((set) => ({
  file: null,
  algorithm: 'lsb-1',
  password: '',
  capacity: null,
  result: null,
  analysisResult: null,
  loading: {
    submit: false,
    analysis: false,
  },
  error: null,
  setFile: (file) => set({ file, result: null, analysisResult: null, error: null }),
  setAlgorithm: (algorithm) => set({ algorithm, error: null }),
  setPassword: (password) => set({ password }),
  setResult: (result) => set({ result, analysisResult: null }),
  setAnalysisResult: (analysisResult) => set({ analysisResult }),
  setLoading: (loading) => set((state) => ({ loading: { ...state.loading, ...loading } })),
  setError: (error) => set({ error }),
}));
