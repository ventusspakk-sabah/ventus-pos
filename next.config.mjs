/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // 確保 Capacitor 能抓到靜態輸出
  images: { unoptimized: true }
};
export default nextConfig;
