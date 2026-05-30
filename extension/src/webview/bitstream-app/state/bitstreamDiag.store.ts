import { create } from "zustand";
import type { DiagSnapshotData } from "../types/diagSnapshot";

type DiagSnapshotState = {
  snapshot: DiagSnapshotData | null;
  loading: boolean;
  error: string | null;
  updatedAt: number | null;
  setLoading: (loading: boolean) => void;
  setSnapshot: (snapshot: DiagSnapshotData) => void;
  setError: (error: string | null) => void;
};

export const useBitstreamDiagStore = create<DiagSnapshotState>((set) => ({
  snapshot: null,
  loading: false,
  error: null,
  updatedAt: null,
  setLoading: (loading) => set({ loading }),
  setSnapshot: (snapshot) =>
    set({ snapshot, loading: false, error: null, updatedAt: Date.now() }),
  setError: (error) => set({ error, loading: false }),
}));
