import Bun from "bun";
import webApp from "./web/index.html";

const IS_DEV = Bun.env.NODE_ENV === "development";

const server = Bun.serve({
  port: process.env.PORT || 4444,

  development: IS_DEV,

  routes: {
    "/": webApp,

    "/health": new Response("OK"),
  },

  async fetch(req) {
    const url = new URL(req.url);
    const path = `./public${url.pathname}`;
    try {
      const file = Bun.file(path);
      if (!(await file.exists())) {
        return new Response("Not found", { status: 404 });
      }
      return new Response(file);
    } catch {
      return new Response("Internal error", { status: 500 });
    }
  },
});

console.log(`Server is running on ${server.url}`);

if (IS_DEV) {
  console.log(`Server is running in development mode`);
}
