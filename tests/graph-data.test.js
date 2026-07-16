import assert from "node:assert/strict";
import { appendGraphPoint, calculateYAxisScale, thinGraphPointsForRender } from "../js/core/graph-data.js";

export default function graphDataTest() {
  assert.equal(calculateYAxisScale([
    { game: 0, difference: -400 },
    { game: 1000, difference: 800 }
  ]), 1000);
  assert.equal(calculateYAxisScale([
    { game: 0, difference: -1200 },
    { game: 1000, difference: 1800 }
  ]), 2000);
  assert.equal(calculateYAxisScale([
    { game: 0, difference: -4200 },
    { game: 1000, difference: 2500 }
  ]), 5000);
  assert.equal(calculateYAxisScale([
    { game: 0, difference: -3100 },
    { game: 1000, difference: 7200 }
  ]), 8000);

  const machine = {
    entryGraphPointCount: 3,
    graphPoints: [
      { game: 0, difference: 0 },
      { game: 500, difference: 600 },
      { game: 1000, difference: 100 }
    ],
    currentTotalGames: 1000,
    currentDifference: 100
  };

  for (let i = 1; i <= 20; i += 1) {
    machine.currentTotalGames = 1000 + i;
    machine.currentDifference = 100 - i * 3;
    appendGraphPoint(machine, machine.currentTotalGames, machine.currentDifference);
  }

  assert.equal(machine.graphPoints.length, 23);
  assert.deepEqual(machine.graphPoints.slice(0, 3), [
    { game: 0, difference: 0 },
    { game: 500, difference: 600 },
    { game: 1000, difference: 100 }
  ]);
  assert.equal(machine.graphPoints.at(-1).game, machine.currentTotalGames);
  assert.equal(machine.graphPoints.at(-1).difference, machine.currentDifference);

  const detailedPoints = Array.from({ length: 101 }, (_, game) => ({
    game,
    difference: game - 50
  }));
  detailedPoints[30].difference = 2500;
  detailedPoints[70].difference = -1900;

  const thinned = thinGraphPointsForRender(detailedPoints, 10);
  assert.deepEqual(thinned[0], detailedPoints[0]);
  assert.deepEqual(thinned.at(-1), detailedPoints.at(-1));
  assert.ok(thinned.some((point) => point.game === 30 && point.difference === 2500));
  assert.ok(thinned.some((point) => point.game === 70 && point.difference === -1900));
}
