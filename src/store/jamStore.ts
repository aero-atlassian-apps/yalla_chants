import { create } from 'zustand';
import { JamSession } from '../services/jamService';

interface JamState {
    currentSession: JamSession | null;
    isLoading: boolean;
    error: string | null;
    setCurrentSession: (session: JamSession | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useJamStore = create<JamState>((set) => ({
    currentSession: null,
    isLoading: false,
    error: null,
    setCurrentSession: (session) => set({ currentSession: session }),
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
}));
