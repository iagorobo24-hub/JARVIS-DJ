import { Octokit } from 'octokit';
import fs from 'fs';
import path from 'path';
import { configService } from './config.service.js';

class SyncService {
  private octokit: Octokit | null = null;

  private getOctokit() {
    const config = configService.getConfig().obsidian.githubSync;
    if (!config.enabled || !config.token) return null;

    // Always create a new instance to ensure we use the latest token
    this.octokit = new Octokit({ auth: config.token });
    return this.octokit;
  }

  public async syncNote(fileName: string, content: string) {
    const config = configService.getConfig().obsidian.githubSync;
    if (!config.enabled || !config.token || !config.repo) {
      console.log('GitHub Sync is disabled or missing configuration.');
      return;
    }

    const octokit = this.getOctokit();
    if (!octokit) return;

    // Clean repo name: remove leading/trailing slashes and spaces
    const repoPath = config.repo.trim().replace(/^\/+|\/+$/g, '');
    const parts = repoPath.split('/');
    if (parts.length < 2) {
      throw new Error(`Formato de repositorio inválido: "${config.repo}". Debe ser "usuario/repo"`);
    }
    const owner = parts[0];
    const repo = parts.slice(1).join('/');
    
    // Clean folder path: remove leading/trailing slashes
    const cleanFolderPath = config.pathInRepo.trim().replace(/^\/+|\/+$/g, '');
    
    // --- ORGANIZACIÓN POR ÁREAS (GÉNERO) ---
    // Intentamos extraer el género de la nota para crear una subcarpeta
    let areaFolder = '';
    const genreMatch = content.match(/Genre:\s*([^\n\r]+)/i);
    if (genreMatch && genreMatch[1]) {
      areaFolder = genreMatch[1].trim().replace(/[\\/:*?"<>|]/g, ''); // Limpiar caracteres inválidos
    } else {
      areaFolder = 'Sin Clasificar';
    }

    const path = cleanFolderPath 
      ? `${cleanFolderPath}/${areaFolder}/${fileName}` 
      : `${areaFolder}/${fileName}`;

    console.log(`[Sync] Organizando en área: ${areaFolder} -> ${path}`);

    try {
      // Check if file exists to get SHA
      let sha: string | undefined;
      try {
        const { data } = await octokit.rest.repos.getContent({
          owner,
          repo,
          path,
          ref: config.branch
        });
        if (!Array.isArray(data)) {
          sha = data.sha;
        }
      } catch (e: any) {
        if (e.status !== 404) {
          console.warn(`[Sync] Aviso al buscar archivo existente: ${e.message}`);
        }
      }

      const response = await octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message: `Sync note: ${fileName} (JARVIS-DJ)`,
        content: Buffer.from(content).toString('base64'),
        sha,
        branch: config.branch
      });

      console.log(`[Sync] Éxito: ${fileName} sincronizado en ${response.data.content?.html_url}`);
      return { success: true };
    } catch (error: any) {
      console.error(`[Sync] ERROR sincronizando ${fileName}:`, error.message, error.status);
      throw error;
    }
  }

  public resetOctokit() {
    this.octokit = null;
  }

  public async syncAll() {
    const config = configService.getConfig();
    if (!config.obsidian.githubSync.enabled) {
      return { success: false, error: 'La sincronización de GitHub está desactivada.' };
    }
    if (!config.obsidian.githubSync.token || !config.obsidian.githubSync.repo) {
      return { success: false, error: 'Falta el Token o el Repositorio de GitHub.' };
    }

    const vaultPath = config.obsidian.vaultPath;
    if (!fs.existsSync(vaultPath)) return { success: false, error: 'La ruta del Vault no existe en el servidor.' };

    const files = fs.readdirSync(vaultPath).filter(f => f.endsWith('.md'));
    if (files.length === 0) return { success: true, results: [], message: 'No hay notas para sincronizar.' };

    const results = [];
    let errorCount = 0;

    for (const file of files) {
      const content = fs.readFileSync(path.join(vaultPath, file), 'utf8');
      try {
        await this.syncNote(file, content);
        results.push({ file, success: true });
      } catch (err: any) {
        errorCount++;
        results.push({ file, success: false, error: err.message });
      }
    }

    if (errorCount === files.length) {
      return { success: false, error: 'Error crítico: No se pudo sincronizar ninguna nota. Revisa tus credenciales.' };
    }

    return { success: true, results, message: `Sincronizadas ${files.length - errorCount} notas correctamente.` };
  }
}

export const syncService = new SyncService();
