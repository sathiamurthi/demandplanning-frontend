import fs from 'fs';
import path from 'path';

try {
  fs.rmSync(path.join(process.cwd(), '.next'), { recursive: true, force: true });
  console.log('Wiped .next cache!');
} catch (e) {}

try {
  fs.rmSync(path.join(process.cwd(), 'app', 'data360'), { recursive: true, force: true });
  console.log('Wiped app/data360!');
} catch (e) {}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true }
};

export default nextConfig;
