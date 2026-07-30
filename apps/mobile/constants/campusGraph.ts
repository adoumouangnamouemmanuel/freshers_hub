// Campus Graph for Custom Routing
// This graph represents the major footpaths on campus.
// A node is an intersection or a building entrance.
// Edges represent walking paths between nodes.

export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type GraphNode = {
  id: string;
  coordinate: Coordinate;
};

export type GraphEdge = {
  from: string;
  to: string;
  distance: number; // approximate distance or weight
};

// Foundational Graph nodes connecting main hostels to academic halls
export const campusNodes: Record<string, GraphNode> = {
  'h1': { id: 'h1', coordinate: { latitude: 5.7620, longitude: -0.2190 } }, // Dufie Hostel
  'n1': { id: 'n1', coordinate: { latitude: 5.7615, longitude: -0.2190 } }, // Path intermediate
  'c1': { id: 'c1', coordinate: { latitude: 5.7605, longitude: -0.2190 } }, // Cafeteria
  'n2': { id: 'n2', coordinate: { latitude: 5.7600, longitude: -0.2190 } }, // Courtyard edge
  'b1': { id: 'b1', coordinate: { latitude: 5.7600, longitude: -0.2195 } }, // Norton
  'b2': { id: 'b2', coordinate: { latitude: 5.7595, longitude: -0.2199 } }, // Radichel
  'b3': { id: 'b3', coordinate: { latitude: 5.7590, longitude: -0.2205 } }, // King
};

// Edges defining the valid walking paths between nodes
export const campusEdges: GraphEdge[] = [
  { from: 'h1', to: 'n1', distance: 10 },
  { from: 'n1', to: 'h1', distance: 10 },
  
  { from: 'n1', to: 'c1', distance: 15 },
  { from: 'c1', to: 'n1', distance: 15 },
  
  { from: 'c1', to: 'n2', distance: 5 },
  { from: 'n2', to: 'c1', distance: 5 },
  
  { from: 'n2', to: 'b1', distance: 8 },
  { from: 'b1', to: 'n2', distance: 8 },
  
  { from: 'b1', to: 'b2', distance: 12 },
  { from: 'b2', to: 'b1', distance: 12 },
  
  { from: 'b2', to: 'b3', distance: 14 },
  { from: 'b3', to: 'b2', distance: 14 },
];

export function findNearestNodeId(coord: Coordinate): string {
  let nearest = Object.keys(campusNodes)[0];
  let minDistance = Infinity;

  // Simple euclidian distance for finding nearest node (since scale is so small)
  for (const nodeId in campusNodes) {
    const node = campusNodes[nodeId];
    const dist = Math.pow(node.coordinate.latitude - coord.latitude, 2) + 
                 Math.pow(node.coordinate.longitude - coord.longitude, 2);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = nodeId;
    }
  }
  return nearest;
}
