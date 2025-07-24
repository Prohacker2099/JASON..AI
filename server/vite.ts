import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import { type Server } from "http";

export function log(message: string) {
  console.log(`[server] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  try {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server },
      },
      appType: "custom",
    });

    // Fix MIME type issues - add this middleware before vite middlewares
    app.use((req, res, next) => {
      if (
        req.path.endsWith(".js") ||
        req.path.endsWith(".jsx") ||
        req.path.endsWith(".ts") ||
        req.path.endsWith(".tsx") ||
        req.path.endsWith(".mjs")
      ) {
        res.setHeader("Content-Type", "application/javascript");
      }
      next();
    });

    app.use(vite.middlewares);

    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;

      try {
        const template = fs.readFileSync(
          path.resolve("client/index.html"),
          "utf-8",
        );
        const html = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (e) {
        next(e);
      }
    });

    return server;
  } catch (error) {
    console.error("Vite setup error:", error);
    throw error;
  }
}

export function serveStatic(app: Express) {
  // Fix MIME type issues for static files
  app.use((req, res, next) => {
    if (
      req.path.endsWith(".js") ||
      req.path.endsWith(".jsx") ||
      req.path.endsWith(".ts") ||
      req.path.endsWith(".tsx") ||
      req.path.endsWith(".mjs")
    ) {
      res.setHeader("Content-Type", "application/javascript");
    }
    next();
  });

  // Serve favicon explicitly
  app.get("/favicon.svg", (req, res) => {
    res.sendFile(path.resolve("client/public/favicon.svg"));
  });

  // Serve static files
  app.use(express.static(path.resolve("dist/public")));
  app.use(express.static(path.resolve("client/public")));

  // Fallback to index.html
  app.use("*", (req, res) => {
    res.sendFile(path.resolve("dist/public/index.html"));
  });
}
