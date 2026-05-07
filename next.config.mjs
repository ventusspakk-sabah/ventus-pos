/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: true }, // 跳過讓 Termux 崩潰的檢查
  eslint: { ignoreDuringBuilds: true },
};
export default nextConfig;
