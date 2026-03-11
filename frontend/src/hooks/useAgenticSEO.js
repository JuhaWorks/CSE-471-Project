import { useEffect } from 'react';

/**
 * Vanguard 2026: Agentic MX Hook
 * Intelligently injects structured JSON-LD into the DOM for AI Scrapers and M2M Protocols.
 * Ensures strict Semantic Integrity without Cumulative Layout Shift (CLS).
 * 
 * @param {Object} schemaData - The exact JSON-LD object to be serialized.
 */
export function useAgenticSEO(schemaData) {
    useEffect(() => {
        if (!schemaData) return;
        
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-agent-intent', 'structured-context-injection');
        script.text = JSON.stringify({
            "@context": "https://schema.org",
            ...schemaData
        });
        
        document.head.appendChild(script);
        
        // ── Vanguard 2026: Strict Memory Hygiene ──
        return () => {
            document.head.removeChild(script);
        };
    }, [schemaData]);
}
