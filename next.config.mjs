/** @type {import('next').NextConfig} */
const nextConfig = {
    trailingSlash: true,
    devIndicators: { position: "top-left" },
    env: {

    }
};

// export default nextConfig;
export default nextConfig;

// added by create cloudflare to enable calling `getCloudflareContext()` in `next dev`
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();