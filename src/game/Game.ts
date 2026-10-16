import * as THREE from 'three';
import { PlayerController } from './player/PlayerController';
import { TombScene } from './scene/TombScene';
import { FlashlightSystem } from './systems/FlashlightSystem';
import { InteractionSystem, InteractiveTarget } from './systems/InteractionSystem';
import { HealthSystem } from './systems/HealthSystem';
import { GameStateManager, GameMode, GraphicsQuality } from './GameState';
import { soundManager } from './audio/SoundEffects';

export interface GameHUDData {
  health: number;
  maxHealth: number;
  battery: number;
  flashlightOn: boolean;
  stamina: number;
  interactionTarget: InteractiveTarget | null;
  mode: GameMode;
  objective: string;
  guardianState: string;
  isChased: boolean;
}

export class Game {
  public renderer: THREE.WebGLRenderer;
  public state: GameStateManager;
  public sceneManager: TombScene;
  public player: PlayerController;
  public flashlight: FlashlightSystem;
  public interaction: InteractionSystem;
  public health: HealthSystem;

  private clock = new THREE.Clock();
  private animationFrameId: number | null = null;
  private isDestroyed: boolean = false;
  private container: HTMLElement;

  // Title screen camera orbit
  private menuOrbitAngle: number = 0;

  // Periodic HUD update callback
  public onHUDUpdate: (data: GameHUDData) => void = () => {};

  constructor(container: HTMLElement, stateManager?: GameStateManager) {
    this.container = container;
    this.state = stateManager || new GameStateManager();
    this.health = new HealthSystem(100);

    // 1. Initialize WebGLRenderer with high-fidelity PBR setup
    const isHeadless = typeof navigator !== 'undefined' && (/HeadlessChrome/i.test(navigator.userAgent) || navigator.webdriver);
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !isHeadless;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.applyQuality(this.state.settings.graphicsQuality);
    this.renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);

    container.innerHTML = '';
    container.appendChild(this.renderer.domElement);

    // 2. Health Listener setup
    this.health.addListener({
      onHealthChanged: (current, max, dmg) => {
        this.state.notifyHealth(current, max, dmg);
      },
      onPlayerDeath: () => {
        this.state.setMode('GAMEOVER');
        this.player.unlockPointer();
        soundManager.playGameOverSound();
        soundManager.setChaseTension(false);
      },
    });

    // 3. Initialize Tomb Scene & Collision & Guardian
    this.sceneManager = new TombScene(this.renderer, this.health, {
      onArtifactCollected: () => {
        this.state.setHasArtifact(true);
        this.state.setObjective('Use the Eye of Horus Golden Amulet to unseal the Northern Gate.');
        this.state.notify('Sacred Artifact Acquired: Eye of Horus Amulet!');
      },
      onBatteryCollected: (amount) => {
        this.flashlight.addBattery(amount);
        this.state.notify(`Lantern Battery Recharged (+${amount}%)`);
      },
      onTabletInspected: (text) => {
        this.state.showInspection({
          title: 'Ancient Hieroglyphic Inscription',
          text,
        });
        if (!this.state.checkpointSaved) {
          this.state.setObjective('The Sacred Triad is revealed! Align the 3 Pillars in the Antechamber: Scarab, Ankh, Eye.');
        }
      },
      onSarcophagusInspected: () => {
        this.state.showInspection({
          title: 'Royal Death Sarcophagus',
          text: '“Here rests the Forgotten Pharaoh of the 13th Dynasty. An icy chill radiates from the gilded death mask. The seal on the chest has been broken from within...”',
        });
      },
      onPuzzleSolved: () => {
        this.state.checkpointSaved = true;
        this.state.setObjective('The Triad is Aligned! The Burial Chamber unseals... Beware the awakened entity!');
        this.state.notify('The Ancient Triad Mechanism Unlocked! Checkpoint Saved.');
      },
      onGuardianAwakened: () => {
        this.state.notify('THE TOMB GUARDIAN HAS AWAKENED!');
      },
      onGateUnlocked: () => {
        this.state.setObjective('The Northern Gate is unsealed! Escape into the outer sanctuary!');
        this.state.notify('The Ancient Northern Gate Grinds Open!');
      },
      onExitReached: () => {
        this.state.setMode('VICTORY');
        this.player.unlockPointer();
        soundManager.setChaseTension(false);
        this.state.notify('You broke the ancient curse and escaped the tomb!');
      },
    });

