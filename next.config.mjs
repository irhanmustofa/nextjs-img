/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "linetx07us6cedjd.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
