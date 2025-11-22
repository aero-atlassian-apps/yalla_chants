import React, { Profiler, ProfilerOnRenderCallback } from 'react';

interface PerformanceMonitorProps {
    id: string;
    children: React.ReactNode;
    enabled?: boolean;
}

/**
 * Performance monitoring component for development
 * Wraps components to track render performance
 */
export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
    id,
    children,
    enabled = __DEV__, // Only enabled in development
}) => {
    const onRenderCallback: ProfilerOnRenderCallback = (
        id,
        phase,
        actualDuration,
        baseDuration,
        startTime,
        commitTime,
    ) => {
        if (!enabled) return;

        // Log performance metrics
        console.log(`[Performance:${id}]`, {
            phase,
            actualDuration: `${actualDuration.toFixed(2)}ms`,
            baseDuration: `${baseDuration.toFixed(2)}ms`,
            startTime: `${startTime.toFixed(2)}ms`,
            commitTime: `${commitTime.toFixed(2)}ms`,
        });

        // Warn if render is slow
        if (actualDuration > 16) {
            console.warn(
                `[Performance:${id}] Slow render detected: ${actualDuration.toFixed(2)}ms (target: 16ms for 60fps)`
            );
        }
    };

    if (!enabled) {
        return <>{children}</>;
    }

    return (
        <Profiler id={id} onRender={onRenderCallback}>
            {children}
        </Profiler>
    );
};

/**
 * Higher-order component to wrap screens with performance monitoring
 */
export function withPerformanceMonitor<P extends object>(
    Component: React.ComponentType<P>,
    id: string
) {
    return (props: P) => (
        <PerformanceMonitor id={id}>
            <Component {...props} />
        </PerformanceMonitor>
    );
}
