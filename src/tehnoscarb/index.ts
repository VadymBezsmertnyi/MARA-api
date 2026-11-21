import cron from "node-cron";

// models
import "./tehnoscarb.model";

// services
import tehnoscarbCheckService from "./tehnoscarb.state";

if (process.env.ENABLE_JOBS === "true") {
  cron.schedule(
    "30 9,12,18 * * *",
    async () => {
      await tehnoscarbCheckService.start();
    },
    { timezone: "Europe/Kiev" }
  );

  tehnoscarbCheckService.start();
}
