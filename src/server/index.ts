import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import fastifyStatic from "@fastify/static";
import path from "path";

const IS_PROD = process.env.NODE_ENV === "production";

export const fastify = Fastify({
  logger: true,
});

console.log("IS_PROD", IS_PROD);

if (IS_PROD) {
  const distPath = path.join(__dirname, "../../dist");
  console.log(`Serving static files from ${distPath}`);
  fastify.register(fastifyStatic, {
    root: distPath,
  });
}

fastify.get("/api/hello", function (request, reply) {
  reply.send({ hello: "world" });
});

fastify.get("/api/health", function (request, reply) {
  reply.send({ status: "ok" });
});

const port = parseInt(process.env.PORT || "6789");

fastify.listen({ port, host: "0.0.0.0" }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
