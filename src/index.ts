import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";

// routes M.A.R.A.
import login from "./routers/user/login";
import events from "./routers/events/events";
import workshops from "./routers/workshops/workshops";
import telegramChannels from "./routers/telegram-channels/telegram-channels.routes";
import mapRouter from "./routers/map/map";
import locationUsers from "./routers/locationUsers/locationUsers";
import places from "./routers/places/places";
import subscriptionsAdvert from "./routers/subscriptions-advert/subscriptions-advert";
import smsVerification from "./routers/sms-verification/sms-verification";
// routes my-site
import webMysite from "./routers/web/my-site";
// routes beauty sync
import beautySyncSms from "./beauty-sync/routers/sms";
import beautySyncCurrencies from "./beauty-sync/routers/currencies";
import beautySyncOpenAi from "./beauty-sync/routers/openAi";

// use hooks
import "./hooks/currencies/currencies";
import "./hooks/pushNotification/pushNotification";
import "./hooks/location/locationUsers";

// Beauty sync
import "./beauty-sync";

// Tehnoscarb
import "./tehnoscarb";

import { specs } from "./config/swagger";

dotenv.config();
const app = express();
app.set("trust proxy", 1);
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb" }));
app.use("/static", express.static("public"));
app.set("view engine", "ejs");

const swaggerLogin = process.env.SWAGGER_LOGIN;
const swaggerPassword = process.env.SWAGGER_PASSWORD;

// Swagger UI
const swaggerAuth = (req: Request, res: Response, next: NextFunction) => {
  const [scheme, encoded] = (req.headers.authorization || "").split(" ");
  const [login, ...rest] = Buffer.from(encoded || "", "base64")
    .toString()
    .split(":");
  const credentialsMatch =
    scheme === "Basic" &&
    login === swaggerLogin &&
    rest.join(":") === swaggerPassword;
  if (credentialsMatch) return next();
  res.set("WWW-Authenticate", 'Basic realm="api-docs"');
  res.status(401).send("Unauthorized");
};

if (swaggerLogin && swaggerPassword)
  app.use(
    "/api-docs",
    swaggerAuth,
    swaggerUi.serve,
    swaggerUi.setup(specs, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    })
  );

const PORT = process.env.PORT || 5008;
const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbDev = `${mongoUri}/motosect`;
const dbProd = `${mongoUri}/MARA`;
const db = process.env.NODE_ENV === "production" ? dbProd : dbDev;

mongoose
  .connect(db)
  .then(() => {
    console.warn("Connect to db");
  })
  .catch((error: Error) => {
    console.warn(error);
  });

const server = app.listen(PORT, () => {
  const baseUrl = `http://localhost:${PORT}`;
  console.warn(`Listening port: ${PORT}`);
  if (swaggerLogin && swaggerPassword)
    console.warn(`📚 Swagger UI is available at ${baseUrl}/api-docs`);
  else
    console.warn(
      `📚 Swagger UI is disabled (SWAGGER_LOGIN and SWAGGER_PASSWORD not set)`
    );

  console.warn(`🔗 API Base URL: ${baseUrl}/api`);
});

app.get("/healthz", (_req: Request, res: Response) => {
  const dbReady = mongoose.connection.readyState === 1;
  res.status(dbReady ? 200 : 503).json({ status: dbReady ? "ok" : "degraded" });
});

app.get("/api/", (_req: Request, res: Response, next: NextFunction) => {
  res.send("Working");
  next();
});

app.use(express.json());

// use routes M.A.R.A.
app.use("/api/user/login", login);
app.use("/api/user/subscriptions-advert", subscriptionsAdvert);
app.use("/api/events", events);
app.use("/api/workshops", workshops);
app.use("/api/telegram-channels", telegramChannels);
app.use("/api/map", mapRouter);
app.use("/api/location-users", locationUsers);
app.use("/api/places", places);
app.use("/api/sms-verification", smsVerification);
// use routes my-site
app.use("/api/web/my-site", webMysite);
// use routes beauty sync
app.use("/api/beauty-sync/sms", beautySyncSms);
app.use("/api/beauty-sync/currencies", beautySyncCurrencies);
app.use("/api/beauty-sync/open-ai", beautySyncOpenAi);

const shutdown = (signal: string) => {
  console.warn(`${signal} received, shutting down`);
  const forceExit = setTimeout(() => process.exit(1), 10000);
  forceExit.unref();
  server.close(async () => {
    await mongoose.connection.close();
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
