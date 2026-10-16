export type GameMode = 'MENU' | 'PLAYING' | 'PAUSED' | 'VICTORY' | 'GAMEOVER';
export type GraphicsQuality = 'LOW' | 'MEDIUM' | 'HIGH';

export interface GameSettings {
  sensitivity: number;
  volume: number;
  graphicsQuality: GraphicsQuality;
  invertY: boolean;
}

export interface InspectionData {
  title: string;
  text: string;
}

export interface GameStateListener {
  onModeChange?: (mode: GameMode) => void;
  onObjectiveChange?: (objective: string) => void;
  onNotification?: (msg: string) => void;
  onInspection?: (data: InspectionData | null) => void;
  onInventoryUpdate?: (inventory: { hasArtifact: boolean; batteryPacks: number }) => void;
  onHealthUpdate?: (health: number, maxHealth: number) => void;
  onDamageTaken?: () => void;
  onSettingsChange?: (settings: GameSettings) => void;
}

export class GameStateManager {
  public mode: GameMode = 'MENU';
  public currentObjective: string = 'Explore the tomb corridors and investigate the Scribe\'s Archive.';
  public hasArtifact: boolean = false;
  public batteryPacks: number = 0;
  public activeInspection: InspectionData | null = null;
  public checkpointSaved: boolean = false;

  public settings: GameSettings = {
    sensitivity: 1.0,
    volume: 0.7,
    graphicsQuality: 'HIGH',
    invertY: false,
  };

  private listeners: GameStateListener[] = [];

  constructor() {
    this.loadSettings();
  }

  public addListener(listener: GameStateListener) {
    this.listeners.push(listener);
  }

  public removeListener(listener: GameStateListener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  public setMode(newMode: GameMode) {
    if (this.mode === newMode) return;
    this.mode = newMode;
    this.listeners.forEach(l => l.onModeChange?.(newMode));
  }

  public setObjective(obj: string) {
    this.currentObjective = obj;
    this.listeners.forEach(l => l.onObjectiveChange?.(obj));
  }

  public notify(msg: string) {
    this.listeners.forEach(l => l.onNotification?.(msg));
  }

  public showInspection(data: InspectionData | null) {
    this.activeInspection = data;
    this.listeners.forEach(l => l.onInspection?.(data));
  }

  public setHasArtifact(val: boolean) {
    this.hasArtifact = val;
    this.listeners.forEach(l =>
      l.onInventoryUpdate?.({
        hasArtifact: this.hasArtifact,
        batteryPacks: this.batteryPacks,
      })
    );
  }

  public notifyHealth(health: number, maxHealth: number, damageTaken: number) {
    this.listeners.forEach(l => l.onHealthUpdate?.(health, maxHealth));
    if (damageTaken > 0) {
      this.listeners.forEach(l => l.onDamageTaken?.());
    }
  }

  public updateSettings(partial: Partial<GameSettings>) {
    this.settings = { ...this.settings, ...partial };
    this.saveSettings();
    this.listeners.forEach(l => l.onSettingsChange?.(this.settings));
  }

  private saveSettings() {
    try {
      localStorage.setItem('curse_pharaoh_settings', JSON.stringify(this.settings));
    } catch {
      // Ignore
    }
  }

  private loadSettings() {
    try {
      const saved = localStorage.getItem('curse_pharaoh_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.settings = { ...this.settings, ...parsed };
      }
    } catch {
      // Ignore
    }
  }

  public reset(keepCheckpoint: boolean = false) {
    this.hasArtifact = false;
    this.batteryPacks = 0;
    this.activeInspection = null;

    if (!keepCheckpoint) {
      this.checkpointSaved = false;
      this.currentObjective = 'Explore the tomb corridors and investigate the Scribe\'s Archive.';
    } else {
      this.currentObjective = 'The Guardian is searching! Evade the entity and recover the Eye of Horus.';
    }

    this.setMode('PLAYING');
    this.listeners.forEach(l =>
      l.onInventoryUpdate?.({
        hasArtifact: false,
        batteryPacks: 0,
      })
    );
  }
}
