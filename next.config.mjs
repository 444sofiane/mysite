/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        remotePatterns: [
          {
            protocol: 'https',
            hostname: 'raw.githubusercontent.com'
          },
          {
            protocol: 'https',
            hostname: 'duiker101.github.io'
          },
          {
            protocol: 'https',
            hostname: 'avatars.githubusercontent.com'
          }
        ],
      },
};

export default nextConfig;
