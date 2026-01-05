import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ConferenceState {
    activeConferenceId: string | null;
    setActiveConference: (id: string | null) => void;
    clearActiveConference: () => void;
}

export const useConferenceStore = create<ConferenceState>()(
    persist(
        (set) => ({
            activeConferenceId: null,

            setActiveConference: (id) => {
                set({ activeConferenceId: id });
            },

            clearActiveConference: () => {
                set({ activeConferenceId: null });
            },
        }),
        {
            name: 'conference-context', // localStorage key
        }
    )
);
