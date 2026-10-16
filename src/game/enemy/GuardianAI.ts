import * as THREE from 'three';
import { GuardianNavigation } from './GuardianNavigation';
import { GuardianPerception, PerceptionResult } from './GuardianPerception';
import { GuardianAnimator } from './GuardianAnimator';
import { CollisionSystem } from '../player/CollisionSystem';
import { HealthSystem } from '../systems/HealthSystem';
import { soundManager } from '../audio/SoundEffects';

export type AIState = 'DORMANT' | 'PATROL' | 'INVESTIGATE' | 'CHASE' | 'SEARCH' | 'ATTACK' | 'RECOVER';

export class GuardianAI {
  public state: AIState = 'DORMANT';
  public position: THREE.Vector3;
  public yaw: number = 0;

  // Components
  public navigation: GuardianNavigation;
  public perception: GuardianPerception;
  public animator: GuardianAnimator;
  private collisionSystem: CollisionSystem;
  private healthSystem: HealthSystem;

  // Movement & path
  public currentPath: THREE.Vector3[] = [];
  public currentTargetPos: THREE.Vector3 | null = null;
  public patrolWaypoints: number[] = [2, 3, 6, 7, 6, 3, 2, 4, 9, 10, 9, 4, 2, 11, 12, 13, 15, 14, 12, 11];
  private patrolIndex: number = 0;

  // Speeds
  private patrolSpeed: number = 2.4;
  private chaseSpeed: number = 4.8;
  private currentSpeed: number = 0;

  // Timers & cooldowns
  private stateTimer: number = 0;
  private attackCooldown: number = 1.8;
  private attackTimer: number = 0;
  private footstepTimer: number = 0;
  private loseSightTimer: number = 0;
  private roarCooldown: number = 0;
  private chaseRepathTimer: number = 0;

  // Callbacks
  public onStateChanged?: (newState: AIState) => void;
  public onAttack?: (damage: number) => void;

  constructor(
    initialPos: THREE.Vector3,
    navigation: GuardianNavigation,
    perception: GuardianPerception,
    animator: GuardianAnimator,
    collisionSystem: CollisionSystem,
    healthSystem: HealthSystem
  ) {
    this.position = initialPos.clone();
    this.navigation = navigation;
    this.perception = perception;
    this.animator = animator;
    this.collisionSystem = collisionSystem;
    this.healthSystem = healthSystem;

    this.animator.group.position.copy(this.position);
  }

  public awaken(startPatrolAtNode: number = 15) {
    if (this.state === 'DORMANT') {
      this.transitionTo('PATROL');
      this.patrolIndex = this.patrolWaypoints.indexOf(startPatrolAtNode);
      if (this.patrolIndex === -1) this.patrolIndex = 0;
      soundManager.playGuardianRoar(15);
      soundManager.playJumpscareSting();
    }
  }

  public sleep() {
    this.transitionTo('DORMANT');
  }

  public reset(spawnPos: THREE.Vector3) {
    this.position.copy(spawnPos);
    this.animator.group.position.copy(this.position);
    this.state = 'DORMANT';
    this.currentPath = [];
    this.currentTargetPos = null;
    this.attackTimer = 0;
    this.stateTimer = 0;
    this.chaseRepathTimer = 0;
    soundManager.setChaseTension(false);
  }

  private transitionTo(newState: AIState) {
    if (this.state === newState) return;
    const oldState = this.state;
    this.state = newState;
    this.stateTimer = 0;

    // State entry actions
    if (newState === 'CHASE') {
      soundManager.setChaseTension(true);
      if (this.roarCooldown <= 0) {
        soundManager.playGuardianRoar(this.position.distanceTo(this.animator.group.position));
        this.roarCooldown = 6.0;
      }
    } else if (oldState === 'CHASE' && newState !== 'ATTACK') {
      soundManager.setChaseTension(false);
    }

    if (newState === 'PATROL') {
      this.setNextPatrolDestination();
    } else if (newState === 'INVESTIGATE' || newState === 'SEARCH') {
      soundManager.playWhisperEcho();
    }

    this.onStateChanged?.(newState);
  }

