import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { createServer as createViteServer } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createServer() {
  const app = express();

  // 以中间件模式创建 Vite 应用，并将 appType 配置为 'custom'
  // 这将禁用 Vite 自身的 HTML 服务逻辑
  // 并让上级服务器接管控制
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom",
  });

  // 使用 vite 的 Connect 实例作为中间件
  // 如果你使用了自己的 express 路由（express.Router()），你应该使用 router.use
  // 当服务器重启（例如用户修改了 vite.config.js 后），
  // `vite.middlewares` 仍将保持相同的引用
  // （带有 Vite 和插件注入的新的内部中间件堆栈）。
  // 即使在重新启动后，以下内容仍然有效。
  app.use(vite.middlewares);

  app.use("*", async (req, res, next) => {
    // 服务 index.html - 下面我们来处理这个问题
    const url = req.originalUrl;
    try {
      // 1. 读取 index.html
      let template = fs.readFileSync(
        path.resolve(__dirname, "index-ssr.html"),
        "utf-8"
      );

      // 2. 应用 Vite HTML 转换。这将会注入 Vite HMR 客户端，
      //    同时也会从 Vite 插件应用 HTML 转换。
      //    例如：@vitejs/plugin-react 中的 global preambles
      template = await vite.transformIndexHtml(url, template);

      const [templateStart, templateEnd] = template.split("<!--ssr-outlet-->");

      res.setHeader("Content-Type", "text/html");

      res.write(templateStart);
      // 3. 加载服务器入口。vite.ssrLoadModule 将自动转换
      //    你的 ESM 源码使之可以在 Node.js 中运行！无需打包
      //    并提供了一种高效的模块失效机制，类似于模块热替换（HMR）。
      const { render } = await vite.ssrLoadModule("/src/entry-server");

      // 4. 渲染应用的 HTML。这假设 entry-server.js 导出的 `render`
      //    函数调用了适当的 SSR 框架 API。
      //    例如 ReactDOMServer.renderToString()
      const { pipe } = await render(url, true, {
        onShellReady: () => {
          setTimeout(() => {
            const originEndHandler = res.end;
            res.end = function (...args) {
              res.write(templateEnd);
              originEndHandler.apply(this, args);
              res.end = originEndHandler;
            };
            pipe(res);
          });
        },
        onAllReady: () => {},
        bootstrapModules: ["/src/entry-client.tsx"],
      });
      // 5. 注入渲染后的应用程序 HTML 到模板中。
      // const html = template.replace(`<!--ssr-outlet-->`, () => appHtml);

      // 6. 返回渲染后的 HTML。
      // res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (e) {
      // 如果捕获到了一个错误，让 Vite 来修复该堆栈，这样它就可以映射回
      // 你的实际源码中。
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });

  app.listen(5173);
}

createServer();
