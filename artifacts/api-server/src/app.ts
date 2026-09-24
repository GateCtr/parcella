import express, { type Express } from "express";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { loadCurrentUser, protectUnsafeRequests } from "./middlewares/session";

const app: Express = express();
const trustedProxyHops = process.env.TRUST_PROXY_HOPS;
if (trustedProxyHops !== undefined) {
  if (!/^\d+$/.test(trustedProxyHops) || Number(trustedProxyHops) > 10) {
    throw new Error("TRUST_PROXY_HOPS must be an integer between 0 and 10.");
  }
  app.set("trust proxy", Number(trustedProxyHops));
}

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(protectUnsafeRequests);
app.use(loadCurrentUser);

app.use("/api", router);

export default app;
