import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure Three.js ESM modules are transpiled correctly
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
};

export default nextConfig;
