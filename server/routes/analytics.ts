import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth.middleware.js";
import { agentService } from "../services/agent.service.js";
import { configService } from "../services/config.service.js";
import { syncService } from "../services/sync.service.js";

const router = Router();

// Mock DJ Database for now (will be replaced by Step 4)
const mockDjs = [
  { id: "1", name: "Indira Paganotto", tier: 3, followers: 1200000, platform: "Instagram", recent_growth: 1.2 },
  { id: "2", name: "Sara Landry", tier: 3, followers: 950000, platform: "TikTok", recent_growth: 3.5 },
  { id: "3", name: "Oguz", tier: 2, followers: 450000, platform: "Instagram", recent_growth: 0.8 },
  { id: "4", name: "Klangkuenstler", tier: 4, followers: 2100000, platform: "YouTube", recent_growth: 1.1 },
  { id: "5", name: "Nico Moreno", tier: 3, followers: 800000, platform: "Instagram", recent_growth: 2.4 },
];

const mockSignals = [
  { dj_id: "1", dj_name: "Indira Paganotto", signal_type: "Pico de Crecimiento Viral", platform: "Instagram", intensity: "ALTA", timestamp: new Date().toISOString() },
  { dj_id: "2", dj_name: "Sara Landry", signal_type: "Pico de Crecimiento Viral", platform: "TikTok", intensity: "CRITICAL", timestamp: new Date().toISOString() },
];

router.get("/djs", requireAuth, (req: AuthRequest, res: Response) => {
  const verified = agentService.getVerifiedDjs();
  const manual = agentService.getManualDjs();
  res.json([...verified, ...manual]);
});

router.post("/agent/manual-add", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const dj = await agentService.addManualDj(req.body);
    res.json({ success: true, dj });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/signals/viral", requireAuth, (req: AuthRequest, res: Response) => {
  res.json(mockSignals);
});

router.get("/agent/verified", requireAuth, (req: AuthRequest, res: Response) => {
  res.json(agentService.getVerifiedDjs());
});

router.get("/agent/existing-names", requireAuth, (req: AuthRequest, res: Response) => {
  res.json(agentService.getExistingNames());
});

router.post("/agent/save-verified", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { dj, summary } = req.body;
    await agentService.saveVerifiedDj(dj, summary);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/agent/update-status", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id, status } = req.body;
    const dj = await agentService.updateDjStatus(id, status);
    if (!dj) return res.status(404).json({ error: "DJ not found" });
    res.json({ success: true, dj });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/config", requireAuth, (req: AuthRequest, res: Response) => {
  res.json(configService.getConfig());
});

router.post("/config", requireAuth, (req: AuthRequest, res: Response) => {
  try {
    configService.updateConfig(req.body);
    syncService.resetOctokit(); // Reset octokit to use new token if changed
    res.json({ success: true, config: configService.getConfig() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/sync/now", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const result = await syncService.syncAll();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/agent/obsidian", requireAuth, (req: AuthRequest, res: Response) => {
  res.json(agentService.getObsidianNotes());
});

router.get("/stats", requireAuth, (req: AuthRequest, res: Response) => {
  res.json(agentService.getStats());
});

export default router;
