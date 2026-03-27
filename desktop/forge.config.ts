import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerDMG } from "@electron-forge/maker-dmg";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { VitePlugin } from "@electron-forge/plugin-vite";
import type { ForgeConfig } from "@electron-forge/shared-types";

const config: ForgeConfig = {
  packagerConfig: {
    executableName: "infinite-adventures",
    asar: true,
    icon: "./build/icon",
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      name: "infinite-adventures",
    }),
    new MakerDMG({}),
    new MakerZIP({}, ["darwin"]),
    new MakerDeb({
      options: {
        name: "infinite-adventures",
        bin: "infinite-adventures",
        productName: "Infinite Adventures",
        genericName: "Adventure Game",
        description: "Infinite Adventures Desktop App",
        categories: ["Game"],
        icon: "./build/icon.png",
      },
    }),
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: "src/main/index.ts",
          config: "vite.main.config.ts",
          target: "main",
        },
        {
          entry: "src/preload/preload.ts",
          config: "vite.preload.config.ts",
          target: "preload",
        },
      ],
      renderer: [],
    }),
  ],
};

export default config;
