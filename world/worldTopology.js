export const WORLD_WRAP_AXIS_X = "x";
export const WORLD_WRAP_AXIS_Z = "z";

export const FLAT_WORLD_TOPOLOGY = Object.freeze({
  id: "flat",
  wrapPosition(position) {
    return clonePosition(position);
  }
});

function clonePosition(position) {
  return [
    Number(position?.[0]) || 0,
    Number(position?.[1]) || 0,
    Number(position?.[2]) || 0
  ];
}

function wrapCoordinate(value, limit) {
  const numericValue = Number(value) || 0;
  const numericLimit = Number(limit) || 0;
  if (!(numericLimit > 0)) {
    return numericValue;
  }

  if (numericValue >= -numericLimit && numericValue <= numericLimit) {
    return numericValue;
  }

  const period = numericLimit * 2;
  const wrapped = ((((numericValue + numericLimit) % period) + period) % period) - numericLimit;
  return wrapped === -numericLimit && numericValue > numericLimit ? numericLimit : wrapped;
}

function wrapCoordinateNearReference(value, reference, limit) {
  const numericValue = Number(value) || 0;
  const numericReference = Number(reference) || 0;
  const numericLimit = Number(limit) || 0;
  if (!(numericLimit > 0)) {
    return numericValue;
  }

  const period = numericLimit * 2;
  const delta = numericValue - numericReference;
  if (delta > numericLimit) {
    return numericValue - period;
  }

  if (delta < -numericLimit) {
    return numericValue + period;
  }

  return numericValue;
}

function wrapDeltaNearReference(value, reference, limit) {
  const numericValue = Number(value) || 0;
  const numericReference = Number(reference) || 0;
  const numericLimit = Number(limit) || 0;
  let delta = numericValue - numericReference;

  if (!(numericLimit > 0)) {
    return delta;
  }

  const period = numericLimit * 2;
  if (delta > numericLimit) {
    delta -= period;
  } else if (delta < -numericLimit) {
    delta += period;
  }

  return delta;
}

function hasWrappedAxis(axes, axis) {
  if (axes?.has?.(axis)) {
    return true;
  }

  return Array.isArray(axes) && axes.includes(axis);
}

export function resolveWrappedRenderPosition(
  position,
  referencePosition,
  {
    limit,
    axes = [WORLD_WRAP_AXIS_X]
  } = {},
  out = [0, 0, 0]
) {
  out[0] = Number(position?.[0]) || 0;
  out[1] = Number(position?.[1]) || 0;
  out[2] = Number(position?.[2]) || 0;

  if (!Array.isArray(referencePosition)) {
    return out;
  }

  if (hasWrappedAxis(axes, WORLD_WRAP_AXIS_X)) {
    out[0] = wrapCoordinateNearReference(out[0], referencePosition[0], limit);
  }

  if (hasWrappedAxis(axes, WORLD_WRAP_AXIS_Z)) {
    out[2] = wrapCoordinateNearReference(out[2], referencePosition[2], limit);
  }

  return out;
}

export function createWrappedWorldTopology({
  id = "wrapped-world",
  limit,
  axes = [WORLD_WRAP_AXIS_X]
} = {}) {
  const wrapsX = hasWrappedAxis(axes, WORLD_WRAP_AXIS_X);
  const wrapsZ = hasWrappedAxis(axes, WORLD_WRAP_AXIS_Z);
  const wrappedAxes = [
    ...(wrapsX ? [WORLD_WRAP_AXIS_X] : []),
    ...(wrapsZ ? [WORLD_WRAP_AXIS_Z] : [])
  ];

  return Object.freeze({
    id,
    limit,
    axes: wrappedAxes,
    getPlanarDistanceSquared(position, referencePosition) {
      if (!Array.isArray(referencePosition)) {
        return Infinity;
      }

      const dx = wrapsX ?
        wrapDeltaNearReference(position?.[0], referencePosition[0], limit) :
        (Number(position?.[0]) || 0) - (Number(referencePosition[0]) || 0);
      const dz = wrapsZ ?
        wrapDeltaNearReference(position?.[2], referencePosition[2], limit) :
        (Number(position?.[2]) || 0) - (Number(referencePosition[2]) || 0);

      return dx * dx + dz * dz;
    },
    getRenderPosition(position, referencePosition, out) {
      const nextPosition = out || [0, 0, 0];
      nextPosition[0] = Number(position?.[0]) || 0;
      nextPosition[1] = Number(position?.[1]) || 0;
      nextPosition[2] = Number(position?.[2]) || 0;

      if (!Array.isArray(referencePosition)) {
        return nextPosition;
      }

      if (wrapsX) {
        nextPosition[0] = wrapCoordinateNearReference(nextPosition[0], referencePosition[0], limit);
      }

      if (wrapsZ) {
        nextPosition[2] = wrapCoordinateNearReference(nextPosition[2], referencePosition[2], limit);
      }

      return nextPosition;
    },
    wrapPosition(position) {
      const nextPosition = clonePosition(position);

      if (wrapsX) {
        nextPosition[0] = wrapCoordinate(nextPosition[0], limit);
      }

      if (wrapsZ) {
        nextPosition[2] = wrapCoordinate(nextPosition[2], limit);
      }

      return nextPosition;
    }
  });
}
