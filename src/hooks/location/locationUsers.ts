import { deleteOtherUsersLocation } from "../../routers/locationUsers/locationUsers";

const TWENTY_MINUTES = 1000 * 60 * 20;

let firstStart = false;

const onIntervalGetDeleteLocations = () => {
  if (!firstStart) {
    deleteOtherUsersLocation();
    firstStart = true;
  }
  const interval = setInterval(deleteOtherUsersLocation, TWENTY_MINUTES);
  return () => clearInterval(interval);
};

if (process.env.ENABLE_JOBS === "true") onIntervalGetDeleteLocations();
