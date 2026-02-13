'use client';

import { useEffect, useState } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
    const [state, setState] = useState<T>(initialValue);
    useEffect(() => {
        try {
            const raw = localStorage.getItem(key);
            if (raw != null) setState(JSON.parse(raw));
        } catch { }
    }, [key]);

    useEffect(() => {
        const id = window.setTimeout(() => {
            try { localStorage.setItem(key, JSON.stringify(state)); } catch { }
        }, 120);
        return () => window.clearTimeout(id);
    }, [key, state]);

    return [state, setState] as const;
}
