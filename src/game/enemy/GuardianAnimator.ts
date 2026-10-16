import * as THREE from 'three';
import { ProceduralTextures } from '../textures/ProceduralTextures';

export class GuardianAnimator {
  public group: THREE.Group;
  public leftArm: THREE.Group;
  public rightArm: THREE.Group;
  public head: THREE.Group;
  public eyeLight: THREE.PointLight;
  public auraLight: THREE.PointLight;
  private wraps: THREE.Mesh[] = [];

  // Animation states
  private animTimer: number = 0;
  public isAttacking: boolean = false;
  private attackProgress: number = 0;

  constructor() {
    this.group = new THREE.Group();

    // Bandage / linen material
    const bandageMat = new THREE.MeshStandardMaterial({
      color: 0x8a7761,
      roughness: 0.95,
      metalness: 0.05,
    });

    const witheredSkinMat = new THREE.MeshStandardMaterial({
      color: 0x3d3025,
      roughness: 0.85,
    });

    const royalGoldMat = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.getGoldReliefTexture(),
      roughness: 0.35,
      metalness: 0.85,
    });

    const glowEyeMat = new THREE.MeshBasicMaterial({
      color: 0xff1122,
    });

    // 1. Torso & Ribcage
    const torsoGeo = new THREE.CylinderGeometry(0.38, 0.28, 1.1, 10);
    const torso = new THREE.Mesh(torsoGeo, bandageMat);
    torso.position.y = 1.6;
    torso.castShadow = true;
    this.group.add(torso);

    // Gilded Collar / Usekh
    const collarGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.15, 12);
    const collar = new THREE.Mesh(collarGeo, royalGoldMat);
    collar.position.y = 2.1;
    this.group.add(collar);

    // 2. Head & Nemes Headdress / Jackal Mask
    this.head = new THREE.Group();
    this.head.position.y = 2.3;

    const skullGeo = new THREE.BoxGeometry(0.32, 0.42, 0.44);
    const skull = new THREE.Mesh(skullGeo, witheredSkinMat);
    this.head.add(skull);

    // Jackal Snout
    const snoutGeo = new THREE.BoxGeometry(0.2, 0.16, 0.4);
    const snout = new THREE.Mesh(snoutGeo, witheredSkinMat);
    snout.position.set(0, -0.08, 0.35);
    this.head.add(snout);

    // Nemes Headdress Crown
    const headdressGeo = new THREE.ConeGeometry(0.38, 0.45, 4);
    headdressGeo.rotateY(Math.PI / 4);
    const headdress = new THREE.Mesh(headdressGeo, royalGoldMat);
    headdress.position.y = 0.32;
    this.head.add(headdress);

    // Pointed Jackal Ears
    for (const side of [-1, 1]) {
      const earGeo = new THREE.ConeGeometry(0.08, 0.38, 4);
      const ear = new THREE.Mesh(earGeo, witheredSkinMat);
      ear.position.set(side * 0.16, 0.35, 0.05);
      ear.rotation.z = side * -0.2;
      this.head.add(ear);
    }

    // Glowing Spectral Crimson Eyes
    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), glowEyeMat);
      eye.position.set(side * 0.1, 0.06, 0.23);
      this.head.add(eye);
    }

    this.group.add(this.head);

    // Head spotlight / eye glare
    this.eyeLight = new THREE.PointLight(0xff1122, 1.5, 6, 2);
    this.eyeLight.position.set(0, 2.36, 0.4);
    this.group.add(this.eyeLight);

    // 3. Left Arm (Clawed Hand)
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.46, 2.05, 0);

    const lUpperGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.55, 8);
    const lUpper = new THREE.Mesh(lUpperGeo, bandageMat);
    lUpper.position.y = -0.275;
    this.leftArm.add(lUpper);

    const lClawGeo = new THREE.ConeGeometry(0.06, 0.28, 4);
    const lClaw = new THREE.Mesh(lClawGeo, witheredSkinMat);
    lClaw.position.set(0, -0.6, 0.1);
    lClaw.rotation.x = Math.PI / 4;
    this.leftArm.add(lClaw);

    this.group.add(this.leftArm);

    // 4. Right Arm (Wielding Khopesh Blade)
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.46, 2.05, 0);

    const rUpperGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.55, 8);
    const rUpper = new THREE.Mesh(rUpperGeo, bandageMat);
    rUpper.position.y = -0.275;
    this.rightArm.add(rUpper);

    // Curved Egyptian Khopesh Sickle-Sword
    const khopeshGroup = new THREE.Group();
    khopeshGroup.position.set(0, -0.55, 0.1);

    const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4, 8), royalGoldMat);
    khopeshGroup.add(hilt);

    const bladeGeo = new THREE.BoxGeometry(0.05, 0.8, 0.15);
    const blade = new THREE.Mesh(bladeGeo, royalGoldMat);
    blade.position.set(0, 0.45, 0.08);
    blade.rotation.x = -0.25;
    khopeshGroup.add(blade);

    this.rightArm.add(khopeshGroup);
    this.group.add(this.rightArm);

    // 5. Floating / Hovering Shroud Linens (Tattered lower robes)
    const shroudGeo = new THREE.ConeGeometry(0.48, 1.2, 10, 1, true);
    const shroud = new THREE.Mesh(shroudGeo, bandageMat);
    shroud.position.y = 0.65;
    this.group.add(shroud);

    // Trailing bandage strips
    for (let i = 0; i < 4; i++) {
      const stripGeo = new THREE.BoxGeometry(0.08, 0.6 + i * 0.1, 0.02);
      const strip = new THREE.Mesh(stripGeo, bandageMat);
      const angle = (i * Math.PI * 2) / 4;
      strip.position.set(Math.cos(angle) * 0.3, 0.25, Math.sin(angle) * 0.3);
      this.wraps.push(strip);
      this.group.add(strip);
    }

    // Supernatural dark crimson aura light
    this.auraLight = new THREE.PointLight(0xcc2200, 1.2, 7, 2);
    this.auraLight.position.set(0, 1.5, 0);
    this.group.add(this.auraLight);
  }

  public triggerAttack() {
    this.isAttacking = true;
    this.attackProgress = 0;
  }

  public update(dt: number, speed: number) {
    this.animTimer += dt * (speed > 0.5 ? 5.0 : 2.5);

    // Floating hover offset on Y
    const hover = Math.sin(this.animTimer * 0.8) * 0.08;
    this.group.position.y = hover;

    // Head subtle sway
    this.head.rotation.y = Math.sin(this.animTimer * 0.5) * 0.12;

    // Trailing bandage ribbons sway with motion
    this.wraps.forEach((wrap, i) => {
      wrap.rotation.z = Math.sin(this.animTimer + i) * 0.25;
      wrap.rotation.x = Math.cos(this.animTimer + i * 0.7) * 0.25;
    });

    if (this.isAttacking) {
      // Powerful Khopesh lunge attack animation
      this.attackProgress += dt * 3.5;
      if (this.attackProgress >= 1.0) {
        this.isAttacking = false;
        this.attackProgress = 0;
      }

      // Windup then slash
      const slash = Math.sin(this.attackProgress * Math.PI);
      this.rightArm.rotation.x = -1.2 + slash * 2.2;
      this.leftArm.rotation.x = -0.6 + slash * 1.2;
      this.head.rotation.x = 0.2 - slash * 0.3;
    } else {
      // Natural walking / menacing gliding arm swing
      const armSwing = Math.sin(this.animTimer) * (speed > 0.5 ? 0.45 : 0.15);
      this.leftArm.rotation.x = armSwing;
      this.rightArm.rotation.x = -0.3 - armSwing * 0.5;
      this.head.rotation.x = 0;
    }
  }

  public dispose() {
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }
}