    // 4. Initialize Player & Controls
    this.player = new PlayerController(this.renderer.domElement, this.sceneManager.collisionSystem);
    this.player.mouseSensitivity = 0.0022 * this.state.settings.sensitivity;

    // 5. Initialize Flashlight
    this.flashlight = new FlashlightSystem();
    this.flashlight.attachToCamera(this.player.camera, this.sceneManager.scene);

    // 6. Initialize Interaction System
    this.interaction = new InteractionSystem(this.player.camera);
    this.sceneManager.setupInteractions(this.interaction);

    // 7. Connect Player Actions to Systems
    this.player.onInteractRequest = () => {
      if (this.state.activeInspection) {
        this.state.showInspection(null);
        return;
      }
      this.interaction.interact();
    };

    this.player.onFlashlightToggle = () => {
      this.flashlight.toggle();
    };

    this.player.onPauseRequest = () => {
      if (this.state.activeInspection) {
        this.state.showInspection(null);
        return;
      }
      if (this.state.mode === 'PLAYING') {
        this.pause();
      } else if (this.state.mode === 'PAUSED') {
        this.resume();
      }
    };

    // 8. Subscribe to Settings changes
    this.state.addListener({
      onSettingsChange: (settings) => {
        this.player.mouseSensitivity = 0.0022 * settings.sensitivity;
        soundManager.setVolume(settings.volume);
        this.applyQuality(settings.graphicsQuality);
      },
    });

    // 9. Handle window resize
    window.addEventListener('resize', this.onResize);

    // Click canvas to request pointer lock when in PLAYING mode
    this.renderer.domElement.addEventListener('click', this.onCanvasClick);

    // 10. Pre-warm shaders
    this.renderer.compile(this.sceneManager.scene, this.player.camera);

