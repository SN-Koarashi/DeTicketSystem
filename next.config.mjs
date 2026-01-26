/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
                pathname: '/**',
            },
        ],
    },
    trailingSlash: true,
    devIndicators: { position: "top-left" },
    env: {
        NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: "732dbd3ba5be9978067e2c1318e5cad7"
    },
    rewrites: async function () {
        return [
            {
                source: '/api/:path*',
                destination: 'http://localhost:8081/:path*',
            },
        ];
    }
};

export default nextConfig;

// added by create cloudflare to enable calling `getCloudflareContext()` in `next dev`
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();