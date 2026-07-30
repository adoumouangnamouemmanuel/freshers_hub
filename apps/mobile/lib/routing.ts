import { campusNodes, campusEdges, findNearestNodeId, Coordinate } from '../constants/campusGraph';

/**
 * Calculates the shortest path between two coordinates using Dijkstra's algorithm
 * over the custom campus graph.
 * 
 * TODO [GOOGLE MAPS SWITCH]:
 * To switch to Google Maps Directions API instead of this custom routing:
 * 1. Remove this Dijkstra implementation.
 * 2. Fetch to: `https://maps.googleapis.com/maps/api/directions/json?origin=${start.latitude},${start.longitude}&destination=${end.latitude},${end.longitude}&mode=walking&key=YOUR_API_KEY`
 * 3. Use an npm package like `@googlemaps/polyline-codec` to decode the `overview_polyline.points` string into an array of Coordinates.
 * 4. Return that array of Coordinates.
 */
export function calculateCampusRoute(start: Coordinate, end: Coordinate): Coordinate[] {
  // 1. Find nearest nodes to start and end
  const startNodeId = findNearestNodeId(start);
  const endNodeId = findNearestNodeId(end);
  
  // 2. Setup Dijkstra structures
  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const unvisited = new Set<string>();

  for (const nodeId in campusNodes) {
    distances[nodeId] = Infinity;
    previous[nodeId] = null;
    unvisited.add(nodeId);
  }
  
  distances[startNodeId] = 0;

  // 3. Run Dijkstra
  while (unvisited.size > 0) {
    // Find unvisited node with smallest distance
    let current: string | null = null;
    let minDistance = Infinity;
    
    for (const nodeId of unvisited) {
      if (distances[nodeId] < minDistance) {
        minDistance = distances[nodeId];
        current = nodeId;
      }
    }

    if (current === null || current === endNodeId) {
      break; // Reached target or unreachable
    }

    unvisited.delete(current);

    // Update neighbors
    const neighbors = campusEdges.filter(e => e.from === current);
    for (const edge of neighbors) {
      if (unvisited.has(edge.to)) {
        const alt = distances[current] + edge.distance;
        if (alt < distances[edge.to]) {
          distances[edge.to] = alt;
          previous[edge.to] = current;
        }
      }
    }
  }

  // 4. Reconstruct path
  const path: Coordinate[] = [];
  let curr: string | null = endNodeId;
  
  if (previous[curr] !== null || curr === startNodeId) {
    while (curr !== null) {
      path.unshift(campusNodes[curr].coordinate);
      curr = previous[curr];
    }
  }

  // To make the polyline connect perfectly to the exact start and end marker,
  // we add the exact coordinates to the ends of the path.
  return [start, ...path, end];
}
