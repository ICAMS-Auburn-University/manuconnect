import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  compiler: {
    // removeConsole:
    //   process.env.NODE_ENV === "production"
    //     ? {
    //         exclude: ["error", "warn"],
    //       }
    //     : false,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '5gb',
    },
  },
};

export default nextConfig;
