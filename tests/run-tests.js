import coinEngineTest from "./coin-engine.test.js";
import timeEngineTest from "./time-engine.test.js";
import machineStateTest from "./machine-state.test.js";
import resultCalculatorTest from "./result-calculator.test.js";
import historyGeneratorTest from "./history-generator.test.js";
import graphDataTest from "./graph-data.test.js";
import playEngineTest from "./play-engine.test.js";
import storageTest from "./storage.test.js";
import validationTest from "./validation.test.js";
import chainEngineTest from "./chain-engine.test.js";
import playerGraphTest from "./player-graph.test.js";
import machineScreenTest from "./machine-screen.test.js";
import lotteryEngineTest from "./lottery-engine.test.js";
import finalResultScreenTest from "./final-result-screen.test.js";
import documentationTest from "./documentation.test.js";
import endGameFlowTest from "./end-game-flow.test.js";

const tests = [
  ["coin-engine", coinEngineTest],
  ["time-engine", timeEngineTest],
  ["machine-state", machineStateTest],
  ["result-calculator", resultCalculatorTest],
  ["history-generator", historyGeneratorTest],
  ["lottery-engine", lotteryEngineTest],
  ["graph-data", graphDataTest],
  ["chain-engine", chainEngineTest],
  ["player-graph", playerGraphTest],
  ["play-engine", playEngineTest],
  ["storage", storageTest],
  ["machine-screen", machineScreenTest],
  ["final-result-screen", finalResultScreenTest],
  ["documentation", documentationTest],
  ["end-game-flow", endGameFlowTest],
  ["validation", validationTest]
];

for (const [name, run] of tests) {
  run();
  console.log(`ok ${name}`);
}
