import { useRef, useEffect, useCallback } from 'react';

/**
 * SmartScroll hook for Chat interfaces
 * Handles automatic scrolling to bottom when new messages arrive,
 * but only if the user was already near the bottom or if it's their own message.
 */
export const useSmartScroll = (dependency) => {
    const scrollRef = useRef(null);
    const lastScrollHeight = useRef(0);
    const isAtBottom = useRef(true);

    const checkScroll = useCallback(() => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        // If within 100px of bottom, consider it "at bottom"
        isAtBottom.current = scrollHeight - scrollTop - clientHeight < 100;
    }, []);

    const scrollToBottom = useCallback((behavior = 'auto') => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior
        });
    }, []);

    useEffect(() => {
        if (!scrollRef.current) return;

        const currentHeight = scrollRef.current.scrollHeight;
        
        // If we were at the bottom before the height changed, scroll to the new bottom
        if (isAtBottom.current) {
            scrollToBottom('smooth');
        }

        lastScrollHeight.current = currentHeight;
    }, [dependency, scrollToBottom]);

    return { scrollRef, checkScroll, scrollToBottom };
};
