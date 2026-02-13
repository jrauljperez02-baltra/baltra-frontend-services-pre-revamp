'use client';

import React, { useEffect, useId, useRef, useState } from 'react';

type Props = {
    content: React.ReactNode;
    side?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
    disabled?: boolean;
    className?: string;
    children: React.ReactElement<any>;
};

export default function Tooltip({
    content,
    side = 'top',
    delay = 120,
    disabled = false,
    className = '',
    children,
}: Props) {
    const [open, setOpen] = useState(false);
    const [ready, setReady] = useState(false);
    const timerRef = useRef<number | null>(null);
    const contentId = useId();

    useEffect(() => {
        setReady(true);
        return () => { if (timerRef.current) window.clearTimeout(timerRef.current); };
    }, []);

    const show = () => {
        if (disabled) return;
        if (timerRef.current) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => setOpen(true), delay);
    };
    const hide = () => {
        if (timerRef.current) window.clearTimeout(timerRef.current);
        setOpen(false);
    };

    const pos =
        side === 'bottom' ? 'left-1/2 -translate-x-1/2 top-full mt-2' :
            side === 'left' ? 'right-full mr-2 top-1/2 -translate-y-1/2' :
                side === 'right' ? 'left-full ml-2 top-1/2 -translate-y-1/2' :
                    'left-1/2 -translate-x-1/2 bottom-full mb-2';

    const prevProps = (children.props ?? {}) as any;

    const injected: Record<string, any> = {
        onMouseEnter: (e: React.MouseEvent) => { prevProps.onMouseEnter?.(e); show(); },
        onMouseLeave: (e: React.MouseEvent) => { prevProps.onMouseLeave?.(e); hide(); },
        onFocus: (e: React.FocusEvent) => { prevProps.onFocus?.(e); show(); },
        onBlur: (e: React.FocusEvent) => { prevProps.onBlur?.(e); hide(); },
        'aria-describedby': !disabled && open ? contentId : undefined,
    };

    const child = React.cloneElement(children as React.ReactElement<any>, injected as any);

    return (
        <span className="relative inline-flex" onMouseLeave={hide} onBlur={hide}>
            {child}
            {ready && open && !disabled && (
                <span
                    id={contentId}
                    role="tooltip"
                    className={[
                        'absolute z-50 rounded-md bg-gray-900 text-white text-xs px-2 py-1 shadow',
                        'pointer-events-none select-none opacity-100 scale-100 transition transform',
                        pos,
                        className,
                    ].join(' ')}
                >
                    {content}
                    <span
                        aria-hidden
                        className={[
                            'absolute h-2 w-2 rotate-45 bg-gray-900',
                            side === 'top' && '-bottom-1 left-1/2 -translate-x-1/2',
                            side === 'bottom' && '-top-1 left-1/2 -translate-x-1/2',
                            side === 'left' && 'right-[-3px] top-1/2 -translate-y-1/2',
                            side === 'right' && 'left-[-3px] top-1/2 -translate-y-1/2',
                        ].filter(Boolean).join(' ')}
                    />
                </span>
            )}
        </span>
    );
}
