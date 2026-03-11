import { useEffect, useState } from 'react';

/**
 * Vanguard 2026: Advanced Optical Engineering
 * Dynamic Gamut Mapping and Luminance-Aware Reality checks.
 */
export function useOpticalEngine() {
    const [isP3, setIsP3] = useState(false);
    const [luminanceMultiplier, setLuminanceMultiplier] = useState(1);

    useEffect(() => {
        // 1. Dynamic OKLCH Gamut Mapping
        // Detects if the user has a wide-gamut display (like Apple XDR or 2026 OLEDs)
        if (typeof window !== 'undefined' && window.matchMedia) {
            const mediaQuery = window.matchMedia('(color-gamut: p3)');
            setIsP3(mediaQuery.matches);
            
            const handleChange = (e) => {
                setIsP3(e.matches);
                if (e.matches) {
                    document.documentElement.setAttribute('data-color-gamut', 'p3');
                } else {
                    document.documentElement.removeAttribute('data-color-gamut');
                }
            };
            
            if (mediaQuery.matches) {
                document.documentElement.setAttribute('data-color-gamut', 'p3');
            }
            
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, []);

    useEffect(() => {
        // 2. Luminance-Aware UI (Ambient Light Sensor API)
        // Dynamically shifts opacity and blur intensity based on room lighting.
        if (typeof window !== 'undefined' && 'AmbientLightSensor' in window) {
            try {
                const sensor = new window.AmbientLightSensor({ frequency: 1 });
                sensor.onreading = () => {
                    const lux = sensor.illuminance;
                    // Formula: Normal room (500 lux) = 1.0. Dark room < 0.8. Bright sun > 1.2
                    const normalized = Math.max(0.6, Math.min(1.4, lux / 500));
                    setLuminanceMultiplier(normalized);
                    
                    // Injecting CSS variable for absolute zero-latency style recalculations
                    document.documentElement.style.setProperty('--glass-opacity-multiplier', normalized.toFixed(2));
                };
                sensor.onerror = (e) => console.log('Optical Engine: Hardware sensor unavailable.');
                sensor.start();
                
                return () => sensor.stop();
            } catch (err) {
                console.log('Optical Engine: Insufficient clearance for Light Sensor API.');
            }
        }
    }, []);

    return { isP3, luminanceMultiplier };
}
