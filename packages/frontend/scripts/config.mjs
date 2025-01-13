import esbuild, { analyzeMetafile } from "esbuild";
import copy from "esbuild-plugin-copy";

export const context = await esbuild.context({
  entryPoints: ["src/lobby.tsx"],
  bundle: true,
  platform: "browser",
  format: "esm",
  sourcemap: true,
  outdir: "./dist",
  metafile: true,
  external: ["*.woff2"],
  plugins: [
    copy({
      resolveFrom: "cwd",
      assets: {
        from: ["./src/lobby.html"],
        to: ["./dist"],
      },
      watch: true,
    }),
    copy({
      resolveFrom: "cwd",
      assets: {
        from: ["./src/static/*"],
        to: ["./dist/"],
      },
      watch: true,
    }),
    {
      name: "analyzeMetafile",
      setup(build) {
        build.onEnd(async (result) => {
          console.log(await analyzeMetafile(result.metafile));
        });
      },
    },
  ],
});
