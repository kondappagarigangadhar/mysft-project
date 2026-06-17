import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  async redirects() {
    return [
      {
        source: "/favicon.ico",
        destination: "/mysft-icon.png",
        permanent: false,
      },
      {
        source: "/dashboard",
        destination: "/company-admin/ai-command-center",
        permanent: false,
      },
      {
        source: "/companies/create",
        destination: "/platform/tenants/view/new",
        permanent: false,
      },
      {
        source: "/companies/:companyId/edit",
        destination: "/platform/tenants/view/:companyId?edit=1",
        permanent: false,
      },
      {
        source: "/companies/:companyId",
        destination: "/platform/tenants/view/:companyId",
        permanent: false,
      },
      {
        source: "/companies",
        destination: "/platform/tenants",
        permanent: false,
      },
      {
        source: "/platform/community/residents/create",
        destination: "/platform/community/residents/view/new",
        permanent: false,
      },
      {
        source: "/platform/community/service-maintenance/create",
        destination: "/platform/community/service-maintenance/view/new",
        permanent: false,
      },
      {
        source: "/leads/edit/:slug",
        destination: "/leads/view/:slug?edit=1",
        permanent: true,
      },
      {
        source: "/users/create",
        destination: "/platform/users/view/new",
        permanent: false,
      },
      {
        source: "/users/:userId/edit",
        destination: "/platform/users/view/:userId?edit=1",
        permanent: false,
      },
      {
        source: "/users/:userId",
        destination: "/platform/users/view/:userId",
        permanent: false,
      },
      {
        source: "/users",
        destination: "/platform/users",
        permanent: false,
      },
      {
        source: "/settings",
        destination: "/company-admin/platform-foundation",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