    // 11. Start the unified animation loop
    this.clock.start();
    this.loop();
  }

  private applyQuality(quality: GraphicsQuality) {
    const isHeadless = typeof navigator !== 'undefined' && (/HeadlessChrome/i.test(navigator.userAgent) || navigator.webdriver);
    if (isHeadless) {
      this.renderer.setPixelRatio(1);
      this.renderer.shadowMap.enabled = false;
      return;
    }

    switch (quality) {
      case 'LOW':
        this.renderer.setPixelRatio(1.0);
        this.renderer.shadowMap.enabled = false;
        break;
      case 'MEDIUM':
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.BasicShadowMap;
        break;
      case 'HIGH':
      default:
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        break;
    }
  }

  private onCanvasClick = () => {
    if (this.state.mode === 'PLAYING' && !this.state.activeInspection) {
      this.player.lockPointer();
    }
  };

  private onResize = () => {
    if (!this.container || this.isDestroyed) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.player.camera.aspect = width / height;
    this.player.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public startGame() {
    this.state.setMode('PLAYING');
    soundManager.startAtmosphere();
    this.health.reset(100);
    this.player.reset(new THREE.Vector3(0, 1.7, 18), 0);
    this.player.lockPointer();
  }

  public pause() {
    if (this.state.mode !== 'PLAYING') return;
    this.state.setMode('PAUSED');
    this.player.unlockPointer();
    soundManager.setChaseTension(false);
  }

  public resume() {
    if (this.state.mode !== 'PAUSED') return;
    this.state.setMode('PLAYING');
    this.player.lockPointer();
    if (this.sceneManager.guardian.getState() === 'CHASE') {
      soundManager.setChaseTension(true);
    }
  }

  public restart(fromCheckpoint: boolean = false) {
    if (fromCheckpoint && this.state.checkpointSaved) {
      // Spawn at antechamber checkpoint
      this.player.reset(new THREE.Vector3(0, 1.7, 2), 0);
      this.health.reset(100);
      this.flashlight.battery = Math.max(60, this.flashlight.battery);
      this.flashlight.isOn = true;
      this.state.reset(true);
      this.sceneManager.reset(true);
    } else {
      // Full chapter restart
      this.player.reset(new THREE.Vector3(0, 1.7, 18), 0);
      this.health.reset(100);
      this.flashlight.battery = 100;
      this.flashlight.isOn = true;
      this.state.reset(false);
      this.sceneManager.reset(false);
    }

    soundManager.startAtmosphere();
    this.player.lockPointer();
  }

  private loop = () => {
    if (this.isDestroyed) return;

    this.animationFrameId = requestAnimationFrame(this.loop);

    const rawDt = this.clock.getDelta();
    const dt = Math.min(rawDt, 0.05); // clamp frame delta time
    const elapsedTime = this.clock.getElapsedTime();

    const guardianState = this.sceneManager.guardian.getState();
    const isChasing = guardianState === 'CHASE';

    if (this.state.mode === 'MENU') {
      this.menuOrbitAngle += dt * 0.15;
      const camX = Math.sin(this.menuOrbitAngle) * 7;
      const camZ = Math.cos(this.menuOrbitAngle) * 7 - 12;
      this.player.camera.position.set(camX, 2.4, camZ);
      this.player.camera.lookAt(0, 1.6, -14);
      this.sceneManager.roomBuilder.update(dt, elapsedTime);
    } else if (this.state.mode === 'PLAYING') {
      // Active simulation tick
      this.player.update(dt);
      this.flashlight.update(dt);
      this.interaction.update();
      this.health.update(dt);

      const isSprinting = this.player.input.sprint && this.player.stamina > 5;
      const isMoving = this.player.input.forward || this.player.input.backward || this.player.input.left || this.player.input.right || this.player.virtualMove.lengthSq() > 0.01;

      this.sceneManager.update(
        dt,
        elapsedTime,
        this.player.position,
        isSprinting,
        isMoving,
        this.flashlight.isOn
      );

      // Acoustic heartbeat cue based on health deficit and chase tension
      const healthDeficit = 1 - this.health.currentHealth / 100;
      const urgency = Math.max(isChasing ? 0.75 : 0, healthDeficit);
      if (urgency > 0.25) {
        soundManager.playHeartbeat(elapsedTime, urgency);
      }
    } else if (this.state.mode === 'PAUSED' || this.state.mode === 'VICTORY' || this.state.mode === 'GAMEOVER') {
      this.sceneManager.roomBuilder.update(dt, elapsedTime);
    }

    // Render WebGL frame
    this.renderer.render(this.sceneManager.scene, this.player.camera);

    // Notify React HUD
    this.onHUDUpdate({
      health: Math.round(this.health.currentHealth),
      maxHealth: this.health.maxHealth,
      battery: Math.round(this.flashlight.battery),
      flashlightOn: this.flashlight.isOn,
      stamina: Math.round(this.player.stamina),
      interactionTarget: this.interaction.currentTarget,
      mode: this.state.mode,
      objective: this.state.currentObjective,
      guardianState,
      isChased: isChasing,
    });
  };

  public destroy() {
    this.isDestroyed = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    window.removeEventListener('resize', this.onResize);
    this.renderer.domElement.removeEventListener('click', this.onCanvasClick);

    this.player.unbindEvents();
    this.flashlight.dispose();
    this.sceneManager.dispose();
    soundManager.dispose();
    this.renderer.dispose();

    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
