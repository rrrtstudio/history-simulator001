import { calculateYAxisScale, thinGraphPointsForRender } from "../core/graph-data.js";
import { formatNumber } from "./formatters.js";

export function renderGraph(canvas, points, options = {}) {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(300, Math.floor(rect.width * dpr));
  const height = Math.max(170, Math.floor(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const ctx = canvas.getContext("2d");
  const styles = getComputedStyle(document.documentElement);
  const panel = styles.getPropertyValue("--color-graph-background").trim() || "#101414";
  const grid = styles.getPropertyValue("--color-graph-grid").trim() || "#2d3632";
  const plus = styles.getPropertyValue("--color-positive").trim() || "#36c56f";
  const minus = styles.getPropertyValue("--color-negative").trim() || "#ff6b5f";
  const axis = styles.getPropertyValue("--color-muted").trim() || "#a7aea6";

  const safePoints = points?.length ? points : [{ game: 0, difference: 0 }];
  const maxGame = Math.max(1, ...safePoints.map((point) => point.game));
  const yScale = calculateYAxisScale(safePoints);
  const padTop = 18 * dpr;
  const padRight = 14 * dpr;
  const padBottom = 30 * dpr;
  const labelPad = 54 * dpr;
  const graphLeft = labelPad;
  const graphRight = width - padRight;
  const graphTop = padTop;
  const graphBottom = height - padBottom;
  const graphWidth = graphRight - graphLeft;
  const graphHeight = graphBottom - graphTop;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = panel;
  ctx.fillRect(0, 0, width, height);

  ctx.font = `${11 * dpr}px system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "right";
  const tickStep = Math.max(1000, Math.ceil(yScale / 4000) * 1000);
  ctx.strokeStyle = grid;
  ctx.lineWidth = 1 * dpr;
  for (let value = -yScale; value <= yScale; value += tickStep) {
    const y = valueToY(value, yScale, graphTop, graphHeight);
    ctx.beginPath();
    ctx.moveTo(graphLeft, y);
    ctx.lineTo(graphRight, y);
    ctx.strokeStyle = value === 0 ? axis : grid;
    ctx.lineWidth = value === 0 ? 2 * dpr : 1 * dpr;
    ctx.stroke();
    ctx.fillStyle = value === 0 ? axis : "rgba(245, 242, 232, 0.72)";
    ctx.fillText(formatAxisCoins(value), graphLeft - 8 * dpr, y);
  }

  ctx.strokeStyle = axis;
  ctx.lineWidth = 1 * dpr;
  ctx.beginPath();
  ctx.moveTo(graphLeft, graphTop);
  ctx.lineTo(graphLeft, graphBottom);
  ctx.stroke();

  drawMarkers(ctx, {
    markers: options.markers || [],
    dpr,
    graphLeft,
    graphRight,
    graphTop,
    graphBottom,
    graphWidth,
    maxGame,
    axis
  });

  const renderPointLimit = Math.max(120, Math.floor(graphWidth / Math.max(1, dpr * 1.4)));
  const displayPoints = thinGraphPointsForRender(safePoints, renderPointLimit);

  ctx.lineWidth = 3 * dpr;
  ctx.beginPath();
  displayPoints.forEach((point, index) => {
    const x = graphLeft + graphWidth * (point.game / maxGame);
    const y = valueToY(point.difference, yScale, graphTop, graphHeight);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = safePoints[safePoints.length - 1].difference >= 0 ? plus : minus;
  ctx.stroke();

  drawFinalPoint(ctx, {
    point: safePoints[safePoints.length - 1],
    dpr,
    graphLeft,
    graphWidth,
    graphTop,
    graphHeight,
    maxGame,
    yScale,
    color: safePoints[safePoints.length - 1].difference >= 0 ? plus : minus
  });

  drawXAxisLabels(ctx, { dpr, graphLeft, graphRight, graphBottom, maxGame });
}

function valueToY(value, yScale, graphTop, graphHeight) {
  return graphTop + ((yScale - value) / (yScale * 2)) * graphHeight;
}

function formatAxisCoins(value) {
  if (value === 0) return "±0";
  return value > 0 ? `+${formatNumber(value)}` : `-${formatNumber(Math.abs(value))}`;
}

function drawXAxisLabels(ctx, { dpr, graphLeft, graphRight, graphBottom, maxGame }) {
  const midGame = Math.round(maxGame / 2);
  const labels = [
    { x: graphLeft, text: "0G", align: "left" },
    { x: graphLeft + (graphRight - graphLeft) / 2, text: `${formatNumber(midGame)}G`, align: "center" },
    { x: graphRight, text: `${formatNumber(maxGame)}G`, align: "right" }
  ];

  ctx.textBaseline = "top";
  ctx.fillStyle = "rgba(245, 242, 232, 0.72)";
  labels.forEach((label) => {
    ctx.textAlign = label.align;
    ctx.fillText(label.text, label.x, graphBottom + 9 * dpr);
  });
}

function drawMarkers(ctx, { markers, dpr, graphLeft, graphTop, graphBottom, graphWidth, maxGame, axis }) {
  if (!markers.length) return;
  ctx.save();
  ctx.setLineDash([4 * dpr, 5 * dpr]);
  ctx.lineWidth = 1 * dpr;
  ctx.strokeStyle = "rgba(225, 184, 69, 0.45)";
  ctx.fillStyle = "rgba(245, 242, 232, 0.72)";
  ctx.font = `${10 * dpr}px system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  markers.forEach((marker) => {
    const x = graphLeft + graphWidth * (Math.max(0, marker.game) / maxGame);
    ctx.beginPath();
    ctx.moveTo(x, graphTop);
    ctx.lineTo(x, graphBottom);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillText(String(marker.label || ""), Math.min(x + 4 * dpr, graphLeft + graphWidth - 34 * dpr), graphTop + 4 * dpr);
    ctx.setLineDash([4 * dpr, 5 * dpr]);
  });
  ctx.setLineDash([]);
  ctx.strokeStyle = axis;
  ctx.restore();
}

function drawFinalPoint(ctx, { point, dpr, graphLeft, graphWidth, graphTop, graphHeight, maxGame, yScale, color }) {
  const x = graphLeft + graphWidth * (point.game / maxGame);
  const y = valueToY(point.difference, yScale, graphTop, graphHeight);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 3.5 * dpr, 0, Math.PI * 2);
  ctx.fill();
}
