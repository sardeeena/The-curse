import * as THREE from 'three';
import { CollisionSystem } from '../player/CollisionSystem';

export interface PerceptionResult {
  canSeePlayer: boolean;
  canHearPlayer: boolean;
  distance: number;
  lastKnownPosition: THREE.Vector3 | null;
}

export class GuardianPerception {
  public sightRange: number = 18;
  public sightFovAngle: number = (Math.PI / 180) * 120; // 120 degrees FOV
  public hearingRangeWalk: number = 7.5;
  public hearingRangeSprint: number = 15;
  private collisionSystem: CollisionSystem;

  public lastKnownPlayerPos: THREE.Vector3 | null = null;
  private tempForward = new THREE.Vector3();
  private tempToPlayer = new THREE.Vector3();

  constructor(collisionSystem: CollisionSystem) {
    this.collisionSystem = collisionSystem;
  }

  public evaluate(
    guardianPos: THREE.Vector3,
    guardianYaw: number,
    playerPos: THREE.Vector3,
    isSprinting: boolean,
    isMoving: boolean,
    flashlightOn: boolean
  ): PerceptionResult {
    const dist = guardianPos.distanceTo(playerPos);
    let canSee = false;
    let canHear = false;

    // 1. Sight Check
    // Flashlight makes player significantly easier to spot
    const effectiveSightRange = flashlightOn ? this.sightRange * 1.35 : this.sightRange;

    if (dist <= effectiveSightRange) {
      // Forward direction of guardian
      this.tempForward.set(Math.sin(guardianYaw), 0, Math.cos(guardianYaw)).normalize();
      this.tempToPlayer.subVectors(playerPos, guardianPos).normalize();

      const dot = this.tempForward.dot(this.tempToPlayer);
      const angle = Math.acos(Math.max(-1, Math.min(1, dot)));

      // If within FOV or very close proximity (< 3.0m in any direction)
      if (angle <= this.sightFovAngle / 2 || dist < 3.0) {
        // Line-of-sight raycast check against walls
        if (!this.isLineOfSightBlocked(guardianPos, playerPos)) {
          canSee = true;
          this.lastKnownPlayerPos = playerPos.clone();
        }
      }
    }

    // 2. Hearing Check (works through walls and in complete darkness)
    if (isMoving) {
      const maxHearing = isSprinting ? this.hearingRangeSprint : this.hearingRangeWalk;
      if (dist <= maxHearing) {
        canHear = true;
        this.lastKnownPlayerPos = playerPos.clone();
      }
    }

    return {
      canSeePlayer: canSee,
      canHearPlayer: canHear,
      distance: dist,
      lastKnownPosition: this.lastKnownPlayerPos,
    };
  }

  /**
   * Raycast through collision geometry from eye to eye.
   * If any wall intersects the segment, line of sight is blocked.
   */
  private isLineOfSightBlocked(from: THREE.Vector3, to: THREE.Vector3): boolean {
    const p1 = new THREE.Vector3(from.x, 2.0, from.z);
    const p2 = new THREE.Vector3(to.x, 1.7, to.z);

    const dir = new THREE.Vector3().subVectors(p2, p1);
    const distance = dir.length();
    dir.normalize();

    // Sample along the ray at 0.5m intervals
    const steps = Math.floor(distance / 0.5);
    const sample = new THREE.Vector3();

    for (let i = 1; i < steps; i++) {
      sample.copy(p1).addScaledVector(dir, i * 0.5);
      if (this.collisionSystem.checkCollision(sample, 0.2)) {
        return true; // Wall hit
      }
    }

    return false;
  }
}
