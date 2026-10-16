export interface HealthListener {
  onHealthChanged: (current: number, max: number, damageTaken: number) => void;
  onPlayerDeath: () => void;
}

export class HealthSystem {
  public maxHealth: number = 100;
  public currentHealth: number = 100;
  public isInvulnerable: boolean = false;
  private invulnerableTimer: number = 0;
  private invulnerableDuration: number = 1.2; // seconds of grace period after hit
  private listeners: HealthListener[] = [];

  constructor(maxHealth: number = 100) {
    this.maxHealth = maxHealth;
    this.currentHealth = maxHealth;
  }

  public addListener(listener: HealthListener) {
    this.listeners.push(listener);
  }

  public removeListener(listener: HealthListener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  public damage(amount: number): boolean {
    if (this.isInvulnerable || this.currentHealth <= 0) {
      return false;
    }

    this.currentHealth = Math.max(0, this.currentHealth - amount);
    this.isInvulnerable = true;
    this.invulnerableTimer = this.invulnerableDuration;

    this.listeners.forEach(l => l.onHealthChanged(this.currentHealth, this.maxHealth, amount));

    if (this.currentHealth <= 0) {
      this.listeners.forEach(l => l.onPlayerDeath());
    }

    return true;
  }

  public heal(amount: number) {
    if (this.currentHealth <= 0) return;
    this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
    this.listeners.forEach(l => l.onHealthChanged(this.currentHealth, this.maxHealth, 0));
  }

  public reset(health: number = this.maxHealth) {
    this.currentHealth = health;
    this.isInvulnerable = false;
    this.invulnerableTimer = 0;
    this.listeners.forEach(l => l.onHealthChanged(this.currentHealth, this.maxHealth, 0));
  }

  public update(dt: number) {
    if (this.isInvulnerable) {
      this.invulnerableTimer -= dt;
      if (this.invulnerableTimer <= 0) {
        this.isInvulnerable = false;
      }
    }
  }
}
