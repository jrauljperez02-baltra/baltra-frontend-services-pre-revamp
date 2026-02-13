import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Baltra Pipeline',
        short_name: 'Baltra',
        description: 'End-to-end HR pipeline for frontline worker hiring',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#e11d48',
        icons: [
            {
                src: '/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    };
}
