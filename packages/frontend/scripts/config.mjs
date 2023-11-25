import esbuild from "esbuild";
import copy from "esbuild-plugin-copy";

export const context = await esbuild.context({
  entryPoints: ["src/lobby.tsx"],
  bundle: true,
  platform: "browser",
  format: "esm",
  sourcemap: true,
  outdir: "./dist",
  plugins: [
    copy({
        resolveFrom: 'cwd',
        assets: {
          from: ['./src/lobby.html'],
          to: ['./dist'],
        },
        watch: true,
    })
  ]
});
