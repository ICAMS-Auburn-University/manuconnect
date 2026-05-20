import path from 'path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  turbopack: {
    root: path.join(__dirname),
  },
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
  webpack: (config, { isServer }) => {
    // Allow occt-import-js WASM to be loaded
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    // Prevent Three.js from being bundled on the server
    if (isServer) {
      config.externals = config.externals || [];
    }
    return config;
  },
};

export default nextConfig;
