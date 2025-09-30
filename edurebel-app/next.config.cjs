/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    allowedDevOrigins: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      // add your LAN origin(s) if you hit the warning:
      'http://192.168.0.112:3000',
      'http://192.168.0.112:3001',
    ],
  },
};
export default nextConfig;
