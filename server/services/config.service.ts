import fs from 'fs';
import path from 'path';

export interface AppConfig {
  obsidian: {
    vaultPath: string;
    githubSync: {
      enabled: boolean;
      token: string;
      repo: string; // owner/repo
      branch: string;
      pathInRepo: string;
    };
  };
}

const DEFAULT_CONFIG: AppConfig = {
  obsidian: {
    vaultPath: path.join(process.cwd(), 'data', 'obsidian'),
    githubSync: {
      enabled: false,
      token: '',
      repo: '',
      branch: 'main',
      pathInRepo: 'notes'
    }
  }
};

class ConfigService {
  private configPath = path.join(process.cwd(), 'data', 'config.json');
  private currentConfig: AppConfig;

  constructor() {
    if (!fs.existsSync(path.dirname(this.configPath))) {
      fs.mkdirSync(path.dirname(this.configPath), { recursive: true });
    }

    if (fs.existsSync(this.configPath)) {
      try {
        const saved = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        this.currentConfig = { ...DEFAULT_CONFIG, ...saved };
      } catch (e) {
        console.error('Error loading config, using defaults:', e);
        this.currentConfig = DEFAULT_CONFIG;
      }
    } else {
      this.currentConfig = DEFAULT_CONFIG;
      this.save();
    }
  }

  public getConfig(): AppConfig {
    return this.currentConfig;
  }

  public updateConfig(newConfig: Partial<AppConfig>) {
    // Deep merge for obsidian object to prevent losing githubSync when updating vaultPath and vice versa
    if (newConfig.obsidian) {
      this.currentConfig.obsidian = {
        ...this.currentConfig.obsidian,
        ...newConfig.obsidian,
        githubSync: {
          ...this.currentConfig.obsidian.githubSync,
          ...(newConfig.obsidian.githubSync || {})
        }
      };
    }
    
    // Merge other top-level properties if any (currently only obsidian)
    this.currentConfig = { ...this.currentConfig, ...newConfig, obsidian: this.currentConfig.obsidian };
    this.save();
  }

  private save() {
    fs.writeFileSync(this.configPath, JSON.stringify(this.currentConfig, null, 2));
  }
}

export const configService = new ConfigService();
