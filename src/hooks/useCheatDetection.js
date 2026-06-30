import { useState, useEffect, useCallback, useRef } from 'react';

const useCheatDetection = (onViolation, maxWarnings = 3, isActive = true, onIdleDetected = null) => {
    const [warnings, setWarnings] = useState({
        fullScreen: 0,
        tabSwitch: 0,
        copyPaste: 0,
        devTools: 0,
        windowBlur: 0,
        overlaysDetected: 0,
        idleTimeouts: 0
    });
    
    const lastActivityRef = useRef(Date.now());
    const idleAlertTriggered = useRef(false);

    const onViolationRef = useRef(onViolation);
    const onIdleDetectedRef = useRef(onIdleDetected);
    
    useEffect(() => {
        onViolationRef.current = onViolation;
        onIdleDetectedRef.current = onIdleDetected;
    }, [onViolation, onIdleDetected]);

    const triggerViolation = useCallback((type) => {
        if (!isActive) return;
        setWarnings(prev => {
            const current = (prev[type] || 0) + 1;
            // Delay calling onViolation to next tick to avoid React reconcile errors
            setTimeout(() => {
                if (onViolationRef.current) onViolationRef.current(type, current);
            }, 0);
            return { ...prev, [type]: current };
        });
    }, [isActive]);

    useEffect(() => {
        if (!isActive) return;
        
        lastActivityRef.current = Date.now();
        idleAlertTriggered.current = false;

        const recordActivity = () => {
            lastActivityRef.current = Date.now();
            idleAlertTriggered.current = false;
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                triggerViolation('tabSwitch');
            }
        };

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                triggerViolation('fullScreen');
            }
        };

        const handleBlur = () => {
            triggerViolation('windowBlur');
        };

        const handleCopyPaste = (e) => {
            e.preventDefault();
            triggerViolation('copyPaste');
        };

        const handleContextMenu = (e) => {
            e.preventDefault();
        };

        const handleKeyDown = (e) => {
            recordActivity();
            if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v' || e.key === 'x' || e.key === 'f')) {
                e.preventDefault();
                triggerViolation('copyPaste');
            }
            if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C'))) {
                e.preventDefault();
                triggerViolation('devTools');
            }
        };

        // Mutation Observer for Overlays
        const observer = new MutationObserver((mutations) => {
            for (let mutation of mutations) {
                if (mutation.addedNodes.length) {
                    mutation.addedNodes.forEach(node => {
                        if (node.tagName && (
                            node.tagName.toLowerCase().includes('grammarly') || 
                            node.tagName.toLowerCase().includes('extension') ||
                            (node.style && parseInt(node.style.zIndex) > 9990)
                        )) {
                            triggerViolation('overlaysDetected');
                        }
                    });
                }
            }
        });
        observer.observe(document.body, { childList: true, subtree: false });

        // Intervals for devtools sizes and idle checking
        const checkInterval = setInterval(() => {
            // Devtools checks
            const threshold = 160;
            const diffWidth = window.outerWidth - window.innerWidth;
            const diffHeight = window.outerHeight - window.innerHeight;
            if (diffWidth > threshold || diffHeight > threshold) {
                triggerViolation('devTools');
            }

            // Idle checking (45s)
            if (Date.now() - lastActivityRef.current > 45000 && !idleAlertTriggered.current) {
                idleAlertTriggered.current = true;
                if (onIdleDetectedRef.current) onIdleDetectedRef.current();
            }
        }, 3000);

        let mouseTimeout = null;
        const handleMouseMove = () => {
            if (!mouseTimeout) {
                recordActivity();
                mouseTimeout = setTimeout(() => { mouseTimeout = null; }, 2000); // throttle to 2 seconds
            }
        };

        window.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        window.addEventListener('blur', handleBlur);
        document.addEventListener('copy', handleCopyPaste);
        document.addEventListener('paste', handleCopyPaste);
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('keydown', handleKeyDown);
        window.addEventListener('scroll', recordActivity);
        window.addEventListener('mousedown', recordActivity);
        window.addEventListener('touchstart', recordActivity);
        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            observer.disconnect();
            clearInterval(checkInterval);
            if (mouseTimeout) clearTimeout(mouseTimeout);
            window.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('copy', handleCopyPaste);
            document.removeEventListener('paste', handleCopyPaste);
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('scroll', recordActivity);
            window.removeEventListener('mousedown', recordActivity);
            window.removeEventListener('touchstart', recordActivity);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, [triggerViolation, isActive]);

    return { warnings, triggerViolation };
};

export default useCheatDetection;
