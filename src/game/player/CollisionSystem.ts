import * as THREE from 'three';

export interface BoxCollider {
  id?: string;
  min: THREE.Vector3;
  max: THREE.Vector3;
  active: boolean;
}

export interface CylinderCollider {
  id?: string;
  center: THREE.Vector2; // x, z
  radius: number;
  minY: number;
  maxY: number;
  active: boolean;
}

export class CollisionSystem {
  private boxes: BoxCollider[] = [];
  private cylinders: CylinderCollider[] = [];

  public addBox(min: THREE.Vector3, max: THREE.Vector3, id?: string): BoxCollider {
    const collider: BoxCollider = {
      id,
      min: min.clone(),
      max: max.clone(),
      active: true,
    };
    this.boxes.push(collider);
    return collider;
  }

  public addCylinder(x: number, z: number, radius: number, minY: number = 0, maxY: number = 5, id?: string): CylinderCollider {
    const collider: CylinderCollider = {
      id,
      center: new THREE.Vector2(x, z),
      radius,
      minY,
      maxY,
      active: true,
    };
    this.cylinders.push(collider);
    return collider;
  }

  public setColliderActive(id: string, active: boolean) {
    for (const b of this.boxes) {
      if (b.id === id) b.active = active;
    }
    for (const c of this.cylinders) {
      if (c.id === id) c.active = active;
    }
  }

  public clear() {
    this.boxes = [];
    this.cylinders = [];
  }

  /**
   * Resolves collision with wall sliding.
   * Tests X and Z separately so player glides smoothly along walls.
   */
  public resolve(
    currentPos: THREE.Vector3,
    desiredPos: THREE.Vector3,
    playerRadius: number = 0.4
  ): THREE.Vector3 {
    const finalPos = currentPos.clone();
    const playerY = desiredPos.y;

    // 1. Try moving along X
    const testX = new THREE.Vector3(desiredPos.x, playerY, finalPos.z);
    if (!this.checkCollision(testX, playerRadius)) {
      finalPos.x = desiredPos.x;
    }

    // 2. Try moving along Z
    const testZ = new THREE.Vector3(finalPos.x, playerY, desiredPos.z);
    if (!this.checkCollision(testZ, playerRadius)) {
      finalPos.z = desiredPos.z;
    }

    finalPos.y = desiredPos.y;
    return finalPos;
  }

  public checkCollision(pos: THREE.Vector3, radius: number = 0.4): boolean {
    const py = pos.y;

    // Check box colliders
    for (const box of this.boxes) {
      if (!box.active) continue;
      // Check Y overlap
      if (py + 0.2 < box.min.y || py - 0.2 > box.max.y) continue;

      // Expand box by player radius
      if (
        pos.x + radius >= box.min.x &&
        pos.x - radius <= box.max.x &&
        pos.z + radius >= box.min.z &&
        pos.z - radius <= box.max.z
      ) {
        return true;
      }
    }

    // Check cylinder colliders (pillars)
    for (const cyl of this.cylinders) {
      if (!cyl.active) continue;
      if (py < cyl.minY || py > cyl.maxY) continue;

      const dx = pos.x - cyl.center.x;
      const dz = pos.z - cyl.center.y;
      const minDist = radius + cyl.radius;
      if (dx * dx + dz * dz < minDist * minDist) {
        return true;
      }
    }

    return false;
  }
}
