import { useState, useEffect } from 'react';

/**
 * useMediaQuery
 * Custom hook to listen for media query changes.
 * Used for responsive layout decisions (e.g. mobile drawer vs desktop sidebar).
 */
export function useMediaQuery(query) {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) {
            setMatches(media.matches);
        }
        
        const listener = () => setMatches(media.matches);
        window.addEventListener('resize', listener);
        return () => window.removeEventListener('resize', listener);
    }, [matches, query]);

    return matches;
}
