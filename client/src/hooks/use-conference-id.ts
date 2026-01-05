import { useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useConferenceStore } from '@/stores/conference-store';

/**
 * Hook to get conference ID from URL params or global store
 * If URL has conferenceId, it syncs with the store
 * This ensures consistent conference context across the app
 */
export function useConferenceId(): string | null {
    const { id } = useParams<{ id: string }>();
    const { activeConferenceId, setActiveConference } = useConferenceStore();

    // If URL has conference ID, sync it with store
    useEffect(() => {
        if (id && id !== activeConferenceId) {
            setActiveConference(id);
        }
    }, [id, activeConferenceId, setActiveConference]);

    // Return URL param if available, otherwise store value
    return id || activeConferenceId;
}
