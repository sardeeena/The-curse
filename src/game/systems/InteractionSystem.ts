import * as THREE from 'three';

export interface InteractiveTarget {
  id: string;
  name: string;
  promptText: string;
  position: THREE.Vector3;
  interactionDistance: number;
  active: boolean;
  mesh?: THREE.Object3D;
  onInteract: () => void;
}

export class InteractionSystem {
  private targets: InteractiveTarget[] = [];
  public currentTarget: InteractiveTarget | null = null;
  private camera: THREE.Camera;
  private raycaster = new THREE.Raycaster();
  private tempForward = new THREE.Vector3();

  constructor(camera: THREE.Camera) {
    this.camera = camera;
    this.raycaster.far = 3.5;
  }

  public register(target: InteractiveTarget) {
    this.targets.push(target);
  }

  public unregister(id: string) {
    this.targets = this.targets.filter(t => t.id !== id);
    if (this.currentTarget?.id === id) {
      this.currentTarget = null;
    }
  }

  public clear() {
    this.targets = [];
    this.currentTarget = null;
  }

  public update(): InteractiveTarget | null {
    const camPos = this.camera.position;
    this.camera.getWorldDirection(this.tempForward);

    let closest: InteractiveTarget | null = null;
    let closestDist = Infinity;

    for (const target of this.targets) {
      if (!target.active) continue;

      const dist = camPos.distanceTo(target.position);
      if (dist <= target.interactionDistance) {
        // Check if player is facing the target
        const toTarget = target.position.clone().sub(camPos).normalize();
        const dot = this.tempForward.dot(toTarget);

        // Within ~65 degree cone of vision or very close proximity
        if (dot > 0.6 || dist < 1.4) {
          if (dist < closestDist) {
            closestDist = dist;
            closest = target;
          }
        }
      }
    }

    this.currentTarget = closest;
    return closest;
  }

  public interact(): boolean {
    if (this.currentTarget && this.currentTarget.active) {
      this.currentTarget.onInteract();
      return true;
    }
    return false;
  }
}
