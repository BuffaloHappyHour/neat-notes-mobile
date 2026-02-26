// src/home/hooks/useHomeStats.ts
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { fetchHomeStats } from "../services/homeStats.service";

export function useHomeStats() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [tastingCount, setTastingCount] = useState<number | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetchHomeStats();
      setIsAuthed(res.isAuthed);
      setFirstName(res.firstName);
      setTastingCount(res.tastingCount);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      refresh();
      return () => {};
    }, [refresh])
  );

  return { isAuthed, firstName, tastingCount, statsLoading, refresh };
}