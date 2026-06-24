import { useCallback, useEffect, useState } from "react";

import {
  type ApproximateLocation,
  canAskForLocation,
  getApproximateLocation,
  requestLocationPermission,
} from "../../../lib/location";

export type LocationStatus = "undetermined" | "granted" | "denied" | "loading";

export function useLocationPermission() {
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("loading");
  const [approxLocation, setApproxLocation] = useState<ApproximateLocation | null>(null);

  useEffect(() => {
    (async () => {
      const canAsk = await canAskForLocation();
      if (canAsk) {
        setLocationStatus("undetermined");
        return;
      }
      // Already answered — read existing status without prompting
      const result = await requestLocationPermission();
      if (result.status === "granted") {
        setLocationStatus("granted");
        const loc = await getApproximateLocation();
        setApproxLocation(loc);
      } else {
        setLocationStatus("denied");
      }
    })();
  }, []);

  const requestLocation = useCallback(async () => {
    setLocationStatus("loading");
    const result = await requestLocationPermission();
    if (result.status === "granted") {
      setLocationStatus("granted");
      const loc = await getApproximateLocation();
      setApproxLocation(loc);
    } else {
      setLocationStatus("denied");
    }
  }, []);

  return { locationStatus, approxLocation, requestLocation };
}
