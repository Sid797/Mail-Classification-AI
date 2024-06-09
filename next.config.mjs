/** @type {import('next').NextConfig} */
// next.config.js
const nextConfig = {
    reactStrictMode: true,
    env: {
      GOOGLE_ID: process.env.GOOGLE_ID,
      GOOGLE_SECRET: process.env.GOOGLE_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    },
  };
  
  
export default nextConfig;
  
