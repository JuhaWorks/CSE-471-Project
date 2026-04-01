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
        setMatches(media.matches);
        
        const listener = (e) => setMatches(e.matches || media.matches);
        
        if (media.addEventListener) {
            media.addEventListener('change', listener);
        } else {
            media.addListener(listener);
        }
        
        return () => {
            if (media.removeEventListener) {
                media.removeEventListener('change', listener);
            } else {
                media.removeListener(listener);
            }
        };
    }, [query]);

    return matches;
}
