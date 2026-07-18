import { createGraphPoint } from "./graph-data.js";
import { formatClockByGames } from "./time-engine.js?v=20260719-scroll-anchor";

export function createDefaultPlayerGraph() {
  return {
    graphPoints: [createGraphPoint(0, 0)],
    playSegments: [],
    activeSegment: null,
    playDifference: 0
  };
}

export function ensurePlayerGraph(player) {
  if (!Array.isArray(player.graphPoints) || player.graphPoints.length === 0) {
    player.graphPoints = [createGraphPoint(0, Number(player.totalOutCoins || 0) - Number(player.totalInCoins || 0))];
  }
  if (!Array.isArray(player.playSegments)) player.playSegments = [];
  if (player.activeSegment === undefined) player.activeSegment = null;
  player.playDifference = Number(player.totalOutCoins || 0) - Number(player.totalInCoins || 0);
  syncPlayerGraphPoint(player);
  return player;
}

export function startPlayerSegment(game, machine) {
  const player = ensurePlayerGraph(game.player);
  if (player.activeSegment?.machineId === machine.id) return player.activeSegment;
  closePlayerSegment(game);

  player.activeSegment = {
    id: `segment-${player.playSegments.length + 1}`,
    machineId: machine.id,
    machineNumber: machine.number,
    startPlayerGame: Number(player.totalGames || 0),
    endPlayerGame: Number(player.totalGames || 0),
    startDifference: player.playDifference,
    endDifference: player.playDifference,
    games: 0,
    difference: 0,
    startClock: formatClockByGames(game.entryHour, game.maxGames, game.remainingGames),
    endClock: formatClockByGames(game.entryHour, game.maxGames, game.remainingGames)
  };
  return player.activeSegment;
}

export function closePlayerSegment(game) {
  const player = ensurePlayerGraph(game.player);
  if (!player.activeSegment) return null;
  const segment = {
    ...player.activeSegment,
    endClock: formatClockByGames(game.entryHour, game.maxGames, game.remainingGames)
  };
  if (segment.games > 0 || segment.startPlayerGame !== segment.endPlayerGame) {
    player.playSegments.push(segment);
  }
  player.activeSegment = null;
  return segment;
}

export function recordPlayerGraphPoint(game) {
  const player = ensurePlayerGraph(game.player);
  const difference = Number(player.totalOutCoins || 0) - Number(player.totalInCoins || 0);
  player.playDifference = difference;

  const last = player.graphPoints[player.graphPoints.length - 1];
  const point = createGraphPoint(player.totalGames, difference);
  if (last?.game === point.game) {
    last.difference = point.difference;
  } else {
    player.graphPoints.push(point);
  }

  if (player.activeSegment) {
    player.activeSegment.endPlayerGame = player.totalGames;
    player.activeSegment.endDifference = difference;
    player.activeSegment.games = player.activeSegment.endPlayerGame - player.activeSegment.startPlayerGame;
    player.activeSegment.difference = player.activeSegment.endDifference - player.activeSegment.startDifference;
    player.activeSegment.endClock = formatClockByGames(game.entryHour, game.maxGames, game.remainingGames);
  }
}

function syncPlayerGraphPoint(player) {
  const difference = Number(player.totalOutCoins || 0) - Number(player.totalInCoins || 0);
  const last = player.graphPoints[player.graphPoints.length - 1];
  if (!last || last.game !== Number(player.totalGames || 0) || last.difference !== difference) {
    const point = createGraphPoint(Number(player.totalGames || 0), difference);
    if (last?.game === point.game) last.difference = point.difference;
    else player.graphPoints.push(point);
  }
}
