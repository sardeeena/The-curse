import * as THREE from 'three';
import { CollisionSystem, BoxCollider } from '../player/CollisionSystem';
import { soundManager } from '../audio/SoundEffects';
import { ProceduralTextures } from '../textures/ProceduralTextures';

export class Door {
  public id: string;
  public group: THREE.Group;
  public doorMesh: THREE.Mesh;
  public isLocked: boolean = true;
  public isOpen: boolean = false;
  private closedY: number;
  private openY: number;
  private currentY: number;
  private isAnimating: boolean = false;
  private collider: BoxCollider;
  private collisionSystem: CollisionSystem;

  constructor(
    id: string,
    position: THREE.Vector3,
    width: number = 2.4,
    height: number = 3.6,
    depth: number = 0.5,
    collisionSystem: CollisionSystem
  ) {
    this.id = id;
    this.collisionSystem = collisionSystem;
    this.group = new THREE.Group();
    this.group.position.copy(position);

    this.closedY = height / 2;
    this.openY = height / 2 + height - 0.2;
    this.currentY = this.closedY;

    // Door slab geometry
    const doorGeo = new THREE.BoxGeometry(width, height, depth);
    const doorMat = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.getHieroglyphFriezeTexture(),
      roughness: 0.85,
      metalness: 0.1,
    });
    this.doorMesh = new THREE.Mesh(doorGeo, doorMat);
    this.doorMesh.position.set(0, this.closedY, 0);
    this.doorMesh.castShadow = true;
    this.doorMesh.receiveShadow = true;
    this.group.add(this.doorMesh);

    // Stone Frame / Archway
    const frameMat = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.getWallTexture(),
      roughness: 0.9,
    });
    const postGeo = new THREE.BoxGeometry(0.5, height, depth * 1.4);
    const leftPost = new THREE.Mesh(postGeo, frameMat);
    leftPost.position.set(-width / 2 - 0.25, height / 2, 0);
    leftPost.castShadow = true;
    this.group.add(leftPost);

    const rightPost = new THREE.Mesh(postGeo, frameMat);
    rightPost.position.set(width / 2 + 0.25, height / 2, 0);
    rightPost.castShadow = true;
    this.group.add(rightPost);

    const lintelGeo = new THREE.BoxGeometry(width + 1.2, 0.6, depth * 1.5);
    const lintel = new THREE.Mesh(lintelGeo, frameMat);
    lintel.position.set(0, height + 0.3, 0);
    lintel.castShadow = true;
    this.group.add(lintel);

    // Register door collider in collision system
    const halfW = width / 2;
    const halfD = depth / 2;
    this.collider = this.collisionSystem.addBox(
      new THREE.Vector3(position.x - halfW, position.y, position.z - halfD),
      new THREE.Vector3(position.x + halfW, position.y + height, position.z + halfD),
      id
    );

    // Add frame posts colliders
    this.collisionSystem.addBox(
      new THREE.Vector3(position.x - halfW - 0.5, position.y, position.z - depth),
      new THREE.Vector3(position.x - halfW, position.y + height, position.z + depth)
    );
    this.collisionSystem.addBox(
      new THREE.Vector3(position.x + halfW, position.y, position.z - depth),
      new THREE.Vector3(position.x + halfW + 0.5, position.y + height, position.z + depth)
    );
  }

  public open(): boolean {
    if (this.isOpen) return false;
    this.isOpen = true;
    this.isLocked = false;
    this.isAnimating = true;
    this.collisionSystem.setColliderActive(this.id, false);
    soundManager.playStoneGrind();
    return true;
  }

  public update(dt: number) {
    if (!this.isAnimating) return;

    const targetY = this.isOpen ? this.openY : this.closedY;
    const speed = 1.4; // meters per second
    const diff = targetY - this.currentY;

    if (Math.abs(diff) < 0.05) {
      this.currentY = targetY;
      this.isAnimating = false;
    } else {
      this.currentY += Math.sign(diff) * speed * dt;
    }

    this.doorMesh.position.y = this.currentY;
  }

  public reset() {
    this.isOpen = false;
    this.isLocked = true;
    this.isAnimating = false;
    this.currentY = this.closedY;
    this.doorMesh.position.y = this.closedY;
    this.collisionSystem.setColliderActive(this.id, true);
  }

  public dispose() {
    this.doorMesh.geometry.dispose();
    (this.doorMesh.material as THREE.Material).dispose();
  }
}