  private setNextPatrolDestination() {
    const nodeId = this.patrolWaypoints[this.patrolIndex % this.patrolWaypoints.length];
    const node = this.navigation.nodes[nodeId];
    if (node) {
      this.currentPath = this.navigation.findPath(this.position, node.pos);
    }
    this.patrolIndex++;
  }

  public update(
    dt: number,
    playerPos: THREE.Vector3,
    isSprinting: boolean,
    isMoving: boolean,
    flashlightOn: boolean
  ) {
    if (this.state === 'DORMANT') {
      this.animator.update(dt, 0);
      return;
    }

    // If player is already dead, stop aggressive chase and idle
    if (this.healthSystem.isDead) {
      this.currentSpeed = 0;
      this.animator.update(dt, 0);
      return;
    }

    this.stateTimer += dt;
    this.attackTimer -= dt;
    this.roarCooldown -= dt;
    this.chaseRepathTimer -= dt;

    // Run perception sensor
    const perc: PerceptionResult = this.perception.evaluate(
      this.position,
      this.yaw,
      playerPos,
      isSprinting,
      isMoving,
      flashlightOn
    );

    // AI State Machine Dispatcher
    switch (this.state) {
      case 'PATROL':
        this.handlePatrol(dt, perc, playerPos);
        break;
      case 'INVESTIGATE':
        this.handleInvestigate(dt, perc, playerPos);
        break;
      case 'CHASE':
        this.handleChase(dt, perc, playerPos);
        break;
      case 'SEARCH':
        this.handleSearch(dt, perc, playerPos);
        break;
      case 'ATTACK':
        this.handleAttack(dt, perc, playerPos);
        break;
      case 'RECOVER':
        this.handleRecover(dt);
        break;
    }

    // Play proximity-attenuated heavy footsteps
    if (this.currentSpeed > 0.5) {
      const stepInterval = this.state === 'CHASE' ? 0.38 : 0.65;
      this.footstepTimer += dt;
      if (this.footstepTimer >= stepInterval) {
        this.footstepTimer = 0;
        soundManager.playGuardianStep(perc.distance);
      }
    }

    // Update 3D mesh transform and animations
    this.animator.group.position.x = this.position.x;
    this.animator.group.position.z = this.position.z;
    this.animator.group.rotation.y = this.yaw;
    this.animator.update(dt, this.currentSpeed);
  }

  private handlePatrol(dt: number, perc: PerceptionResult, playerPos: THREE.Vector3) {
    if (perc.canSeePlayer) {
      this.transitionTo('CHASE');
      return;
    }

    if (perc.canHearPlayer && perc.lastKnownPosition) {
      this.currentPath = this.navigation.findPath(this.position, perc.lastKnownPosition);
      this.transitionTo('INVESTIGATE');
      return;
    }

    // Follow patrol waypoints
    this.currentSpeed = this.patrolSpeed;
    this.navigateAlongPath(dt, this.patrolSpeed, () => {
      // Reached patrol waypoint, pick next after short pause
      if (this.stateTimer > 2.0) {
        this.setNextPatrolDestination();
        this.stateTimer = 0;
      }
    });
  }

  private handleInvestigate(dt: number, perc: PerceptionResult, playerPos: THREE.Vector3) {
    if (perc.canSeePlayer) {
      this.transitionTo('CHASE');
      return;
    }

    // If hearing updated position while investigating
    if (perc.canHearPlayer && perc.lastKnownPosition) {
      if (this.currentPath.length === 0 || this.currentPath[this.currentPath.length - 1].distanceTo(perc.lastKnownPosition) > 3.0) {
        this.currentPath = this.navigation.findPath(this.position, perc.lastKnownPosition);
      }
    }

    this.currentSpeed = this.patrolSpeed * 1.2;
    this.navigateAlongPath(dt, this.currentSpeed, () => {
      this.transitionTo('SEARCH');
    });

    if (this.stateTimer > 10.0) {
      this.transitionTo('SEARCH');
    }
  }

