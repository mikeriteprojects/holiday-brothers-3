import type { NextConfig } from "next";

// GitHub Pages serves a personal repo at /<repo-name>/, not the domain root,
// so production builds need basePath/assetPrefix set — but `npm run dev`
// must stay at "/" or every local link breaks.
const isGithubPagesBuild = process.env.GITHUB_PAGES_BUILD === "true";
const repoName = "holiday-brothers-3";

const nextConfig: NextConfig = {
  output: "export",
  ...(isGithubPagesBuild && {
    basePath: `/${repoName}`,
    assetPrefix: `/${repoName}/`,
  }),
};

export default nextConfig;
