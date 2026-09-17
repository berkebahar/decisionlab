/** Exact critically damped response: time-based, with no overshoot or frame-rate dependency. */
export function glide(position: number, velocity: number, target: number, seconds: number, response = 9) {
  const offset = position - target;
  const momentum = velocity + response * offset;
  const decay = Math.exp(-response * seconds);
  return {
    position: target + (offset + momentum * seconds) * decay,
    velocity: (velocity - response * momentum * seconds) * decay,
  };
}

export function nearestStop(position: number, stops: readonly number[]) {
  return stops.reduce((best, stop, index) => Math.abs(stop - position) < Math.abs(stops[best] - position) ? index : best, 0);
}

/** Keep a flick local; stale pointer velocity must not become release momentum. */
export function releaseTarget(position: number, velocity: number, age: number, stops: readonly number[]) {
  const spacing = Math.abs((stops[1] ?? 0) - stops[0]);
  const drift = age < 100 ? Math.max(-spacing * .35, Math.min(spacing * .35, velocity * .16)) : 0;
  return stops[nearestStop(position + drift, stops)] ?? 0;
}
