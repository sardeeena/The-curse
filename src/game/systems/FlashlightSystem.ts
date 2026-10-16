import * as THREE from 'three';
import { soundManager } from '../audio/SoundEffects';

export class FlashlightSystem {
  public spotLight: THREE.SpotLight;
  public fillLight: THREE.PointLight;
  public beamMesh: THREE.Mesh;
  public isOn: boolean = true;
  public battery: number = 100; // 0 to 100
  public maxBattery: number = 100;
  private drainRate: number = 0.45; // % per second when on
  private flickerTimer: number = 0;
  private isFlickering: boolean = false;
  private targetIntensity: number = 3.5;

  constructor() {
    // Primary forward spotlight
    this.spotLight = new THREE.SpotLight(0xfff5e6, 3.5, 26, Math.PI / 6, 0.45, 1.2);
    this.spotLight.castShadow = true;
    this.spotLight.shadow.mapSize.width = 1024;
    this.spotLight.shadow.mapSize.height = 1024;
    this.spotLight.shadow.bias = -0.001;
    this.spotLight.shadow.camera.near = 0.2;
    this.spotLight.shadow.camera.far = 28;

    // Soft peripheral fill light around player
    this.fillLight = new THREE.PointLight(0xffeedd, 0.6, 6, 1.5);

    // Subtle atmospheric light beam cone
    const beamGeo = new THREE.ConeGeometry(3.5, 16, 24, 1, true);
    beamGeo.translate(0, -8, 0);
    beamGeo.rotateX(Math.PI / 2);

    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xfff3d6,
      transparent: true,
      opacity: 0.045,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.beamMesh = new THREE.Mesh(beamGeo, beamMat);
  }

  public attachToCamera(camera: THREE.Camera, scene: THREE.Scene) {
    camera.add(this.spotLight);
    camera.add(this.fillLight);
    camera.add(this.beamMesh);

    // The spotlight needs a target in front of the camera
    const targetObject = new THREE.Object3D();
    targetObject.position.set(0, 0, -8);
    camera.add(targetObject);
    this.spotLight.target = targetObject;

    scene.add(camera);
  }

  public toggle(): boolean {
    if (this.battery <= 0 && !this.isOn) {
      // Cannot turn on depleted flashlight
      soundManager.playFlashlightClick(false);
      return false;
    }

    this.isOn = !this.isOn;
    soundManager.playFlashlightClick(this.isOn);
    this.updateIllumination();
    return this.isOn;
  }

  public setPower(on: boolean) {
    if (this.isOn !== on) {
      this.toggle();
    }
  }

  public addBattery(amount: number) {
    this.battery = Math.min(this.maxBattery, this.battery + amount);
    if (!this.isOn && this.battery > 0) {
      this.isOn = true;
      this.updateIllumination();
    }
    soundManager.playBatteryPickup();
  }

  public update(dt: number) {
    if (!this.isOn) {
      this.spotLight.intensity = 0;
      this.fillLight.intensity = 0;
      this.beamMesh.visible = false;
      return;
    }

    // Drain battery
    this.battery = Math.max(0, this.battery - this.drainRate * dt);

    if (this.battery <= 0) {
      this.isOn = false;
      this.spotLight.intensity = 0;
      this.fillLight.intensity = 0;
      this.beamMesh.visible = false;
      soundManager.playFlashlightClick(false);
      return;
    }

    // Low battery flickering (< 22%)
    if (this.battery < 22) {
      this.flickerTimer -= dt;
      if (this.flickerTimer <= 0) {
        this.isFlickering = Math.random() > 0.45;
        this.flickerTimer = 0.05 + Math.random() * 0.25;
      }
    } else {
      this.isFlickering = false;
    }

    if (this.isFlickering) {
      const flickerFactor = Math.random() * 0.4;
      this.spotLight.intensity = this.targetIntensity * flickerFactor;
      this.fillLight.intensity = 0.6 * flickerFactor;
      this.beamMesh.visible = flickerFactor > 0.15;
    } else {
      // Scale brightness based on remaining power
      const powerRatio = Math.max(0.4, this.battery / 100);
      this.spotLight.intensity = this.targetIntensity * powerRatio;
      this.fillLight.intensity = 0.6 * powerRatio;
      this.beamMesh.visible = true;
    }
  }

  private updateIllumination() {
    if (!this.isOn) {
      this.spotLight.intensity = 0;
      this.fillLight.intensity = 0;
      this.beamMesh.visible = false;
    } else {
      this.spotLight.intensity = this.targetIntensity;
      this.fillLight.intensity = 0.6;
      this.beamMesh.visible = true;
    }
  }

  public reset(battery: number = 100, isOn: boolean = true) {
    this.battery = Math.min(this.maxBattery, Math.max(0, battery));
    this.isOn = isOn && this.battery > 0;
    this.flickerTimer = 0;
    this.isFlickering = false;
    this.updateIllumination();
  }

  public dispose() {
    this.spotLight.dispose();
    this.fillLight.dispose();
    this.beamMesh.geometry.dispose();
    (this.beamMesh.material as THREE.Material).dispose();
  }
}
