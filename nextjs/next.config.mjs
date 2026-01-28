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
        NEXT_PUBLIC_SMART_CONTRACT_ADDRESS: "0xEB7068E9B6f3c3858F4539Df9964721F71a703f8"
    },
    rewrites: async function () {
        if (process.env.NODE_ENV === 'production') {
            console.log("Production rewrite rules applied.");
            return [
                {
                    source: '/api/:path*',
                    destination: 'https://ncu-bccs-api.snks.cc/hono/:path*',
                },
                {
                    source: '/ipfs/:path*',
                    destination: 'https://ncu-bccs-api.snks.cc/ipfs/:path*',
                },
            ];
        }
        else {
            console.log("Development rewrite rules applied.");
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
    }
};

export default nextConfig;

// added by create cloudflare to enable calling `getCloudflareContext()` in `next dev`
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();