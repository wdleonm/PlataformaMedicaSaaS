/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Ignorar errores de ESLint durante la compilación de producción.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignorar errores de TypeScript durante la compilación de producción.
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
