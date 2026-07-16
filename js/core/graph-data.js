export function createGraphPoint(game, difference) {
  return { game: Math.max(0, Math.floor(game)), difference: Math.round(difference) };
}

export function appendGraphPoint(target, game, difference) {
  if (!Array.isArray(target.graphPoints)) target.graphPoints = [];
  const point = createGraphPoint(game, difference);
  const last = target.graphPoints[target.graphPoints.length - 1];

  if (last?.game === point.game) {
    last.difference = point.difference;
    return true;
  }

  target.graphPoints.push(point);
  return true;
}

export function appendMachineGraphPoint(machine) {
  return appendGraphPoint(machine, machine.graphTimeIndex ?? machine.currentTotalGames, machine.currentDifference);
}

export function normalizeGraphPoints(points) {
  if (!Array.isArray(points) || points.length === 0) return [createGraphPoint(0, 0)];
  return points.map((point) => createGraphPoint(point.game, point.difference));
}

export function syncGraphFinalPoint(machine) {
  if (!Array.isArray(machine.graphPoints)) {
    machine.graphPoints = [];
  }
  appendMachineGraphPoint(machine);
}

export function calculateYAxisScale(points) {
  const safePoints = Array.isArray(points) && points.length ? points : [createGraphPoint(0, 0)];
  const maxAbs = Math.max(1000, ...safePoints.map((point) => Math.abs(Number(point.difference || 0))));
  return Math.ceil(maxAbs / 1000) * 1000;
}

export function calculateGraphStats(points) {
  const safePoints = Array.isArray(points) && points.length ? points : [createGraphPoint(0, 0)];
  const differences = safePoints.map((point) => Number(point.difference || 0));
  return {
    final: differences[differences.length - 1] || 0,
    max: Math.max(...differences),
    min: Math.min(...differences)
  };
}

export function thinGraphPointsForRender(points, targetCount) {
  const safePoints = normalizeGraphPoints(points);
  return thinPoints(safePoints, targetCount);
}

function thinPoints(points, targetCount) {
  if (points.length <= targetCount) return points;
  if (targetCount <= 1) return [points[points.length - 1]];

  const bucketSize = Math.ceil(points.length / targetCount);
  const result = [];
  for (let start = 0; start < points.length; start += bucketSize) {
    const bucket = points.slice(start, start + bucketSize);
    const first = bucket[0];
    const last = bucket[bucket.length - 1];
    const min = bucket.reduce((winner, point) => point.difference < winner.difference ? point : winner, first);
    const max = bucket.reduce((winner, point) => point.difference > winner.difference ? point : winner, first);
    const ordered = [first, min, max, last].sort((a, b) => a.game - b.game);
    for (const point of ordered) {
      if (!result.length || result[result.length - 1].game !== point.game) {
        result.push(point);
      }
    }
  }
  const finalPoint = points[points.length - 1];
  if (result[result.length - 1].game !== finalPoint.game) {
    result.push(finalPoint);
  }
  return result;
}
