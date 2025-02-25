import react from "@vitejs/plugin-react";
export default function ({ mode, command }) {
  return {
    plugins: [],
    build: {
      ssr: true, // 启用 SSR 支持
      manifest: true, // 生成 manifest 文件，这对于 SSR 是必要的
      rollupOptions: {
        input: "server/index.js", // 指定服务器端入口文件
      },
    },
    ssr: {
    },
  };
}
