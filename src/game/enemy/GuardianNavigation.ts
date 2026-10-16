import * as THREE from 'three';

export interface NavNode {
  id: number;
  name: string;
  pos: THREE.Vector3;
  neighbors: number[];
}

export class GuardianNavigation {
  public nodes: NavNode[] = [];

  constructor() {
    this.buildWaypointGraph();
  }

  private buildWaypointGraph() {
    // 18 Waypoints covering all explorable corridors, wings, and chambers
    this.nodes = [
      { id: 0, name: 'corridor_south', pos: new THREE.Vector3(0, 0, 16), neighbors: [1] },
      { id: 1, name: 'corridor_north', pos: new THREE.Vector3(0, 0, 10), neighbors: [0, 2] },
      { id: 2, name: 'antechamber_center', pos: new THREE.Vector3(0, 0, 2), neighbors: [1, 3, 4, 11] },
      { id: 3, name: 'antechamber_west', pos: new THREE.Vector3(-3.5, 0, 2), neighbors: [2, 5] },
      { id: 4, name: 'antechamber_east', pos: new THREE.Vector3(3.5, 0, 2), neighbors: [2, 8] },
      { id: 5, name: 'scribe_portal', pos: new THREE.Vector3(-6.2, 0, 2), neighbors: [3, 6] },
      { id: 6, name: 'scribe_center', pos: new THREE.Vector3(-10.5, 0, 2), neighbors: [5, 7] },
      { id: 7, name: 'scribe_north', pos: new THREE.Vector3(-10.5, 0, 4.5), neighbors: [6] },
      { id: 8, name: 'vault_portal', pos: new THREE.Vector3(6.2, 0, 2), neighbors: [4, 9] },
      { id: 9, name: 'vault_center', pos: new THREE.Vector3(10.5, 0, 2), neighbors: [8, 10] },
      { id: 10, name: 'vault_north', pos: new THREE.Vector3(10.5, 0, 4.5), neighbors: [9] },
      { id: 11, name: 'portal_burial', pos: new THREE.Vector3(0, 0, -5), neighbors: [2, 12] },
      { id: 12, name: 'burial_south', pos: new THREE.Vector3(0, 0, -9), neighbors: [11, 13, 14] },
      { id: 13, name: 'burial_west_col', pos: new THREE.Vector3(-4.0, 0, -13.5), neighbors: [12, 15] },
      { id: 14, name: 'burial_east_col', pos: new THREE.Vector3(4.0, 0, -13.5), neighbors: [12, 15] },
      { id: 15, name: 'burial_center_sarc', pos: new THREE.Vector3(0, 0, -16), neighbors: [13, 14, 16] },
      { id: 16, name: 'burial_pedestal', pos: new THREE.Vector3(0, 0, -18.5), neighbors: [15, 17] },
      { id: 17, name: 'northern_gate_front', pos: new THREE.Vector3(0, 0, -21.5), neighbors: [16] },
    ];
  }

  public getNearestNode(pos: THREE.Vector3): NavNode {
    let best = this.nodes[0];
    let bestDistSq = Infinity;

    for (const node of this.nodes) {
      const dx = pos.x - node.pos.x;
      const dz = pos.z - node.pos.z;
      const distSq = dx * dx + dz * dz;
      if (distSq < bestDistSq) {
        bestDistSq = distSq;
        best = node;
      }
    }
    return best;
  }

  /**
   * Finds shortest path of waypoints between start and destination using A*
   */
  public findPath(fromPos: THREE.Vector3, toPos: THREE.Vector3): THREE.Vector3[] {
    const startNode = this.getNearestNode(fromPos);
    const endNode = this.getNearestNode(toPos);

    if (startNode.id === endNode.id) {
      return [toPos.clone()];
    }

    // Dijkstra / A* search
    const distances = new Map<number, number>();
    const previous = new Map<number, number | null>();
    const unvisited = new Set<number>();

    for (const node of this.nodes) {
      distances.set(node.id, Infinity);
      previous.set(node.id, null);
      unvisited.add(node.id);
    }

    distances.set(startNode.id, 0);

    while (unvisited.size > 0) {
      // Find smallest distance node
      let currentId: number | null = null;
      let smallestDist = Infinity;

      for (const id of unvisited) {
        const d = distances.get(id)!;
        if (d < smallestDist) {
          smallestDist = d;
          currentId = id;
        }
      }

      if (currentId === null || smallestDist === Infinity) break;
      if (currentId === endNode.id) break;

      unvisited.delete(currentId);
      const currNode = this.nodes[currentId];

      for (const neighborId of currNode.neighbors) {
        if (!unvisited.has(neighborId)) continue;
        const neighborNode = this.nodes[neighborId];
        const edgeWeight = currNode.pos.distanceTo(neighborNode.pos);
        const alt = smallestDist + edgeWeight;

        if (alt < distances.get(neighborId)!) {
          distances.set(neighborId, alt);
          previous.set(neighborId, currentId);
        }
      }
    }

    // Check if destination was unreachable
    if (distances.get(endNode.id) === Infinity) {
      return [toPos.clone()];
    }

    // Reconstruct path from endNode backwards to startNode
    const pathIds: number[] = [];
    let curr: number | null = endNode.id;
    while (curr !== null) {
      pathIds.unshift(curr);
      if (curr === startNode.id) break;
      curr = previous.get(curr) ?? null;
    }

    // Verify start node reached
    if (pathIds[0] !== startNode.id) {
      return [toPos.clone()];
    }

    const waypoints: THREE.Vector3[] = [];
    for (const id of pathIds) {
      waypoints.push(this.nodes[id].pos.clone());
    }

    // If starting point is already right on top of first waypoint, pop it
    if (waypoints.length > 1 && fromPos.distanceTo(waypoints[0]) < 0.8) {
      waypoints.shift();
    }

    // Add final destination
    waypoints.push(toPos.clone());

    return waypoints;
  }
}
