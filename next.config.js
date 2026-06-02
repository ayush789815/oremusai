/** @type {import('next').NextConfig} */

// Replicates the Vite dev proxy so the frontend keeps calling the same relative
// paths it always has. The Express backend is left untouched.
//   /api/*       -> Node backend (default http://localhost:5001)
//   /zoho-token  -> Zoho OAuth token endpoint (CORS-safe exchange)
//   /zoho-api/*  -> Zoho Books REST API (CORS-safe)
// In production, set API_PROXY_TARGET to the hosted backend, or point
// NEXT_PUBLIC_API_URL at it directly (axios honours it, same as the Vite build).
const API_PROXY_TARGET = process.env.API_PROXY_TARGET || 'http://localhost:5001';

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: '/api/:path*',  destination: `${API_PROXY_TARGET}/api/:path*` },
      { source: '/zoho-token',  destination: 'https://accounts.zoho.in/oauth/v2/token' },
      { source: '/zoho-api/:path*', destination: 'https://www.zohoapis.in/:path*' },
    ];
  },
  images: {
    // No remote image hosts in use today; add patterns here if introduced.
    remotePatterns: [],
  },
};

module.exports = nextConfig;
