import { TIME_CONFIG } from "../config/time-config.js?v=20260716-pages-ready";

export function getEntryOption(entryHour, timeConfig = TIME_CONFIG) {
  return timeConfig.entryOptions.find((option) => option.hour === Number(entryHour)) || null;
}

export function getMaxGamesForEntry(entryHour, timeConfig = TIME_CONFIG) {
  return getEntryOption(entryHour, timeConfig)?.maxGames ?? 0;
}

export function getCurrentMinutes(entryHour, maxGames, remainingGames, timeConfig = TIME_CONFIG) {
  const playedGames = Math.max(0, Number(maxGames) - Number(remainingGames));
  return Math.round(Number(entryHour) * 60 + playedGames / timeConfig.gamesPerHour * 60);
}

export function formatClockByGames(entryHour, maxGames, remainingGames, timeConfig = TIME_CONFIG) {
  const minutes = getCurrentMinutes(entryHour, maxGames, remainingGames, timeConfig);
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
