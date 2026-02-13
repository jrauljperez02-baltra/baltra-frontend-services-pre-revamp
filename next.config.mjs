// next.config.mjs
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
// (opcional) si lo usas:

/** @type {import('next').NextConfig} */

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const nextConfig = {
    eslint: { ignoreDuringBuilds: true },
    typescript: { ignoreBuildErrors: true },
    images: { unoptimized: true },
    webpack: (config) => {
        const root = resolve(__dirname); // raíz del repo
        config.resolve.alias = {
            ...(config.resolve.alias ?? {}),
            '@': root,
        };
        console.log('@@@ alias "@" =>', root); // deja esto para verificar en logs

        // Opcional, pero útil para detectar casing
        // config.plugins.push(new CaseSensitivePathsPlugin());

        return config;
    },
};

export default nextConfig;
