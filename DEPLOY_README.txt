BharatVarshOfficial - GitHub Pages Deployment Patch

This patch adds the official Vite build and GitHub Pages deployment workflow.

The workflow runs after changes reach the main branch. It installs locked npm
dependencies, builds the Vite project, uploads the dist directory and deploys
that production artifact to GitHub Pages.

After this file is committed, GitHub repository Settings > Pages must use
GitHub Actions as the Build and deployment source.
