import * as THREE from 'three';
import { GuardianAnimator } from './GuardianAnimator';
import { GuardianNavigation } from './GuardianNavigation';
import { GuardianPerception } from './GuardianPerception';
import { GuardianAI, AIState } from './GuardianAI';
import { CollisionSystem } from '../player/CollisionSystem';
import { HealthSystem } from '../systems/HealthSystem';

export class Guardian {
  public group: THREE.Group;
  public animator: GuardianAnimator;
  public navigation: GuardianNavigation;
  public perception: GuardianPerception;
  public ai: GuardianAI;

  constructor(
    initialPos: THREE.Vector3,
    collisionSystem: CollisionSystem,
    healthSystem: HealthSystem
  ) {
    this.animator = new GuardianAnimator();
    this.group = this.animator.group;

    this.navigation = new GuardianNavigation();
    this.perception = new GuardianPerception(collisionSystem);
    this.ai = new GuardianAI(
      initialPos,
      this.navigation,
      this.perception,
      this.animator,
      collisionSystem,
      healthSystem
    );
  }

  public awaken(startPatrolAtNode: number = 15) {
    this.ai.awaken(startPatrolAtNode);
  }

  public sleep() {
    this.ai.sleep();
  }

  public reset(spawnPos: THREE.Vector3) {
    this.ai.reset(spawnPos);
  }

  public getState(): AIState {
    return this.ai.state;
  }

  public update(
    dt: number,
    playerPos: THREE.Vector3,
    isSprinting: boolean,
    isMoving: boolean,
    flashlightOn: boolean
  ) {
    this.ai.update(dt, playerPos, isSprinting, isMoving, flashlightOn);
  }

  public dispose() {
    this.animator.dispose();
  }
}
