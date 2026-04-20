/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  i18n: {
    locales: ["en", "de"],
    defaultLocale: "en",
  },
  images: {
    minimumCacheTTL: 60 * 60 * 24 * 365, // There are no dynamic images used here.
  },
  reactCompiler: true,
  // Disable Turbopack for production builds — Azure Files (CIFS) symlinks
  // cause TurbopackInternalError: "Symlink node_modules points out of filesystem root"
  turbopack: false,
};

module.exports = nextConfig;
