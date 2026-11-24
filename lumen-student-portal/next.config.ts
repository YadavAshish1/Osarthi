import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  htmlLimitedBots:
    /Googlebot|[\w-]+-Google|Google-[\w-]+|Chrome-Lighthouse|Bingbot|DuckDuckBot|Twitterbot|LinkedInBot|facebookexternalhit|WhatsApp|Slackbot/i,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "images.pexels.com" },
    ],
  },
  async redirects() {
    return [
      {
        source: "/become-teacher",
        destination: "/become-a-teacher",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
