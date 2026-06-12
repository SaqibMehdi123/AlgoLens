/**
 * Content-Security-Policy (TRD §7). `worker-src 'self' blob:` confines the exec/bench workers.
 * `script-src` keeps `'unsafe-eval'` BECAUSE the client-side sandbox workers (Complexity Lab,
 * sample runs) execute user code via the Function constructor — the Web Worker (no DOM, no
 * network, terminate-on-timeout) is itself the isolation boundary, so eval there is by design,
 * not a stray. `'unsafe-inline'` covers the pre-paint theme script + framework inline styles.
 */
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self' https://fonts.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "worker-src 'self' blob:",
  "connect-src 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@algolens/algo-core",
    "@algolens/viz-engine",
    "@algolens/ui",
    "@algolens/api-contracts",
    "@algolens/complexity",
    "@algolens/content",
    "@algolens/retention",
    "@algolens/worker",
  ],
  // Lint is run as its own Turborepo task; don't fail the build on it here.
  eslint: { ignoreDuringBuilds: true },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
