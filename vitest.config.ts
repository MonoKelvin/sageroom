import { defineConfig, mergeConfig } from "vitest/config"
import viteConfig from "./vite.config.ts"

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      setupFiles: ["./vitest.setup.ts"],
      include: ["src/**/*.test.{ts,tsx}", "src/**/*.spec.{ts,tsx}"],
      clearMocks: true,
      restoreMocks: true,
      // 全量并发时用户交互类用例会逼近上限，留出资源争抢的余量。
      testTimeout: 30_000,
    },
  }),
)
