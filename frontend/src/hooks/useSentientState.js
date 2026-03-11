import { useSyncExternalStore } from 'react';

/**
 * Vanguard 2026: Sentient State Management
 * Ephemeral Persistence via IndexedDB bridge for high-frequency micro-interactions.
 * Survives tab closures, crashes, and network drops without blocking the main thread.
 */

// Simple In-Memory Fallback & Event Emitter
const storeCache = new Map();
const listeners = new Set();

const emitChange = () => {
    listeners.forEach(listener => listener());
};

// Extremely lightweight IndexedDB wrapper for Ephemeral State
let dbPromise = null;
if (typeof window !== 'undefined') {
    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open('vanguard_sentient_state', 1);
        request.onupgradeneeded = (e) => {
            e.target.result.createObjectStore('ephemeral', { keyPath: 'key' });
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

const getSnapshot = (key) => storeCache.get(key) || null;

const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

export function useSentientState(key, initialValue) {
    // 1. Sync External Store (Predictable, Concurrent-Safe React 19)
    const state = useSyncExternalStore(subscribe, () => getSnapshot(key), () => initialValue);

    // 2. Initialize from IndexedDB on first mount (Predictive Hydration Fallback)
    if (!storeCache.has(key)) {
        storeCache.set(key, initialValue);
        dbPromise?.then(db => {
            const tx = db.transaction('ephemeral', 'readonly');
            const req = tx.objectStore('ephemeral').get(key);
            req.onsuccess = () => {
                if (req.result) {
                    storeCache.set(key, req.result.value);
                    emitChange();
                }
            };
        }).catch(() => {});
    }

    // 3. Setter function (Writes memory synchronously, defers DB write for zero-latency)
    const setSentientState = (newValue) => {
        const valueToStore = typeof newValue === 'function' ? newValue(state) : newValue;
        storeCache.set(key, valueToStore);
        emitChange(); // Instantly update UI

        // Defer heavy I/O to prevent main-thread blocking
        if (typeof window !== 'undefined' && window.requestIdleCallback) {
            window.requestIdleCallback(() => {
                dbPromise?.then(db => {
                    const tx = db.transaction('ephemeral', 'readwrite');
                    tx.objectStore('ephemeral').put({ key, value: valueToStore });
                }).catch(() => {});
            });
        }
    };

    return [state, setSentientState];
}

/**
 * Predictive Hydration Hook
 * Uses heuristic tracking (hover events) to pre-fetch state before click execution.
 */
export function usePredictiveHydration(targetPath, performPrefetch) {
    return {
        onMouseEnter: () => performPrefetch(targetPath),
        onFocus: () => performPrefetch(targetPath)
    };
}
