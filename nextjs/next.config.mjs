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
    devIndicators: { position: "bottom-left" },
    env: {
        NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: "732dbd3ba5be9978067e2c1318e5cad7",
        NEXT_PUBLIC_SMART_CONTRACT_ADDRESS: "0xEDC16492ab1B5ad247Ad8f0E03D7D7554ce7F46e"
    },
    rewrites: async function () {
        return [
            {
                source: '/api/:path*',
                destination: 'http://localhost:8081/:path*',
            },
            {
                source: '/ipfs/:path*',
                destination: 'http://localhost:3001/:path*',
            },
        ];
    }
};

export default nextConfig;

// added by create cloudflare to enable calling `getCloudflareContext()` in `next dev`
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();