  private handleChase(dt: number, perc: PerceptionResult, playerPos: THREE.Vector3) {
    // Attack range check
    if (perc.distance <= 2.2) {
      this.transitionTo('ATTACK');
      return;
    }

    if (perc.canSeePlayer) {
      this.loseSightTimer = 0;
      // Throttled Dijkstra path recalculation
      if (this.chaseRepathTimer <= 0) {
        this.currentPath = this.navigation.findPath(this.position, playerPos);
        this.chaseRepathTimer = 0.25;
      }
    } else {
      this.loseSightTimer += dt;
      if (this.loseSightTimer > 3.0) {
        // Lost player sight for 3 seconds -> go to SEARCH at last known position
        this.transitionTo('SEARCH');
        return;
      }
    }

    this.currentSpeed = this.chaseSpeed;
    this.navigateAlongPath(dt, this.chaseSpeed);
  }

  private handleSearch(dt: number, perc: PerceptionResult, playerPos: THREE.Vector3) {
    if (perc.canSeePlayer) {
      this.transitionTo('CHASE');
      return;
    }

    // Slowly turn around to scan room
    this.yaw += dt * 0.9;
    this.currentSpeed = 0;

    if (this.stateTimer > 5.5) {
      // Finished searching, return to patrol
      this.transitionTo('PATROL');
    }
  }

  private handleAttack(dt: number, perc: PerceptionResult, playerPos: THREE.Vector3) {
    this.currentSpeed = 0;

    // Face player
    const toPlayer = new THREE.Vector3().subVectors(playerPos, this.position).normalize();
    this.yaw = Math.atan2(toPlayer.x, toPlayer.z);

    if (this.attackTimer <= 0) {
      // Execute slash
      this.animator.triggerAttack();
      this.attackTimer = this.attackCooldown;

      // Deal damage if player is still in range
      if (perc.distance <= 2.5) {
        this.healthSystem.damage(35);
        soundManager.playPlayerHurt();
        this.onAttack?.(35);
      }
    }

    if (this.stateTimer > 0.8) {
      // Return to chase or recover
      this.transitionTo(perc.distance > 2.5 ? 'CHASE' : 'RECOVER');
    }
  }

  private handleRecover(dt: number) {
    this.currentSpeed = 0;
    if (this.stateTimer > 0.6) {
      this.transitionTo('CHASE');
    }
  }

  /**
   * Steers the guardian smoothly towards path waypoints with obstacle collision resolution
   */
  private navigateAlongPath(dt: number, speed: number, onArrival?: () => void) {
    if (this.currentPath.length === 0) {
      onArrival?.();
      return;
    }

    const nextTarget = this.currentPath[0];
    const dx = nextTarget.x - this.position.x;
    const dz = nextTarget.z - this.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 0.6) {
      // Pop reached waypoint
      this.currentPath.shift();
      if (this.currentPath.length === 0) {
        onArrival?.();
        return;
      }
    }

    // Turn towards waypoint
    const targetYaw = Math.atan2(dx, dz);
    let angleDiff = targetYaw - this.yaw;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    this.yaw += angleDiff * Math.min(1.0, dt * 6.0);

    // Advance position with full wall & column collision resolution
    const moveDist = speed * dt;
    const targetX = this.position.x + Math.sin(this.yaw) * moveDist;
    const targetZ = this.position.z + Math.cos(this.yaw) * moveDist;
    const desired = new THREE.Vector3(targetX, this.position.y, targetZ);
    const resolved = this.collisionSystem.resolve(this.position, desired, 0.55);
    this.position.copy(resolved);
  }
}
