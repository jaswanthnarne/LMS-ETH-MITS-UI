import { useState, useEffect, useCallback, useRef } from 'react';

const useCheatDetection = (onViolation, maxWarnings = 3, isActive = true, onIdleDetected = null) => {
    const [warnings, setWarnings] = useState({
        fullScreen: 0,
        tabSwitch: 0,
        copyPaste: 0,
        devTools: 0,
        windowBlur: 0,
        overlaysDetected: 0,
        idleTimeouts: 0,
        screenshareStopped: 0
    });
    
    const lastActivityRef = useRef(Date.now());
    const idleAlertTriggered = useRef(false);
    const lastViolationTimeRef = useRef({});

    const onViolationRef = useRef(onViolation);
    const onIdleDetectedRef = useRef(onIdleDetected);
    
    useEffect(() => {
        onViolationRef.current = onViolation;
        onIdleDetectedRef.current = onIdleDetected;
    }, [onViolation, onIdleDetected]);

    const triggerViolation = useCallback((type) => {
        if (!isActive) return;

        // Deduplication: ignore same violation type within 1 second
        const now = Date.now();
        const lastTime = lastViolationTimeRef.current[type] || 0;
        if (now - lastTime < 1000) return;
        lastViolationTimeRef.current[type] = now;

        setWarnings(prev => {
            const current = (prev[type] || 0) + 1;
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
        lastViolationTimeRef.current = {};

        const recordActivity = () => {
            lastActivityRef.current = Date.now();
            idleAlertTriggered.current = false;
        };

        // Primary tab switch detection via visibilitychange
        // This is the ONLY handler for tab switches to avoid double-counting
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

        // NOTE: We intentionally do NOT listen to 'blur' event here.
        // visibilitychange already covers tab switches, and blur fires
        // for many innocuous reasons (clicking browser chrome, dialogs, etc.)
        // causing false double-counts.

        const handleCopyPaste = (e) => {
            e.preventDefault();
            triggerViolation('copyPaste');
        };

        const handleContextMenu = (e) => {
            e.preventDefault();
        };

        const handleKeyDown = (e) => {
            recordActivity();
            
            // Block copy/paste/cut/find
            if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v' || e.key === 'x' || e.key === 'f' || e.key === 'a')) {
                e.preventDefault();
                triggerViolation('copyPaste');
            }
            
            // Block DevTools
            if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C'))) {
                e.preventDefault();
                triggerViolation('devTools');
            }

            // Block PrintScreen
            if (e.key === 'PrintScreen') {
                e.preventDefault();
                triggerViolation('copyPaste');
            }

            // Block Alt+Tab indicator (we can't prevent it, but we can detect the key combo)
            if (e.altKey && e.key === 'Tab') {
                e.preventDefault();
            }
        };

        // Mutation Observer for Overlays (extensions, grammarly, etc.)
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

        // Periodic checks for devtools and idle
        const checkInterval = setInterval(() => {
            // Devtools size check
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

        // Throttled mouse movement tracking
        let mouseTimeout = null;
        const handleMouseMove = () => {
            if (!mouseTimeout) {
                recordActivity();
                mouseTimeout = setTimeout(() => { mouseTimeout = null; }, 2000);
            }
        };

        // Disable text selection via CSS
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';

        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('copy', handleCopyPaste);
        document.addEventListener('paste', handleCopyPaste);
        document.addEventListener('cut', handleCopyPaste);
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
            document.body.style.userSelect = '';
            document.body.style.webkitUserSelect = '';
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('copy', handleCopyPaste);
            document.removeEventListener('paste', handleCopyPaste);
            document.removeEventListener('cut', handleCopyPaste);
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
