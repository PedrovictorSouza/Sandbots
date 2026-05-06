const DEFAULT_CELL_SIZE = 8;
const EMPTY_ITEMS = Object.freeze([]);

function getCellCoord(value, cellSize) {
  return Math.floor(value / cellSize);
}

function getKey(xCell, zCell) {
  return `${xCell}:${zCell}`;
}

function getDefaultPoint(item) {
  return item?.offset || item?.position || null;
}

function getPointBounds(point) {
  return {
    minX: point[0],
    maxX: point[0],
    minZ: point[2],
    maxZ: point[2]
  };
}

function addToBucket(buckets, key, item) {
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = [];
    buckets.set(key, bucket);
  }

  bucket.push(item);
}

function dedupeItems(items) {
  return [...new Set(items)];
}

export function createSpatialHashIndex(
  items = [],
  {
    cellSize = DEFAULT_CELL_SIZE,
    getPoint = getDefaultPoint,
    getBounds = null
  } = {}
) {
  const resolvedCellSize = Math.max(0.001, Number(cellSize) || DEFAULT_CELL_SIZE);
  const buckets = new Map();

  for (const item of items) {
    const point = getPoint(item);
    const bounds = getBounds?.(item) || (point ? getPointBounds(point) : null);

    if (!bounds) {
      continue;
    }

    const minXCell = getCellCoord(bounds.minX, resolvedCellSize);
    const maxXCell = getCellCoord(bounds.maxX, resolvedCellSize);
    const minZCell = getCellCoord(bounds.minZ, resolvedCellSize);
    const maxZCell = getCellCoord(bounds.maxZ, resolvedCellSize);

    for (let xCell = minXCell; xCell <= maxXCell; xCell += 1) {
      for (let zCell = minZCell; zCell <= maxZCell; zCell += 1) {
        addToBucket(buckets, getKey(xCell, zCell), item);
      }
    }
  }

  function queryPoint(position) {
    if (!Array.isArray(position)) {
      return EMPTY_ITEMS;
    }

    return buckets.get(getKey(
      getCellCoord(position[0], resolvedCellSize),
      getCellCoord(position[2], resolvedCellSize)
    )) || EMPTY_ITEMS;
  }

  function queryRadius(position, radius = resolvedCellSize) {
    if (!Array.isArray(position)) {
      return EMPTY_ITEMS;
    }

    const resolvedRadius = Math.max(0, Number(radius) || 0);
    const minXCell = getCellCoord(position[0] - resolvedRadius, resolvedCellSize);
    const maxXCell = getCellCoord(position[0] + resolvedRadius, resolvedCellSize);
    const minZCell = getCellCoord(position[2] - resolvedRadius, resolvedCellSize);
    const maxZCell = getCellCoord(position[2] + resolvedRadius, resolvedCellSize);
    const itemsInRange = [];

    for (let xCell = minXCell; xCell <= maxXCell; xCell += 1) {
      for (let zCell = minZCell; zCell <= maxZCell; zCell += 1) {
        itemsInRange.push(...(buckets.get(getKey(xCell, zCell)) || EMPTY_ITEMS));
      }
    }

    return dedupeItems(itemsInRange);
  }

  return {
    buckets,
    cellSize: resolvedCellSize,
    itemCount: items.length,
    queryPoint,
    queryRadius
  };
}
