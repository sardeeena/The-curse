import * as THREE from 'three';
import { CollisionSystem } from './CollisionSystem';
import { soundManager } from '../audio/SoundEffects';

export interface PlayerInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
}

export class PlayerController {
  public camera: THREE.PerspectiveCamera;
  public position: THREE.Vector3;
  private collisionSystem: CollisionSystem;

  // View angles (pitch and yaw)
  public pitch: number = 0; // vertical angle in radians (-PI/2 to PI/2)
  public yaw: number = 0; // horizontal angle in radians
  public mouseSensitivity: number = 0.0022;

  // Movement physics
  private walkSpeed: number = 3.6;
  private sprintSpeed: number = 5.8;
  public stamina: number = 100;
  public maxStamina: number = 100;
  private isSprinting: boolean = false;

  // Head bobbing & footsteps
  private bobTimer: number = 0;
  private footstepTimer: number = 0;
  public baseEyeHeight: number = 1.7;

  // Key tracking
  public input: PlayerInput = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
  };

  // Virtual touch input (for mobile / on-screen joystick)
  public virtualMove = new THREE.Vector2(0, 0);

  // Pointer lock state
  public isLocked: boolean = false;
  private domElement: HTMLElement;

  // Callbacks
  public onInteractRequest: () => void = () => {};
  public onFlashlightToggle: () => void = () => {};
  public onPauseRequest: () => void = () => {};

  // Reusable vectors to avoid GC in game loop
  private moveDir = new THREE.Vector3();
  private desiredMove = new THREE.Vector3();
  private forwardVector = new THREE.Vector3();
  private rightVector = new THREE.Vector3();

  constructor(
    domElement: HTMLElement,
    collisionSystem: CollisionSystem,
    initialPos = new THREE.Vector3(0, 1.7, 18)
  ) {
    this.domElement = domElement;
    this.collisionSystem = collisionSystem;
    this.position = initialPos.clone();

    // First person perspective camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      80
    );
    this.camera.position.copy(this.position);
    this.camera.rotation.order = 'YXZ';

    this.bindEvents();
  }

  private onKeyDown = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.input.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.input.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.input.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.input.right = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.input.sprint = true;
        break;
      case 'KeyE':
        this.onInteractRequest();
        break;
      case 'KeyF':
        this.onFlashlightToggle();
        break;
      case 'Escape':
        this.onPauseRequest();
        break;
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.input.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.input.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.input.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.input.right = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.input.sprint = false;
        break;
    }
  };

  private onMouseMove = (e: MouseEvent) => {
    if (!this.isLocked && document.pointerLockElement !== this.domElement) return;

    const movementX = e.movementX || 0;
    const movementY = e.movementY || 0;

    this.rotate(movementX, movementY);
  };

  public rotate(deltaX: number, deltaY: number) {
    this.yaw -= deltaX * this.mouseSensitivity;
    this.pitch -= deltaY * this.mouseSensitivity;

    // Clamp pitch between -85 and +85 degrees
    const maxPitch = (Math.PI / 2) * 0.94;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));

    this.updateCameraRotation();
  }

  private updateCameraRotation() {
    this.camera.rotation.x = this.pitch;
    this.camera.rotation.y = this.yaw;
  }

  public lockPointer() {
    try {
      this.domElement.requestPointerLock?.();
    } catch {
      // Browser may reject if not user gesture
    }
  }

  public unlockPointer() {
    if (document.pointerLockElement === this.domElement) {
      document.exitPointerLock?.();
    }
  }

  private onPointerLockChange = () => {
    this.isLocked = document.pointerLockElement === this.domElement;
  };

  private onWindowBlur = () => {
    // Clear held keys on window blur to avoid sticky input
    this.input.forward = false;
    this.input.backward = false;
    this.input.left = false;
    this.input.right = false;
    this.input.sprint = false;
  };

  private bindEvents() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    window.addEventListener('blur', this.onWindowBlur);
  }

  public unbindEvents() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    window.removeEventListener('blur', this.onWindowBlur);
  }

  public reset(spawnPos = new THREE.Vector3(0, 1.7, 18), yaw: number = 0) {
    this.position.copy(spawnPos);
    this.camera.position.copy(spawnPos);
    this.yaw = yaw;
    this.pitch = 0;
    this.updateCameraRotation();
    this.stamina = 100;
    this.bobTimer = 0;
    this.footstepTimer = 0;
    this.virtualMove.set(0, 0);
    this.input.forward = false;
    this.input.backward = false;
    this.input.left = false;
    this.input.right = false;
    this.input.sprint = false;
  }

  public update(dt: number) {
    // Calculate movement direction relative to camera yaw
    let moveZ = 0;
    let moveX = 0;

    if (this.input.forward) moveZ -= 1;
    if (this.input.backward) moveZ += 1;
    if (this.input.left) moveX -= 1;
    if (this.input.right) moveX += 1;

    // Apply virtual joystick if present
    if (this.virtualMove.lengthSq() > 0.01) {
      moveX = this.virtualMove.x;
      moveZ = -this.virtualMove.y;
    }

    const isMoving = Math.abs(moveX) > 0.05 || Math.abs(moveZ) > 0.05;

    // Sprinting logic
    this.isSprinting = this.input.sprint && isMoving && this.stamina > 5;
    if (this.isSprinting) {
      this.stamina = Math.max(0, this.stamina - 28 * dt);
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + 18 * dt);
    }

    const speed = this.isSprinting ? this.sprintSpeed : this.walkSpeed;

    if (isMoving) {
      this.moveDir.set(moveX, 0, moveZ).normalize();

      // Project along camera yaw
      this.forwardVector.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
      this.rightVector.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();

      this.desiredMove
        .set(0, 0, 0)
        .addScaledVector(this.forwardVector, -this.moveDir.z)
        .addScaledVector(this.rightVector, this.moveDir.x)
        .normalize()
        .multiplyScalar(speed * dt);

      const targetPos = this.position.clone().add(this.desiredMove);

      // Check collision and slide along walls
      const resolved = this.collisionSystem.resolve(this.position, targetPos, 0.45);
      this.position.copy(resolved);

      // Footstep audio timing
      const stepInterval = this.isSprinting ? 0.32 : 0.52;
      this.footstepTimer += dt;
      if (this.footstepTimer >= stepInterval) {
        this.footstepTimer = 0;
        soundManager.playFootstep();
      }

      // Head bobbing
      this.bobTimer += dt * (this.isSprinting ? 14 : 9);
      const bobAmount = this.isSprinting ? 0.055 : 0.035;
      this.camera.position.y = this.baseEyeHeight + Math.sin(this.bobTimer) * bobAmount;
    } else {
      // Idle breathing bob
      this.bobTimer += dt * 2.0;
      this.camera.position.y = this.baseEyeHeight + Math.sin(this.bobTimer) * 0.008;
    }

    this.camera.position.x = this.position.x;
    this.camera.position.z = this.position.z;
  }
}
