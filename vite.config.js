import { resolve } from "node:path";
import { cp, mkdir } from "node:fs/promises";
import { defineConfig } from "vite";

const copyWallpaperAssets = {
    name: "copy-wallpaper-assets",
    apply: "build",
    async writeBundle(options) {
        const outputDirectory = resolve(
            import.meta.dirname,
            options.dir || "dist"
        );

        const sourceDirectory = resolve(
            import.meta.dirname,
            "assets/wallpapers"
        );
        const sourceLogo = resolve(
            import.meta.dirname,
            "assets/logo.png"
        );

        const targetDirectory = resolve(
            outputDirectory,
            "assets/wallpapers"
        );

        await mkdir(targetDirectory, {
            recursive: true
        });

        await cp(sourceDirectory, targetDirectory, {
            recursive: true
        });
        await cp(
            sourceLogo,
            resolve(outputDirectory, "assets/logo.png")
        );
    }
};

export default defineConfig({
    base: "/",
    plugins: [copyWallpaperAssets],
    build: {
        rollupOptions: {
            input: {
                main: resolve(import.meta.dirname, "index.html"),
                admin: resolve(import.meta.dirname, "admin.html"),
                policies: resolve(
                    import.meta.dirname,
                    "policies.html"
                ),
                profile: resolve(
                    import.meta.dirname,
                    "profile.html"
                ),
                creator: resolve(
                    import.meta.dirname,
                    "creator.html"
                ),
                creatorStudio: resolve(
                    import.meta.dirname,
                    "creator-studio.html"
                ),
                dashboard: resolve(
                    import.meta.dirname,
                    "css/js/firebase/dashboard.html"
                )
            }
        }
    }
});
