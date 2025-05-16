import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";

export const fastify = Fastify({
  logger: true,
});

fastify.get("/", function (request, reply) {
  reply.send({ hello: "world" });
});

fastify.get("/api/hello", function (request, reply) {
  reply.send({ hello: "world" });
});

const port = parseInt(process.env.PORT || "6789");

fastify.listen({ port }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
