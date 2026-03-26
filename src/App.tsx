import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  TrendingUp, 
  Users, 
  Zap, 
  Search, 
  LayoutDashboard, 
  BarChart3, 
  Settings as SettingsIcon,
  Bell,
  ChevronRight,
  ChevronDown,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  Instagram,
  Youtube,
  Music2,
  Share2,
  LogOut,
  User,
  Trash2,
  PlusCircle,
  ShieldCheck,
  AlertTriangle,
  Sun,
  Moon,
  Languages,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { geminiService } from './services/gemini.service';
import { translations, Language } from './translations';

// --- Types ---
interface DJ {
  id: string;
  name: string;
  tier: number;
  followers: number;
  platform: string;
  recent_growth: number;
  handle: string;
  marketingConclusions?: string;
  isReal?: boolean;
  verifiedAt?: string;
  addedAt?: string;
  status?: 'analyzed' | 'analyzing' | 'queued' | 'stale';
  source?: 'discovered' | 'manual';
  topPlatforms?: string[];
  trendData?: number[];
}

interface ViralSignal {
  dj_name: string;
  platform: string;
  growth: string;
  views: string;
  type: string;
  context: string;
  intensity: 'CRITICAL' | 'ALTA' | 'MEDIA';
  timestamp: string;
}

interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  actionType?: 'changeTab' | 'viewDj';
  actionData?: string;
}

// --- Mock Data ---
const MOCK_DJS: DJ[] = [
  { 
    id: '1', 
    name: 'Indira Paganotto', 
    tier: 4, 
    followers: 1200000, 
    platform: 'Instagram', 
    recent_growth: 3.4, 
    handle: '@indirapaganotto',
    topPlatforms: ['Instagram', 'TikTok', 'YouTube'],
    trendData: [80, 85, 92, 98, 110, 120]
  },
  { 
    id: '2', 
    name: 'Sara Landry', 
    tier: 3, 
    followers: 950000, 
    platform: 'TikTok', 
    recent_growth: 2.1, 
    handle: '@saralandrydj',
    topPlatforms: ['TikTok', 'Instagram'],
    trendData: [60, 65, 72, 80, 88, 95]
  },
  { 
    id: '3', 
    name: 'Klangkuenstler', 
    tier: 4, 
    followers: 2100000, 
    platform: 'YouTube', 
    recent_growth: 1.5, 
    handle: '@klangkuenstler',
    topPlatforms: ['YouTube', 'SoundCloud', 'Spotify'],
    trendData: [180, 185, 190, 195, 205, 210]
  },
  { 
    id: '4', 
    name: 'Oguz', 
    tier: 3, 
    followers: 450000, 
    platform: 'Instagram', 
    recent_growth: 5.2, 
    handle: '@oguz.808',
    topPlatforms: ['Instagram', 'TikTok'],
    trendData: [30, 35, 38, 40, 42, 45]
  },
  { 
    id: '5', 
    name: 'SPFDJ', 
    tier: 2, 
    followers: 280000, 
    platform: 'SoundCloud', 
    recent_growth: 0.8, 
    handle: '@spfdj',
    topPlatforms: ['SoundCloud', 'Instagram'],
    trendData: [25, 26, 26.5, 27, 27.5, 28]
  },
  { 
    id: '6', 
    name: 'Alignment', 
    tier: 2, 
    followers: 310000, 
    platform: 'Spotify', 
    recent_growth: 1.2, 
    handle: '@alignment_official',
    topPlatforms: ['Spotify', 'Instagram', 'YouTube'],
    trendData: [28, 28.5, 29, 30, 30.5, 31]
  },
];

const MOCK_SIGNALS: ViralSignal[] = [
  { dj_name: "Indira Paganotto", platform: "Instagram", growth: "+340%", views: "847K", type: "Set drop", context: "'Schranz Apocalypse'", intensity: "CRITICAL", timestamp: "hace 3 min" },
  { dj_name: "Sara Landry", platform: "TikTok", growth: "+210%", views: "1.2M", type: "Viral clip", context: "Hard Summer Recap", intensity: "ALTA", timestamp: "hace 12 min" },
  { dj_name: "Klangkuenstler", platform: "YouTube", growth: "+150%", views: "450K", type: "Track release", context: "Die Welt Brennt", intensity: "MEDIA", timestamp: "hace 45 min" },
  { dj_name: "Oguz", platform: "Instagram", growth: "+520%", views: "310K", type: "Live stream", context: "Studio Session", intensity: "CRITICAL", timestamp: "hace 1h" },
  { dj_name: "SPFDJ", platform: "SoundCloud", growth: "+85%", views: "120K", type: "Podcast", context: "Intrepid Skin 022", intensity: "ALTA", timestamp: "hace 2h" },
];

const TIER_DATA = [
  { tier: 4, label: 'GOD TIER', color: 'var(--tier-god)', description: 'Impacto Global > 1M' },
  { tier: 3, label: 'ELITE', color: 'var(--tier-elite)', description: 'Crecimiento Viral 500K-1M' },
  { tier: 2, label: 'RISING', color: 'var(--tier-rising)', description: 'Emergentes 100K-500K' },
  { tier: 1, label: 'UNDERGROUND', color: 'var(--tier-underground)', description: 'Nicho < 100K' },
];

// --- Components ---

const NavItem = ({ icon, label, active, onClick, disabled }: any) => (
  <button
    onClick={disabled ? undefined : onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all relative group ${
      disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-app-surface'
    } ${active ? 'text-app-text font-bold' : 'text-app-text-muted'}`}
  >
    {active && <div className="absolute left-0 top-2 bottom-2 w-[2px] bg-app-primary" />}
    <span className={`${active ? 'text-app-primary' : 'group-hover:text-app-text'}`}>{icon}</span>
    <span className="truncate">{label}</span>
  </button>
);

const StatCard = ({ label, value, sub, icon, trend, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`w-full text-left bg-app-surface p-5 border border-app-border relative group overflow-hidden transition-all ${onClick ? 'hover:border-app-primary cursor-pointer' : ''}`}
  >
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-[10px] text-app-text-muted font-mono uppercase tracking-widest mb-1">{label}</p>
        <h3 className="text-2xl font-bold font-display tracking-tighter">{value}</h3>
      </div>
      <div className={`p-2 bg-app-surface2 text-app-text-muted transition-colors ${onClick ? 'group-hover:text-app-primary' : ''}`}>
        {icon}
      </div>
    </div>
    <div className="flex justify-between items-end">
      <p className="text-[10px] text-app-text-muted font-mono">{sub}</p>
      <div className="w-16 h-8">
        <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
          <path
            d={`M ${trend.map((v: number, i: number) => `${(i * 100) / (trend.length - 1)} ${40 - (v / 100) * 30}`).join(' L ')}`}
            fill="none"
            stroke={trend[trend.length-1] > trend[0] ? 'var(--secondary)' : 'var(--primary)'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  </button>
);

const PlatformIcon = ({ name }: { name: string }) => {
  switch (name.toLowerCase()) {
    case 'instagram': return <Instagram size={14} />;
    case 'youtube': return <Youtube size={14} />;
    case 'tiktok': return <Music2 size={14} />;
    case 'soundcloud': return <Share2 size={14} />;
    case 'spotify': return <Music2 size={14} />;
    default: return <Globe size={14} />;
  }
};

const TrendChart = ({ data, color = 'var(--app-primary)' }: { data: number[], color?: string }) => {
  if (!data || data.length < 2) return null;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = range * 0.1;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((val - min + padding) / (range + padding * 2)) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full h-16">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={`M 0,100 L ${points} L 100,100 Z`}
          fill="url(#chartGradient)"
        />
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    </div>
  );
};

const renderDjDetails = (dj: DJ, t: any) => (
  <div className="p-8 border-t border-app-border space-y-8 bg-app-bg/50">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Column 1: Marketing Conclusions */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-app-primary" />
          <p className="text-[10px] text-app-primary font-mono uppercase tracking-widest font-bold">{t('marketingConclusions')}</p>
          {dj.verifiedAt && (
            <span className="ml-auto text-[8px] text-app-text-muted font-mono uppercase">
              {t('lastAnalysis')}: {new Date(dj.verifiedAt).toLocaleDateString()}
            </span>
          )}
        </div>
        <div className="space-y-3">
          {(dj.marketingConclusions || "Análisis pendiente...").split('\n').map((c: string, i: number) => (
            <div key={i} className="flex gap-3 text-xs text-app-text leading-relaxed">
              <span className="text-app-primary font-bold">•</span>
              <p>{c}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Column 2: Performance Metrics */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-app-secondary" />
          <p className="text-[10px] text-app-secondary font-mono uppercase tracking-widest font-bold">{t('impactMetrics')}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-app-surface border border-app-border p-4">
            <p className="text-[9px] text-app-text-muted font-mono uppercase mb-1">{t('recentGrowth')}</p>
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-app-success" />
              <span className="text-lg font-bold font-mono text-app-success">+{dj.recent_growth || (Math.random() * 5).toFixed(1)}%</span>
            </div>
          </div>
          <div className="bg-app-surface border border-app-border p-4">
            <p className="text-[9px] text-app-text-muted font-mono uppercase mb-1">{t('followers')}</p>
            <span className="text-lg font-bold font-mono">{(dj.followers / 1000).toFixed(0)}K</span>
          </div>
        </div>

        <div className="bg-app-surface border border-app-border p-4 space-y-3">
          <p className="text-[9px] text-app-text-muted font-mono uppercase">{t('topPlatforms')}</p>
          <div className="flex flex-wrap gap-2">
            {(dj.topPlatforms || [dj.platform, 'Instagram', 'TikTok']).map((p, i) => (
              <div key={i} className="flex items-center gap-2 px-2 py-1 bg-app-surface2 border border-app-border rounded text-[10px] font-bold">
                <PlatformIcon name={p} />
                {p}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Column 3: Trend Chart */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={14} className="text-app-primary" />
          <p className="text-[10px] text-app-primary font-mono uppercase tracking-widest font-bold">{t('followerTrend')}</p>
        </div>
        <div className="bg-app-surface border border-app-border p-6 h-40 flex flex-col justify-between">
          <TrendChart data={dj.trendData || [70, 72, 75, 74, 78, 82]} />
          <div className="flex justify-between mt-4 text-[8px] font-mono text-app-text-muted uppercase">
            <span>6 Meses atrás</span>
            <span>Hoy</span>
          </div>
        </div>
        <button 
          onClick={() => window.open(`https://instagram.com/${dj.handle.replace('@', '')}`, '_blank')}
          className="w-full py-3 bg-app-surface2 border border-app-border text-[10px] font-bold uppercase tracking-widest hover:bg-app-primary hover:text-white transition-all"
        >
          {t('viewFullProfile')}
        </button>
      </div>
    </div>
  </div>
);

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('Panel de Control');
  const [verifiedDjs, setVerifiedDjs] = useState<any[]>([]);
  const [monitoredDjs, setMonitoredDjs] = useState<any[]>([]);
  const [obsidianNotes, setObsidianNotes] = useState<any[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [manualQueue, setManualQueue] = useState<string[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [liveSignals, setLiveSignals] = useState<ViralSignal[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [wsConnected, setWsConnected] = useState(true);
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline'>('online');
  const [expandedDjRow, setExpandedDjRow] = useState<string | null>(null);
  const [expandedAgentDj, setExpandedAgentDj] = useState<string | null>(null);
  const [expandedTier, setExpandedTier] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('jarvis_notifications');
    return saved ? JSON.parse(saved) : [
      {
        id: '1',
        title: 'Nuevo DJ Detectado',
        message: 'JARVIS ha encontrado un nuevo DJ emergente en Berlín que encaja con tu perfil.',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        type: 'info',
        read: false,
        actionType: 'changeTab',
        actionData: 'Agente 24h'
      },
      {
        id: '2',
        title: 'Alerta de Viralidad',
        message: 'Un set de Amelie Lens está ganando tracción inusual en SoundCloud (+400%).',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        type: 'warning',
        read: false,
        actionType: 'changeTab',
        actionData: 'Panel de Control'
      },
      {
        id: '3',
        title: 'Análisis Semanal Listo',
        message: 'Tu resumen de tendencias de la semana ya está disponible para descargar.',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        type: 'success',
        read: true,
        actionType: 'changeTab',
        actionData: 'Configuración'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('jarvis_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = (title: string, message: string, type: AppNotification['type'] = 'info', actionType?: AppNotification['actionType'], actionData?: string) => {
    const newNotif: AppNotification = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      message,
      timestamp: new Date().toISOString(),
      type,
      read: false,
      actionType,
      actionData
    };
    setNotifications(prev => [newNotif, ...prev]);
    
    // Also add as toast
    const newToast = { id: newNotif.id, title, message, type: type as any };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, 5000);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Refs for click outside
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchSuggestionsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [isSearchSuggestionsOpen, setIsSearchSuggestionsOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('jarvis_search_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [generalSearchResults, setGeneralSearchResults] = useState<any[]>([]);
  const [isSearchingGeneral, setIsSearchingGeneral] = useState(false);
  const [newDjData, setNewDjData] = useState({ name: '', handle: '', platform: 'Instagram' });
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isSyncingNow, setIsSyncingNow] = useState(false);
  const [toasts, setToasts] = useState<{ id: string, title: string, message: string, type: 'success' | 'error' | 'info' }[]>([]);
  const [discoveryStatus, setDiscoveryStatus] = useState<'idle' | 'discovering' | 'verifying' | 'saving'>('idle');
  const [nextDiscoveryIn, setNextDiscoveryIn] = useState<number>(0);
  const [appConfig, setAppConfig] = useState<any>({
    obsidian: {
      vaultPath: '',
      githubSync: {
        enabled: false,
        token: '',
        repo: '',
        branch: 'main',
        pathInRepo: 'notes'
      }
    }
  });
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('jarvis_language');
    if (saved) return saved as Language;
    const browserLang = navigator.language.split('-')[0];
    return (browserLang === 'es' || browserLang === 'en') ? browserLang as Language : 'es';
  });
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('jarvis_theme');
    return (saved as 'dark' | 'light') || 'dark';
  });

  const t = (key: keyof typeof translations.es): string => {
    return (translations[language] as any)[key] || key;
  };

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    localStorage.setItem('jarvis_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('jarvis_language', language);
  }, [language]);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/analytics/config', {
        headers: { 'Authorization': 'Bearer mock_token_for_phase_2' }
      });
      if (res.ok) setAppConfig(await res.json());
    } catch (err) {
      console.error("Error fetching config:", err);
    }
  };

  const saveConfig = async (newConfig: any) => {
    setIsSavingConfig(true);
    try {
      const res = await fetch('/api/analytics/config', {
        method: 'POST',
        headers: { 
          'Authorization': 'Bearer mock_token_for_phase_2',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newConfig)
      });
      if (res.ok) {
        const data = await res.json();
        setAppConfig(data.config);
        addNotification('Configuración Guardada', 'Los ajustes se han guardado correctamente en el servidor.', 'success');
      } else {
        addNotification('Error al Guardar', 'No se pudo guardar la configuración.', 'error');
      }
    } catch (err) {
      console.error("Error saving config:", err);
      addNotification('Error de Sistema', 'Error al intentar guardar la configuración.', 'error');
    } finally {
      setIsSavingConfig(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('jarvis_settings');
    return saved ? JSON.parse(saved) : {
      emailAlerts: false,
      weeklySummary: false,
      criticalAlerts: true
    };
  });

  useEffect(() => {
    localStorage.setItem('jarvis_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.ok ? setBackendStatus('online') : setBackendStatus('offline'))
      .catch(() => setBackendStatus('offline'));
  }, []);

  useEffect(() => {
    if (searchQuery.length > 1) {
      const allDjs = [...monitoredDjs, ...verifiedDjs]
        .filter((dj, index, self) => dj.id && index === self.findIndex((t) => t.id === dj.id));
      const filtered = allDjs.filter(dj => 
        dj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dj.handle.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5);
      setSearchSuggestions(filtered);
      setIsSearchSuggestionsOpen(true);
    } else {
      setSearchSuggestions([]);
      setIsSearchSuggestionsOpen(false);
    }
  }, [searchQuery, monitoredDjs, verifiedDjs]);

  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      setActiveTab('Resultados de Búsqueda');
      setIsSearchSuggestionsOpen(false);
      
      // Update history
      const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10);
      setSearchHistory(newHistory);
      localStorage.setItem('jarvis_search_history', JSON.stringify(newHistory));

      // General search
      setIsSearchingGeneral(true);
      setGeneralSearchResults([]);
      try {
        const prompt = `Search for DJs, labels, or electronic music trends related to "${query}". 
        Return ONLY a JSON array of objects with: name, handle, platform (Instagram/SoundCloud/YouTube), followers (number), trend (up/down/stable), and bio (short string).
        Limit to 6 results.`;
        
        const results = await geminiService.generateJSON(prompt);
        if (results && Array.isArray(results)) {
          setGeneralSearchResults(results);
        }
      } catch (err) {
        console.error("Error in general search:", err);
      } finally {
        setIsSearchingGeneral(false);
      }
    }
  };

  const addDjFromSearch = async (dj: any) => {
    try {
      const res = await fetch('/api/analytics/agent/manual-add', {
        method: 'POST',
        headers: { 
          'Authorization': 'Bearer mock_token_for_phase_2',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: dj.name,
          handle: dj.handle,
          platform: dj.platform,
          followers: dj.followers,
          source: 'manual',
          status: 'queued'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setMonitoredDjs(prev => [...prev, data.dj]);
      }
    } catch (err) {
      console.error("Error adding DJ from search:", err);
    }
  };

  const removeFromSearchHistory = (query: string) => {
    const newHistory = searchHistory.filter(h => h !== query);
    setSearchHistory(newHistory);
    localStorage.setItem('jarvis_search_history', JSON.stringify(newHistory));
  };

  const removeFromGeneralResults = (idx: number) => {
    setGeneralSearchResults(prev => prev.filter((_, i) => i !== idx));
  };

  const fetchAgentData = async () => {
    try {
      const headers = { 'Authorization': 'Bearer mock_token_for_phase_2' };
      const [vRes, oRes, mRes, sRes, sigRes] = await Promise.all([
        fetch('/api/analytics/agent/verified', { headers }),
        fetch('/api/analytics/agent/obsidian', { headers }),
        fetch('/api/analytics/djs', { headers }),
        fetch('/api/analytics/stats', { headers }),
        fetch('/api/analytics/signals/viral', { headers })
      ]);
      if (vRes.ok) {
        const data = await vRes.json();
        setVerifiedDjs(data.filter((dj: any, index: number, self: any[]) => 
          dj.id && index === self.findIndex((t) => t.id === dj.id)
        ));
      }
      if (oRes.ok) setObsidianNotes(await oRes.json());
      if (mRes.ok) {
        const data = await mRes.json();
        setMonitoredDjs(data.filter((dj: any, index: number, self: any[]) => 
          dj.id && index === self.findIndex((t) => t.id === dj.id)
        ));
      }
      if (sRes.ok) setDashboardStats(await sRes.json());
      if (sigRes.ok) setLiveSignals(await sigRes.json());
    } catch (err) {
      console.error("Error fetching agent data:", err);
    }
  };

  useEffect(() => {
    fetchAgentData();
  }, []);

  const processQueue = async () => {
    // Don't start if already busy analyzing
    if (isAnalyzing || analyzingId) return;

    const allDjs = [...monitoredDjs, ...verifiedDjs]
      .filter((dj, index, self) => dj.id && index === self.findIndex((t) => t.id === dj.id));

    // 1. Prioritize MANUAL Queue
    if (manualQueue.length > 0) {
      const nextId = manualQueue[0];
      const djToAnalyze = allDjs.find(d => d.id === nextId);
      if (djToAnalyze) {
        console.log(`Agent Queue: Processing manual request for: ${djToAnalyze.name}`);
        setManualQueue(prev => prev.slice(1));
        await analyzeDj(djToAnalyze);
        return;
      } else {
        // DJ not found, remove from queue
        setManualQueue(prev => prev.slice(1));
      }
    }

    // 2. Prioritize STALE DJs (Need update)
    const staleDjs = allDjs.filter(dj => dj.status === 'stale');
    if (staleDjs.length > 0) {
      console.log(`Agent Queue: Prioritizing stale DJ: ${staleDjs[0].name}`);
      await analyzeDj(staleDjs[0]);
      return;
    }

    // 3. Then QUEUED DJs (Newly added but not analyzed)
    const queuedDjs = allDjs.filter(dj => dj.status === 'queued');
    if (queuedDjs.length > 0) {
      console.log(`Agent Queue: Processing queued DJ: ${queuedDjs[0].name}`);
      await analyzeDj(queuedDjs[0]);
      return;
    }
  };

  useEffect(() => {
    // Small delay to avoid rapid-fire updates
    const timeout = setTimeout(() => {
      processQueue();
    }, 3000);

    return () => clearTimeout(timeout);
  }, [monitoredDjs, verifiedDjs, isAnalyzing, analyzingId, manualQueue]);

  const discoverAndVerify = async () => {
    if (isDiscovering) return;
    setIsDiscovering(true);
    setDiscoveryStatus('discovering');
    try {
      console.log('Frontend Agent: Starting high-efficiency discovery cycle...');
      const headers = { 'Authorization': 'Bearer mock_token_for_phase_2' };
      
      // 1. Get existing names to avoid duplicates
      const namesRes = await fetch('/api/analytics/agent/existing-names', { headers });
      const existingNames = namesRes.ok ? await namesRes.json() : [];

      // 2. Discovery via Gemini (Frontend) - Batch of 5
      const discoveryPrompt = `Suggest 5 real, rising DJs in the hardtechno or techno scene that are NOT in this list: ${existingNames.join(', ')}. 
      Focus on artists with 10k-500k followers who are currently trending in Europe (Blackworks, Verknipt circuit).
      Return ONLY a JSON array of objects: [{ "name": "...", "handle": "...", "platform": "...", "followers": 0, "summary": "..." }]`;

      const discoveryResult = await geminiService.generateJSON(discoveryPrompt);
      if (!Array.isArray(discoveryResult) || discoveryResult.length === 0) {
        setDiscoveryStatus('idle');
        setIsDiscovering(false);
        return;
      }

      setDiscoveryStatus('verifying');
      console.log(`Frontend Agent: Discovered ${discoveryResult.length} candidates. Verifying sequentially...`);

      // 3. Verification via Gemini (Sequential to stay within rate limits)
      const verificationResults = [];
      for (const djData of discoveryResult) {
        try {
          const verificationPrompt = `Verify if the DJ "${djData.name}" (${djData.handle}) is a real, active artist with a professional career in the techno/hardtechno scene. 
          Analyze their impact and provide 3 marketing conclusions for their career.
          Return ONLY a JSON object: { "isReal": true/false, "conclusions": ["...", "...", "..."], "tier": 1-4 }`;
          
          const verification = await geminiService.generateJSON(verificationPrompt);
          verificationResults.push({ ...djData, ...verification });
          
          // Small delay between verifications to be safe
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (e) {
          console.error(`Error verifying ${djData.name}:`, e);
          verificationResults.push(null);
        }
      }

      const verifiedDjs = verificationResults.filter(dj => dj && dj.isReal);
      
      if (verifiedDjs.length > 0) {
        setDiscoveryStatus('saving');
        console.log(`Frontend Agent: ${verifiedDjs.length} DJs verified. Adding to analysis queue...`);
        
        // 4. Save to Backend as QUEUED (Sequential to avoid race conditions on file write)
        for (const dj of verifiedDjs) {
          await fetch('/api/analytics/agent/save-verified', {
            method: 'POST',
            headers: { 
              'Authorization': 'Bearer mock_token_for_phase_2',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              dj: { 
                ...dj, 
                source: 'discovered',
                verifiedAt: new Date().toISOString(),
                status: 'queued' // SEPARATED: Just queue it for later deep analysis
              },
              summary: dj.summary
            })
          });
        }

        addNotification('Potenciales Detectados', `JARVIS ha encontrado ${verifiedDjs.length} nuevos talentos. Se han añadido a la cola de análisis profundo.`, 'success', 'changeTab', 'Agente 24h');
        await fetchAgentData();
      }
    } catch (error) {
      console.error('Discovery Error:', error);
      addNotification('Error de Agente', 'Hubo un problema en el ciclo de descubrimiento automático.', 'error');
    } finally {
      setIsDiscovering(false);
      setDiscoveryStatus('idle');
      setNextDiscoveryIn(120); // Reset countdown (2 mins)
    }
  };

  const triggerManualDiscovery = async () => {
    await discoverAndVerify();
  };

  const analyzeDj = async (dj: any) => {
    // If not already in manual queue and not current, add it
    if (analyzingId !== dj.id && !manualQueue.includes(dj.id)) {
      setManualQueue(prev => [...prev, dj.id]);
      addNotification('Análisis Encolado', `${dj.name} ha sido añadido a la cola de análisis prioritario.`, 'info');
      
      // If agent is idle, trigger processQueue immediately
      if (!analyzingId && !isAnalyzing) {
        setTimeout(processQueue, 100);
      }
      return;
    }
    
    // This part is called by the processQueue when it's time
    setAnalyzingId(dj.id);
    setIsAnalyzing(true);
    try {
      const headers = { 
        'Authorization': 'Bearer mock_token_for_phase_2',
        'Content-Type': 'application/json'
      };

      // 1. Update status to analyzing in backend
      await fetch('/api/analytics/agent/update-status', {
        method: 'POST',
        headers,
        body: JSON.stringify({ id: dj.id, status: 'analyzing' })
      });
      await fetchAgentData();

      console.log(`Deep Analysis: Analyzing ${dj.name} with professional parameters...`);
      const analysisPrompt = `Perform a PROFESSIONAL marketing and competitive analysis for the DJ "${dj.name}" (${dj.handle}) on ${dj.platform || 'Instagram'}.
      
      ANALYZE THE FOLLOWING:
      1. Brand Identity: What is their unique selling proposition (USP)?
      2. Content Strategy: What type of content is driving their current growth?
      3. Audience Sentiment: How is the community reacting to their latest sets/releases?
      4. Market Positioning: Where do they stand compared to Tier 1 artists in their sub-genre?
      
      PROVIDE:
      - 5 Actionable Marketing Conclusions (Professional, strategic, and data-driven).
      - Tier Classification (1: Global Star, 2: Rising Headliner, 3: Emerging Talent, 4: Local/Niche).
      - A comprehensive career summary (150-200 words).
      - Estimated Growth Velocity (Low, Medium, High, Explosive).
      
      Return ONLY a JSON object: { 
        "conclusions": ["...", "...", "...", "...", "..."], 
        "tier": 1-4, 
        "summary": "...",
        "growthVelocity": "..." 
      }`;

      const analysis = await geminiService.generateJSON(analysisPrompt);
      
      // 2. Save/Update in backend
      await fetch('/api/analytics/agent/save-verified', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          dj: { 
            ...dj, 
            tier: analysis.tier, 
            marketingConclusions: analysis.conclusions.join('\n'),
            growthVelocity: analysis.growthVelocity,
            isReal: true,
            verifiedAt: new Date().toISOString(),
            status: 'analyzed'
          },
          summary: analysis.summary || `Análisis profesional de ${dj.name}`
        })
      });

      console.log(`Deep Analysis: ${dj.name} analysis complete.`);
      addNotification('Análisis Profesional Completado', `El análisis profundo de ${dj.name} ha finalizado. Resultados disponibles en su ficha.`, 'success', 'changeTab', 'DJs Monitoreados');
      await fetchAgentData();
    } catch (err) {
      console.error("Error analyzing DJ:", err);
      addNotification('Error de Análisis', `No se pudo completar el análisis de ${dj.name}.`, 'error');
    } finally {
      setAnalyzingId(null);
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    // Run discovery loop every 2 minutes while app is open
    const interval = setInterval(() => {
      discoverAndVerify();
    }, 2 * 60 * 1000);
    
    // Countdown timer for UI
    const countdown = setInterval(() => {
      setNextDiscoveryIn(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    
    // Initial run after a short delay
    const timeout = setTimeout(() => {
      discoverAndVerify();
    }, 5000);

    return () => {
      clearInterval(interval);
      clearInterval(countdown);
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'Agente 24h') {
      fetchAgentData();
    }
  }, [activeTab]);

  const handleAddManualDj = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);
    
    // Capture data before resetting state
    const djToAnalyze = { ...newDjData };
    
    try {
      const headers = { 
        'Authorization': 'Bearer mock_token_for_phase_2',
        'Content-Type': 'application/json'
      };
      
      // 1. Save to monitored list as QUEUED
      const res = await fetch('/api/analytics/agent/save-verified', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          dj: { 
            ...djToAnalyze, 
            source: 'manual',
            verifiedAt: new Date().toISOString(),
            status: 'queued' // Queue it for deep analysis
          },
          summary: `Añadido manualmente: ${djToAnalyze.name}`
        })
      });

      if (res.ok) {
        setIsAddModalOpen(false);
        const addedName = djToAnalyze.name;
        setNewDjData({ name: '', handle: '', platform: 'Instagram' });
        addNotification('DJ Encolado', `${addedName} ha sido añadido a la cola de análisis profundo.`, 'success', 'changeTab', 'Agente 24h');
        await fetchAgentData();
        
        // Trigger processQueue
        setTimeout(processQueue, 100);
      }
    } catch (err) {
      console.error("Error adding manual DJ:", err);
      addNotification('Error', 'No se pudo añadir el DJ a la lista.', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderDashboard = () => (
    <div className="p-8 space-y-8 bg-grid animate-slide-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label={t('monitoredDjs')} 
          value={dashboardStats?.activeDjs || verifiedDjs.length} 
          sub="Seguimiento activo" 
          icon={<Users size={18} />} 
          trend={[20, 40, 35, 50, 45, 60, 75]} 
          onClick={() => setActiveTab('DJs Monitoreados')}
        />
        <StatCard 
          label={t('liveSignals')} 
          value={dashboardStats?.newSignals || liveSignals.length || "28"} 
          sub="Últimas 24h" 
          icon={<Zap size={18} />} 
          trend={[80, 70, 90, 60, 85, 40, 30]} 
          onClick={() => setActiveTab('Señales en Vivo')}
        />
        <StatCard 
          label={t('avgEngagement')} 
          value={dashboardStats?.avgGrowth || "4.2%"} 
          sub="+0.8% vs semana" 
          icon={<TrendingUp size={18} />} 
          trend={[10, 20, 15, 30, 25, 40, 35]} 
          onClick={() => setActiveTab('Comparativas')}
        />
        <StatCard 
          label={t('systemInfo')} 
          value={dashboardStats?.marketHealth || "Óptimo"} 
          sub="Scrapers en línea" 
          icon={<Activity size={18} />} 
          trend={[100, 100, 100, 100, 100, 100, 100]} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-end">
            <h2 className="text-sm font-mono text-app-text-muted uppercase tracking-widest">Monitoreo de DJs</h2>
            <button 
              onClick={() => setActiveTab('DJs Monitoreados')}
              className="text-[10px] text-app-primary font-mono hover:underline"
            >
              Ver todos
            </button>
          </div>
          <div className="bg-app-surface border border-app-border">
            <div className="grid grid-cols-5 p-4 border-b border-app-border text-[10px] font-mono text-app-text-muted uppercase tracking-wider">
              <div className="col-span-2">DJ / Handle</div>
              <div>Tier</div>
              <div>Followers</div>
              <div className="text-right">Acción</div>
            </div>
            <div className="divide-y divide-app-border">
              {(verifiedDjs.length > 0 ? verifiedDjs.slice(0, 6) : MOCK_DJS).map(dj => (
                <div key={dj.id} className="group">
                  <div 
                    className="grid grid-cols-5 p-4 items-center hover:bg-app-surface2 transition-colors cursor-pointer"
                    onClick={() => setExpandedDjRow(expandedDjRow === dj.id ? null : dj.id)}
                  >
                    <div className="col-span-2 flex items-center gap-3">
                      <div className="w-8 h-8 bg-app-surface2 flex items-center justify-center font-bold text-app-primary text-xs">
                        {dj.name.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{dj.name}</p>
                        <p className="text-[10px] text-app-text-muted font-mono">{dj.handle}</p>
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] px-2 py-0.5 border border-app-border font-mono text-app-secondary">T{dj.tier || 1}</span>
                    </div>
                    <div className="text-sm font-mono">{(dj.followers / 1000000).toFixed(1)}M</div>
                    <div className="flex justify-end">
                      <ChevronDown size={16} className={`text-app-text-muted transition-transform ${expandedDjRow === dj.id ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                  <AnimatePresence>
                    {expandedDjRow === dj.id && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-app-bg"
                      >
                        <div className="p-6 border-t border-app-border grid grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <p className="text-[10px] text-app-text-muted font-mono uppercase">Plataformas Activas</p>
                            <div className="flex gap-2">
                              {(dj.topPlatforms || ['Instagram', 'TikTok', 'YouTube']).map((p: string) => (
                                <div key={p} className="p-2 bg-app-surface border border-app-border text-app-secondary">
                                  <PlatformIcon name={p} />
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="text-[10px] text-app-text-muted font-mono uppercase">Engagement Semanal</p>
                            <p className="text-xl font-bold font-mono text-app-secondary">{dj.recent_growth || '8.4'}%</p>
                            <div className="w-full h-1 bg-app-border">
                              <div className="h-full bg-app-secondary" style={{ width: `${Math.min((dj.recent_growth || 8.4) * 10, 100)}%` }}></div>
                            </div>
                          </div>
                          <div className="flex items-center justify-end">
                            <button 
                              disabled={analyzingId === dj.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                analyzeDj(dj);
                              }}
                              className="px-4 py-2 bg-app-primary text-white text-[10px] font-bold uppercase tracking-widest hover:bg-app-primary/80 transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                              {analyzingId === dj.id ? (
                                <Activity size={14} className="animate-spin" />
                              ) : (
                                <Zap size={14} />
                              )}
                              {t('analyzeWithJarvis')}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-mono text-app-text-muted uppercase tracking-widest">Señales Virales</h2>
          <div className="bg-app-surface border border-app-border divide-y divide-app-border">
            {(liveSignals.length > 0 ? liveSignals.slice(0, 5) : MOCK_SIGNALS).map((signal, idx) => (
              <div key={idx} className="p-4 space-y-3 relative group">
                <div className={`absolute left-0 top-0 bottom-0 w-[2px] ${
                  signal.intensity === 'CRITICAL' ? 'bg-app-primary' : 
                  signal.intensity === 'ALTA' ? 'bg-app-warning' : 'bg-app-secondary'
                }`} />
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold">{signal.dj_name}</p>
                    <p className="text-[10px] text-app-text-muted font-mono">{signal.platform} • {signal.timestamp}</p>
                  </div>
                  <span className={`text-[8px] px-1.5 py-0.5 font-mono border ${
                    signal.intensity === 'CRITICAL' ? 'border-app-primary text-app-primary' : 
                    signal.intensity === 'ALTA' ? 'border-app-warning text-app-warning' : 'border-app-secondary text-app-secondary'
                  }`}>
                    {signal.intensity}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-app-secondary font-mono">{signal.growth}</span>
                  <span className="text-[10px] text-app-text-muted uppercase">{signal.type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderLiveSignals = () => (
    <div className="p-8 grid grid-cols-1 lg:grid-cols-10 gap-8 animate-slide-in">
      <div className="lg:col-span-7 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold font-display">Feed de Señales</h2>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-app-surface border border-app-border text-[10px] font-mono text-app-text-muted hover:text-app-text">Exportar</button>
            <button className="px-3 py-1 bg-app-primary text-white text-[10px] font-bold uppercase tracking-widest">Live</button>
          </div>
        </div>
        
        <div className="space-y-4">
          {(liveSignals.length > 0 ? liveSignals : MOCK_SIGNALS).map((signal, idx) => (
            <div key={idx} className="bg-app-surface border border-app-border p-6 flex gap-6 relative group">
              <div className="w-16 h-16 bg-app-surface2 border border-app-border flex items-center justify-center text-app-primary">
                <PlatformIcon name={signal.platform} />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex justify-between">
                  <div>
                    <h3 className="text-lg font-bold">{signal.dj_name}</h3>
                    <p className="text-[10px] text-app-text-muted font-mono uppercase tracking-widest">{signal.platform} • {signal.timestamp}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold font-mono text-app-secondary">{signal.growth}</p>
                    <p className="text-[10px] text-app-text-muted font-mono">Vistas: {signal.views}</p>
                  </div>
                </div>
                <div className="p-3 bg-app-bg border border-app-border text-xs italic text-app-text">
                  Contexto: {signal.context} — {signal.type} detectado con anomalía estadística.
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-1 bg-app-border">
                    <div className="h-full bg-app-primary" style={{ width: '75%' }}></div>
                  </div>
                  <button className="text-[10px] font-bold text-app-primary uppercase tracking-widest hover:underline flex items-center gap-1">
                    Análisis Gemini <ChevronRight size={12} />
                  </button>
                </div>
              </div>
              <div className={`absolute right-0 top-0 bottom-0 w-1 ${
                signal.intensity === 'CRITICAL' ? 'bg-app-primary' : 'bg-app-warning'
              }`} />
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-3 space-y-8">
        <div className="bg-app-surface border border-app-border p-6 space-y-6">
          <h3 className="text-xs font-mono text-app-text-muted uppercase tracking-widest">Filtros de Señal</h3>
          <div className="space-y-4">
            <p className="text-[10px] text-app-text-muted uppercase font-mono">Plataformas</p>
            <div className="flex flex-wrap gap-2">
              {['IG', 'TT', 'YT', 'SC', 'SP'].map(p => (
                <button key={p} className="px-3 py-1 bg-app-surface2 border border-app-border text-[10px] font-mono hover:border-app-secondary transition-colors">{p}</button>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-[10px] text-app-text-muted uppercase font-mono">Intensidad</p>
            <div className="space-y-2">
              {['CRITICAL', 'ALTA', 'MEDIA'].map(i => (
                <label key={i} className="flex items-center gap-2 cursor-pointer group">
                  <div className="w-3 h-3 border border-app-border group-hover:border-app-primary"></div>
                  <span className="text-[10px] font-mono text-app-text-muted group-hover:text-app-text">{i}</span>
                </label>
              ))}
            </div>
          </div>
          <button className="w-full py-3 bg-app-border text-app-text text-[10px] font-bold uppercase tracking-widest hover:bg-app-surface2 transition-colors">
            Limpiar Filtros
          </button>
        </div>

        <div className="bg-app-surface border border-app-border p-6 space-y-4">
          <h3 className="text-xs font-mono text-app-text-muted uppercase tracking-widest">Métricas Hoy</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <p className="text-[10px] text-app-text-muted font-mono">Total Señales</p>
              <p className="text-xl font-bold font-mono">42</p>
            </div>
            <div className="flex justify-between items-end">
              <p className="text-[10px] text-app-text-muted font-mono">Críticas</p>
              <p className="text-xl font-bold font-mono text-app-primary">12</p>
            </div>
          </div>
          <button 
            onClick={() => fetch('/api/scrapers/trigger/all', { method: 'POST' })}
            className="w-full py-3 border border-app-primary text-app-primary text-[10px] font-bold uppercase tracking-widest hover:bg-app-primary hover:text-white transition-all"
          >
            Trigger Scrapers Manual
          </button>
        </div>
      </div>
    </div>
  );

  const renderComparisons = () => (
    <div className="p-8 space-y-12 animate-slide-in">
      <section className="space-y-6">
        <h2 className="text-sm font-mono text-app-text-muted uppercase tracking-widest">Engagement por Tier</h2>
        <div className="bg-app-surface border border-app-border overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-app-border text-[10px] font-mono text-app-text-muted uppercase tracking-wider">
                <th className="p-4">DJ</th>
                <th className="p-4">Tier</th>
                <th className="p-4">Followers</th>
                <th className="p-4">ER%</th>
                <th className="p-4">Top Plataforma</th>
                <th className="p-4">Tendencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border">
              {(verifiedDjs.length > 0 ? verifiedDjs.slice(0, 8) : [
                { name: 'Indira Paganotto', tier: 4, followers: 1200000, recent_growth: 8.4, platform: 'IG', trend: 'up' },
                { name: 'Sara Landry', tier: 3, followers: 950000, recent_growth: 12.1, platform: 'TT', trend: 'up' },
                { name: 'Klangkuenstler', tier: 4, followers: 2100000, recent_growth: 4.2, platform: 'YT', trend: 'stable' },
                { name: 'Oguz', tier: 3, followers: 450000, recent_growth: 15.8, platform: 'IG', trend: 'up' },
              ]).map((row, i) => (
                <tr key={i} className="hover:bg-app-surface2 transition-colors text-sm">
                  <td className="p-4 font-bold">{row.name}</td>
                  <td className="p-4 font-mono text-[10px]">{row.tier === 4 ? 'GOD' : row.tier === 3 ? 'ELITE' : row.tier === 2 ? 'RISING' : 'UNDER'}</td>
                  <td className="p-4 font-mono">{typeof row.followers === 'number' ? `${(row.followers / 1000000).toFixed(1)}M` : row.followers}</td>
                  <td className={`p-4 font-mono font-bold ${(row.recent_growth || 0) > 10 ? 'text-app-secondary' : 'text-app-text'}`}>{row.recent_growth || '0'}%</td>
                  <td className="p-4"><PlatformIcon name={row.platform || 'IG'} /></td>
                  <td className="p-4">
                    {(row.recent_growth || 0) > 5 ? <ArrowUpRight className="text-app-success" size={16} /> : <Activity className="text-app-text-muted" size={16} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <section className="space-y-6">
          <h2 className="text-sm font-mono text-app-text-muted uppercase tracking-widest">Benchmark por Plataforma</h2>
          <div className="bg-app-surface border border-app-border p-8 space-y-8">
            {[
              { label: 'Instagram', value: 85, color: 'var(--primary)' },
              { label: 'TikTok', value: 92, color: 'var(--secondary)' },
              { label: 'YouTube', value: 64, color: 'var(--tier-elite)' },
              { label: 'SoundCloud', value: 45, color: 'var(--warning)' },
            ].map((bar, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono uppercase">
                  <span>{bar.label}</span>
                  <span>{bar.value}%</span>
                </div>
                <div className="h-2 bg-app-bg border border-app-border">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${bar.value}%` }}
                    transition={{ duration: 1, delay: i * 0.1 }}
                    className="h-full" 
                    style={{ backgroundColor: bar.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-sm font-mono text-app-text-muted uppercase tracking-widest">Top Movers</h2>
          <div className="grid grid-cols-1 gap-4">
            {[
              { type: 'Crecimiento', dj: 'Oguz', value: '+520%', icon: <TrendingUp size={16} /> },
              { type: 'Engagement', dj: 'Sara Landry', value: '12.1%', icon: <Activity size={16} /> },
              { type: 'Viralidad', dj: 'Indira Paganotto', value: '847K', icon: <Zap size={16} /> },
            ].map((mover, i) => (
              <div key={i} className="bg-app-surface border border-app-border p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-app-surface2 border border-app-border flex items-center justify-center text-app-primary">
                    {mover.icon}
                  </div>
                  <div>
                    <p className="text-[10px] text-app-text-muted font-mono uppercase">{mover.type}</p>
                    <p className="text-sm font-bold">{mover.dj}</p>
                  </div>
                </div>
                <p className="text-xl font-bold font-mono text-app-secondary">{mover.value}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );

  const renderDjTiers = () => (
    <div className="p-8 space-y-8 animate-slide-in">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold font-display">Niveles de DJ</h2>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 bg-app-surface border border-app-border px-3 py-1">
            <Search size={14} className="text-app-text-muted" />
            <input 
              type="text" 
              placeholder="Filtrar por nombre..." 
              className="bg-transparent border-none outline-none text-xs w-48 font-mono"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-app-primary text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"
          >
            <Plus size={14} /> Añadir DJ
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {TIER_DATA.map(tier => (
          <div key={tier.tier} className="space-y-4">
            <button 
              onClick={() => setExpandedTier(expandedTier === tier.tier ? null : tier.tier)}
              className="w-full text-left bg-app-surface border border-app-border p-6 group hover:border-app-primary transition-colors relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
                <Users size={48} />
              </div>
              <p className="text-[10px] font-mono mb-2" style={{ color: tier.color }}>{tier.label}</p>
              <h3 className="text-4xl font-bold font-display tracking-tighter">{MOCK_DJS.filter(d => d.tier === tier.tier).length}</h3>
              <p className="text-[10px] text-app-text-muted mt-2 font-mono uppercase">{tier.description}</p>
            </button>
            
            <AnimatePresence>
              {expandedTier === tier.tier && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden space-y-2"
                >
                  {MOCK_DJS.filter(d => d.tier === tier.tier).map(dj => (
                    <div key={dj.id} className="p-3 bg-app-surface2 border border-app-border flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold">{dj.name}</p>
                        <p className="text-[9px] text-app-text-muted font-mono">{dj.handle}</p>
                      </div>
                      <p className="text-[10px] font-mono text-app-secondary">{(dj.followers / 1000).toFixed(0)}K</p>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-app-surface border border-app-border w-full max-w-md p-8 space-y-6"
          >
            <h3 className="text-xl font-bold font-display">Añadir Nuevo DJ</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-app-text-muted uppercase">Nombre Artístico</label>
                <input type="text" className="w-full bg-app-bg border border-app-border p-3 text-sm outline-none focus:border-app-primary" placeholder="Ej: Amelie Lens" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-app-text-muted uppercase">Instagram Handle</label>
                <input type="text" className="w-full bg-app-bg border border-app-border p-3 text-sm outline-none focus:border-app-primary" placeholder="@handle" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-app-text-muted uppercase">Tier Inicial</label>
                  <select className="w-full bg-app-bg border border-app-border p-3 text-sm outline-none">
                    <option>1 - Underground</option>
                    <option>2 - Rising</option>
                    <option>3 - Elite</option>
                    <option>4 - God</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-app-text-muted uppercase">Plataforma Base</label>
                  <select className="w-full bg-app-bg border border-app-border p-3 text-sm outline-none">
                    <option>Instagram</option>
                    <option>TikTok</option>
                    <option>YouTube</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 py-3 border border-app-border text-[10px] font-bold uppercase tracking-widest hover:bg-app-surface2"
              >
                Cancelar
              </button>
              <button className="flex-1 py-3 bg-app-primary text-white text-[10px] font-bold uppercase tracking-widest">
                Guardar DJ
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="p-8 max-w-4xl space-y-12 animate-slide-in">
      <section className="space-y-6">
        <h2 className="text-sm font-mono text-app-text-muted uppercase tracking-widest">{t('theme')}</h2>
        <div className="bg-app-surface border border-app-border p-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {theme === 'dark' ? <Moon className="text-app-secondary" /> : <Sun className="text-app-primary" />}
            <div>
              <p className="text-sm font-bold">{theme === 'dark' ? t('darkMode') : t('lightMode')}</p>
              <p className="text-xs text-app-text-muted">{t('themeDescription')}</p>
            </div>
          </div>
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`w-14 h-7 rounded-full p-1 transition-colors ${theme === 'light' ? 'bg-app-primary' : 'bg-app-surface2'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${theme === 'light' ? 'translate-x-7' : 'translate-x-0'}`} />
          </button>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-sm font-mono text-app-text-muted uppercase tracking-widest">{t('language')}</h2>
        <div className="bg-app-surface border border-app-border p-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Languages className="text-app-secondary" />
            <div>
              <p className="text-sm font-bold">{language === 'es' ? 'Español' : 'English'}</p>
              <p className="text-xs text-app-text-muted">{t('languageDescription')}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setLanguage('es')}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${language === 'es' ? 'bg-app-primary text-white' : 'bg-app-surface2 text-app-text-muted hover:text-app-text'}`}
            >
              ES
            </button>
            <button 
              onClick={() => setLanguage('en')}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${language === 'en' ? 'bg-app-primary text-white' : 'bg-app-surface2 text-app-text-muted hover:text-app-text'}`}
            >
              EN
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-sm font-mono text-app-text-muted uppercase tracking-widest">{t('myAccount')}</h2>
        <div className="bg-app-surface border border-app-border p-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-app-surface2 border border-app-border flex items-center justify-center text-2xl font-bold text-app-primary">
              ID
            </div>
            <div>
              <p className="text-lg font-bold">Iago Duran</p>
              <p className="text-sm text-app-text-muted">duranromeraiago@gmail.com</p>
              <div className="mt-2 inline-block px-2 py-0.5 bg-app-secondary/10 border border-app-secondary/20 text-app-secondary text-[8px] font-mono uppercase">
                PRO PLAN ACTIVE
              </div>
            </div>
          </div>
          <button className="px-6 py-2 bg-app-surface2 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-app-surface">
            {t('upgradePlan')}
          </button>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-sm font-mono text-app-text-muted uppercase tracking-widest">{t('obsidianVault')}</h2>
        <div className="bg-app-surface border border-app-border p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-app-text-muted uppercase">{t('localVaultPath')}</label>
            <input 
              type="text" 
              value={appConfig?.obsidian?.vaultPath || ''}
              onChange={(e) => setAppConfig({
                ...appConfig,
                obsidian: { ...(appConfig?.obsidian || {}), vaultPath: e.target.value }
              })}
              className="w-full bg-app-bg border border-app-border p-3 text-xs font-mono text-app-text focus:border-app-secondary outline-none"
              placeholder="/path/to/your/obsidian/vault"
            />
          </div>
          <button 
            onClick={() => saveConfig(appConfig)}
            disabled={isSavingConfig}
            className={`px-6 py-2 bg-app-secondary text-app-bg font-mono text-[10px] font-bold uppercase transition-all ${isSavingConfig ? 'opacity-50 cursor-not-allowed' : 'hover:bg-app-secondary/80'}`}
          >
            {isSavingConfig ? 'Guardando...' : t('savePath')}
          </button>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-sm font-mono text-app-text-muted uppercase tracking-widest">{t('githubSync')}</h2>
        <div className="bg-app-surface border border-app-border p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold">{t('enableSync')}</p>
              <p className="text-xs text-app-text-muted">{t('syncDescription')}</p>
            </div>
            <button 
              onClick={() => {
                const newConfig = {
                  ...appConfig,
                  obsidian: {
                    ...(appConfig?.obsidian || {}),
                    githubSync: { ...(appConfig?.obsidian?.githubSync || {}), enabled: !appConfig?.obsidian?.githubSync?.enabled }
                  }
                };
                setAppConfig(newConfig);
                saveConfig(newConfig);
              }}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${appConfig?.obsidian?.githubSync?.enabled ? 'bg-app-secondary' : 'bg-app-surface2'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${appConfig?.obsidian?.githubSync?.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-app-border">
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-app-text-muted uppercase">{t('githubToken')}</label>
              <input 
                type="password" 
                value={appConfig?.obsidian?.githubSync?.token || ''}
                onChange={(e) => setAppConfig({
                  ...appConfig,
                  obsidian: {
                    ...(appConfig?.obsidian || {}),
                    githubSync: { ...(appConfig?.obsidian?.githubSync || {}), token: e.target.value }
                  }
                })}
                className="w-full bg-app-bg border border-app-border p-3 text-xs font-mono text-app-text focus:border-app-secondary outline-none"
                placeholder="ghp_xxxxxxxxxxxx"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-app-text-muted uppercase">{t('repository')}</label>
              <input 
                type="text" 
                value={appConfig?.obsidian?.githubSync?.repo || ''}
                onChange={(e) => setAppConfig({
                  ...appConfig,
                  obsidian: {
                    ...(appConfig?.obsidian || {}),
                    githubSync: { ...(appConfig?.obsidian?.githubSync || {}), repo: e.target.value }
                  }
                })}
                className="w-full bg-app-bg border border-app-border p-3 text-xs font-mono text-app-text focus:border-app-secondary outline-none"
                placeholder="username/my-obsidian-notes"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-app-text-muted uppercase">{t('branch')}</label>
              <input 
                type="text" 
                value={appConfig?.obsidian?.githubSync?.branch || ''}
                onChange={(e) => setAppConfig({
                  ...appConfig,
                  obsidian: {
                    ...(appConfig?.obsidian || {}),
                    githubSync: { ...(appConfig?.obsidian?.githubSync || {}), branch: e.target.value }
                  }
                })}
                className="w-full bg-app-bg border border-app-border p-3 text-xs font-mono text-app-text focus:border-app-secondary outline-none"
                placeholder="main"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-app-text-muted uppercase">Carpeta en el Repositorio</label>
              <input 
                type="text" 
                value={appConfig?.obsidian?.githubSync?.pathInRepo || ''}
                onChange={(e) => setAppConfig({
                  ...appConfig,
                  obsidian: {
                    ...(appConfig?.obsidian || {}),
                    githubSync: { ...(appConfig?.obsidian?.githubSync || {}), pathInRepo: e.target.value }
                  }
                })}
                className="w-full bg-app-bg border border-app-border p-3 text-xs font-mono text-app-text focus:border-app-secondary outline-none"
                placeholder="ej: notas-obsidian"
              />
              <p className="text-[9px] text-app-text-muted italic">Las notas se guardarán como archivos .md dentro de esta carpeta.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => saveConfig(appConfig)}
              disabled={isSavingConfig}
              className={`flex-1 py-3 bg-app-secondary text-app-bg font-mono text-[10px] font-bold uppercase transition-all ${isSavingConfig ? 'opacity-50 cursor-not-allowed' : 'hover:bg-app-secondary/80'}`}
            >
              {isSavingConfig ? 'Guardando...' : 'Guardar Configuración'}
            </button>
            <button 
              onClick={async () => {
                setIsSyncingNow(true);
                try {
                  const res = await fetch('/api/analytics/sync/now', { 
                    method: 'POST',
                    headers: { 
                      'Authorization': 'Bearer mock_token_for_phase_2',
                      'Content-Type': 'application/json'
                    }
                  });
                  const data = await res.json();
                  if (res.ok && data.success) {
                    addNotification('Sincronización Exitosa', data.message || 'Tus notas se han sincronizado con GitHub.', 'success');
                  } else {
                    addNotification('Error de Sincronización', data.error || 'No se pudo sincronizar. Revisa la configuración.', 'error');
                  }
                } catch (err) {
                  addNotification('Error de Sistema', 'No se pudo contactar con el servicio de sincronización.', 'error');
                } finally {
                  setIsSyncingNow(false);
                }
              }}
              disabled={isSyncingNow}
              className={`px-6 py-3 border border-app-secondary text-app-secondary font-mono text-[10px] font-bold uppercase transition-all ${isSyncingNow ? 'opacity-50 cursor-not-allowed' : 'hover:bg-app-secondary/10'}`}
            >
              {isSyncingNow ? 'Sincronizando...' : 'Sincronizar Ahora'}
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-sm font-mono text-app-text-muted uppercase tracking-widest">Notificaciones</h2>
        <div className="bg-app-surface border border-app-border divide-y divide-app-border">
          {[
            { id: 'emailAlerts', label: 'Alertas por Email', desc: 'Recibe señales críticas en tu bandeja de entrada.' },
            { id: 'weeklySummary', label: 'Resumen Semanal', desc: 'Reporte de tendencias y movers cada lunes.' },
            { id: 'criticalAlerts', label: 'Alertas de Sistema', desc: 'Notificaciones sobre el estado de los scrapers.' },
          ].map(opt => (
            <div key={opt.id} className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">{opt.label}</p>
                <p className="text-xs text-app-text-muted">{opt.desc}</p>
              </div>
              <button 
                onClick={() => setSettings({ ...settings, [opt.id]: !settings[opt.id] })}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${settings[opt.id] ? 'bg-app-primary' : 'bg-app-surface2'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings[opt.id] ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-sm font-mono text-app-text-muted uppercase tracking-widest">Sistema</h2>
        <div className="bg-app-surface border border-app-border p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck size={20} className={backendStatus === 'online' ? 'text-app-secondary' : 'text-app-primary'} />
              <div>
                <p className="text-sm font-bold">Estado del Backend</p>
                <p className="text-xs text-app-text-muted">Conexión con la infraestructura central.</p>
              </div>
            </div>
            <span className={`text-[10px] font-mono font-bold uppercase ${backendStatus === 'online' ? 'text-app-secondary' : 'text-app-primary'}`}>
              {backendStatus === 'online' ? 'Connected ✓' : 'Disconnected ✗'}
            </span>
          </div>
          <div className="pt-6 border-t border-app-border flex justify-between items-center">
            <p className="text-[10px] text-app-text-muted font-mono">JARVIS DJ v0.2.0-beta</p>
            <button className="text-[10px] text-app-primary font-bold uppercase tracking-widest flex items-center gap-2">
              <LogOut size={14} /> Cerrar Sesión
            </button>
          </div>
        </div>
      </section>
    </div>
  );

  const renderAgent = () => (
    <div className="p-8 space-y-8 bg-grid animate-slide-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-display">Agente JARVIS 24h</h2>
          <p className="text-xs text-app-text-muted font-mono mt-1 uppercase tracking-widest">Descubrimiento y Verificación Autónoma</p>
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col items-end px-4 py-2 bg-app-surface border border-app-border min-w-32">
            <span className="text-[8px] text-app-text-muted uppercase font-mono">Descubrimiento</span>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${isDiscovering ? 'bg-app-primary animate-pulse' : 'bg-app-secondary'}`}></div>
              <span className="text-[10px] font-mono font-bold uppercase">
                {discoveryStatus === 'discovering' ? 'Buscando...' : 
                 discoveryStatus === 'verifying' ? 'Verificando...' : 
                 discoveryStatus === 'saving' ? 'Guardando...' : 'Activo'}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end px-4 py-2 bg-app-surface border border-app-border min-w-32">
            <span className="text-[8px] text-app-text-muted uppercase font-mono">Análisis Profundo</span>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${isAnalyzing ? 'bg-app-primary animate-pulse' : 'bg-app-secondary'}`}></div>
              <span className="text-[10px] font-mono font-bold uppercase">
                {isAnalyzing ? 'Analizando...' : 'En Espera'}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end px-4 py-2 bg-app-surface border border-app-border min-w-32">
            <span className="text-[8px] text-app-text-muted uppercase font-mono">Próximo Ciclo</span>
            <span className="text-[10px] font-mono font-bold mt-1">
              {isDiscovering ? 'En proceso...' : `${Math.floor(nextDiscoveryIn / 60)}:${(nextDiscoveryIn % 60).toString().padStart(2, '0')}`}
            </span>
          </div>
          <button 
            onClick={triggerManualDiscovery}
            disabled={isDiscovering}
            className="flex items-center gap-2 px-4 py-2 bg-app-primary text-white font-mono text-[10px] font-bold uppercase hover:bg-app-primary/80 disabled:opacity-50"
          >
            <Zap size={14} className={isDiscovering ? 'animate-pulse' : ''} />
            {isDiscovering ? 'Procesando...' : 'Forzar Descubrimiento'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-app-surface border border-app-border p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-mono text-app-text-muted uppercase tracking-widest">Cola de Análisis Profundo</h3>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-mono text-app-secondary">
                  {manualQueue.length + [...monitoredDjs, ...verifiedDjs].filter(d => d.status === 'queued' || d.status === 'stale').length} Pendientes
                </span>
              </div>
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {/* Currently Analyzing */}
              {[...monitoredDjs, ...verifiedDjs]
                .filter(d => d.status === 'analyzing' || d.id === analyzingId)
                .map(dj => (
                  <div key={`analyzing-${dj.id}`} className="flex justify-between items-center p-3 bg-app-primary/5 border border-app-primary/30">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-app-primary animate-pulse"></div>
                      <span className="text-xs font-bold text-app-primary">{dj.name}</span>
                      <span className="text-[8px] px-1.5 py-0.5 bg-app-primary text-white font-mono uppercase">Analizando...</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-app-primary font-mono italic">JARVIS está trabajando</span>
                    </div>
                  </div>
                ))}

              {/* Manual Queue First */}
              {manualQueue.map(id => {
                const dj = [...monitoredDjs, ...verifiedDjs].find(d => d.id === id);
                if (!dj || dj.status === 'analyzing' || dj.id === analyzingId) return null;
                return (
                  <div key={`manual-${id}`} className="flex justify-between items-center p-3 bg-app-bg border border-app-border/50">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-app-primary"></div>
                      <span className="text-xs font-bold">{dj.name}</span>
                      <span className="text-[8px] px-1.5 py-0.5 border border-app-primary text-app-primary font-mono uppercase">Prioridad</span>
                    </div>
                    <span className="text-[10px] text-app-text-muted font-mono italic">En cola manual...</span>
                  </div>
                );
              })}
              
              {/* Auto Queue */}
              {[...monitoredDjs, ...verifiedDjs]
                .filter(d => (d.status === 'queued' || d.status === 'stale') && !manualQueue.includes(d.id) && d.id !== analyzingId)
                .map(dj => (
                  <div key={`auto-${dj.id}`} className="flex justify-between items-center p-3 bg-app-bg border border-app-border/50">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-app-secondary"></div>
                      <span className="text-xs font-bold">{dj.name}</span>
                      <span className="text-[8px] px-1.5 py-0.5 border border-app-border text-app-text-muted font-mono uppercase">Auto</span>
                    </div>
                    <span className="text-[10px] text-app-text-muted font-mono italic">Esperando turno...</span>
                  </div>
                ))}
                
              {manualQueue.length === 0 && [...monitoredDjs, ...verifiedDjs].filter(d => d.status === 'queued' || d.status === 'stale' || d.status === 'analyzing').length === 0 && (
                <div className="text-center py-8 border border-dashed border-app-border">
                  <p className="text-[10px] text-app-text-muted font-mono uppercase">La cola está vacía</p>
                </div>
              )}
            </div>
          </div>
            {dashboardStats?.queueLength > 0 ? (
              <div className="flex items-center gap-4 p-4 bg-app-surface2 border border-app-border">
                <div className="w-10 h-10 bg-app-primary/10 flex items-center justify-center text-app-primary">
                  <Activity size={20} className="animate-spin" />
                </div>
                <div>
                  <p className="text-xs font-bold">Próximo en cola: {dashboardStats.nextInQueue}</p>
                  <p className="text-[10px] text-app-text-muted font-mono">El agente procesará este perfil automáticamente en el próximo ciclo.</p>
                </div>
              </div>
            ) : (
              <div className="p-4 border border-dashed border-app-border text-center text-[10px] text-app-text-muted font-mono">
                Cola vacía. Añade DJs manualmente o espera al descubrimiento automático.
              </div>
            )}
          
          <h3 className="text-sm font-mono text-app-text-muted uppercase tracking-widest">{t('verifiedDjs')}</h3>
          <div className="bg-app-surface border border-app-border divide-y divide-app-border">
            <AnimatePresence initial={false}>
              {verifiedDjs.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-12 text-center text-app-text-muted font-mono text-xs"
                >
                  {t('searchingTalent')}
                </motion.div>
              ) : (
                verifiedDjs.map((dj, idx) => (
                  <motion.div 
                    key={dj.id || `verified-${idx}`}
                    layout
                    initial={{ height: 0, opacity: 0, y: -20 }}
                    animate={{ height: 'auto', opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="group"
                  >
                    <div 
                      className="p-6 flex justify-between items-center cursor-pointer hover:bg-app-surface2 transition-colors"
                      onClick={() => setExpandedAgentDj(expandedAgentDj === dj.id ? null : dj.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-app-surface2 border border-app-secondary/20 flex items-center justify-center text-app-secondary font-bold text-lg">
                          {dj.name[0]}
                        </div>
                        <div>
                          <h4 className="text-lg font-bold group-hover:text-app-primary transition-colors">{dj.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-[10px] text-app-text-muted font-mono uppercase tracking-widest">{dj.handle}</p>
                            <span className="w-1 h-1 bg-app-surface2 rounded-full" />
                            <span className="text-[9px] px-1.5 py-0.5 border border-app-border font-mono text-app-secondary">T{dj.tier}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <p className="text-[10px] text-app-text-muted font-mono uppercase">{t('verified')}</p>
                          <p className="text-xs font-bold">{new Date(dj.verifiedAt).toLocaleDateString()}</p>
                        </div>
                        <div className={`p-2 bg-app-surface2 border border-app-border text-app-text-muted group-hover:text-app-text transition-all ${expandedAgentDj === dj.id ? 'rotate-180 text-app-primary' : ''}`}>
                          <ChevronDown size={16} />
                        </div>
                      </div>
                    </div>
                    
                    <AnimatePresence>
                      {expandedAgentDj === dj.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden bg-app-bg"
                        >
                          {renderDjDetails(dj, t)}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-sm font-mono text-app-text-muted uppercase tracking-widest">{t('obsidianVault')}</h3>
          <div className="bg-app-surface border border-app-border h-[600px] overflow-y-auto divide-y divide-app-border">
            {obsidianNotes.length === 0 ? (
              <div className="p-12 text-center text-app-text-muted font-mono text-xs">
                {t('noNotes')}
              </div>
            ) : (
              obsidianNotes.map((note, idx) => (
                <div key={idx} className="p-4 hover:bg-app-surface2 cursor-pointer group">
                  <div className="flex items-center gap-3 mb-2">
                    <Share2 size={14} className="text-app-text-muted group-hover:text-app-secondary" />
                    <span className="text-xs font-bold truncate">{note.name}.md</span>
                  </div>
                  <pre className="text-[9px] text-app-text-muted font-mono overflow-hidden h-20 mask-fade">
                    {note.content}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderMonitoredDjs = () => {
    const allDjs = [...monitoredDjs, ...verifiedDjs]
      .filter((dj, index, self) => dj.id && index === self.findIndex((t) => t.id === dj.id));
    
    const generalDjs = allDjs.filter(dj => dj.source === 'discovered');
    const userDjs = allDjs.filter(dj => dj.source === 'manual');

    const renderList = (djs: DJ[], title: string) => (
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <div className="w-1 h-4 bg-app-primary"></div>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-app-text-muted">{title} ({djs.length})</h3>
        </div>
        <div className="bg-app-surface border border-app-border overflow-hidden">
          <div className="grid grid-cols-8 p-4 border-b border-app-border text-[10px] font-mono text-app-text-muted uppercase tracking-wider">
            <div className="col-span-2">{t('djHandle')}</div>
            <div>{t('platform')}</div>
            <div>{t('tiers')}</div>
            <div>{t('followers')}</div>
            <div className="col-span-2">{t('lastAnalysis')}</div>
            <div className="text-right">{t('status')}</div>
          </div>
          <div className="divide-y divide-app-border">
            {djs.length === 0 ? (
              <div className="p-12 text-center text-xs text-app-text-muted font-mono italic">
                No hay DJs en esta categoría
              </div>
            ) : (
              djs.map((dj, idx) => (
                <div key={dj.id || `monitored-${idx}`} className="group">
                  <div 
                    className="grid grid-cols-8 p-4 items-center hover:bg-app-surface2 transition-colors cursor-pointer"
                    onClick={() => setExpandedDjRow(expandedDjRow === dj.id ? null : dj.id)}
                  >
                    <div className="col-span-2 flex items-center gap-3">
                      <div className="w-10 h-10 bg-app-surface2 border border-app-border flex items-center justify-center font-bold text-app-primary text-sm">
                        {dj.name.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{dj.name}</p>
                        <p className="text-[10px] text-app-text-muted font-mono">{dj.handle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <PlatformIcon name={dj.platform} />
                      {dj.platform}
                    </div>
                    <div>
                      <span className={`text-[9px] px-2 py-0.5 border border-app-border font-mono ${dj.tier ? 'text-app-secondary' : 'text-app-text-muted'}`}>
                        {dj.tier ? `T${dj.tier}` : 'PENDIENTE'}
                      </span>
                    </div>
                    <div className="text-sm font-mono">
                      {dj.followers ? `${(dj.followers / 1000000).toFixed(1)}M` : '---'}
                    </div>
                    <div className="col-span-2 text-[10px] font-mono text-app-text-muted">
                      {(dj.verifiedAt || dj.addedAt) ? new Date(dj.verifiedAt || dj.addedAt).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '---'}
                    </div>
                    <div className="flex justify-end gap-2">
                      {(dj.status === 'stale' || !dj.isReal) && (
                        <button 
                          disabled={analyzingId === dj.id || manualQueue.includes(dj.id)}
                          onClick={(e) => {
                            e.stopPropagation();
                            analyzeDj(dj);
                          }}
                          className={`p-1 border transition-all disabled:opacity-50 ${
                            manualQueue.includes(dj.id) 
                              ? 'bg-app-warning/10 text-app-warning border-app-warning/20' 
                              : 'bg-app-primary/10 text-app-primary border-app-primary/20 hover:bg-app-primary hover:text-white'
                          }`}
                          title={manualQueue.includes(dj.id) ? 'En cola prioritario' : (dj.status === 'stale' ? t('reanalyze') : t('analyzeWithJarvis'))}
                        >
                          <Zap size={12} className={analyzingId === dj.id ? 'animate-pulse' : manualQueue.includes(dj.id) ? 'animate-bounce' : ''} />
                        </button>
                      )}
                      <div className={`px-2 py-1 text-[8px] font-mono uppercase ${
                        dj.status === 'analyzed' ? 'bg-app-success/10 text-app-success border border-app-success/20' :
                        dj.status === 'analyzing' ? 'bg-app-primary/10 text-app-primary border border-app-primary/20' :
                        dj.status === 'queued' ? 'bg-app-text-muted/10 text-app-text-muted border border-app-text-muted/20' :
                        dj.status === 'stale' ? 'bg-app-warning/10 text-app-warning border border-app-warning/20' :
                        dj.isReal ? 'bg-app-success/10 text-app-success border border-app-success/20' : 
                        'bg-app-warning/10 text-app-warning border border-app-warning/20'
                      }`}>
                        {dj.status ? t(dj.status) : (dj.isReal ? t('verified') : t('analyzing'))}
                      </div>
                      <div className={`p-1 text-app-text-muted transition-transform ${expandedDjRow === dj.id ? 'rotate-180 text-app-primary' : ''}`}>
                        <ChevronDown size={14} />
                      </div>
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {expandedDjRow === dj.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-app-bg"
                      >
                        {renderDjDetails(dj, t)}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );

    return (
      <div className="p-8 space-y-12 animate-slide-in">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold font-display tracking-tighter">{t('monitoredDjs')}</h2>
            <p className="text-sm text-app-text-muted">{t('listMonitored')}</p>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-6 py-3 bg-app-primary text-white text-xs font-bold uppercase tracking-widest hover:bg-app-primary/80 transition-all flex items-center gap-2"
          >
            <Plus size={16} />
            {t('addDjManually')}
          </button>
        </div>

        <div className="space-y-12">
          {renderList(userDjs, t('myDjs'))}
          {renderList(generalDjs, t('generalDjs'))}
        </div>

        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-app-bg/90 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-app-surface border border-app-border w-full max-w-md p-8 space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold font-display tracking-tight">{t('addDjManually')}</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-app-text-muted hover:text-app-text">
                  <Plus size={20} className="rotate-45" />
                </button>
              </div>
              <form onSubmit={handleAddManualDj} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-app-text-muted uppercase">{t('name')}</label>
                  <input 
                    required
                    type="text" 
                    value={newDjData.name}
                    onChange={(e) => setNewDjData({ ...newDjData, name: e.target.value })}
                    className="w-full bg-app-bg border border-app-border p-3 text-sm focus:border-app-primary outline-none"
                    placeholder="Ej: Amelie Lens"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-app-text-muted uppercase">{t('handle')}</label>
                  <input 
                    required
                    type="text" 
                    value={newDjData.handle}
                    onChange={(e) => setNewDjData({ ...newDjData, handle: e.target.value })}
                    className="w-full bg-app-bg border border-app-border p-3 text-sm focus:border-app-primary outline-none"
                    placeholder="Ej: @amelielens"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-app-text-muted uppercase">{t('platform')}</label>
                  <select 
                    value={newDjData.platform}
                    onChange={(e) => setNewDjData({ ...newDjData, platform: e.target.value })}
                    className="w-full bg-app-bg border border-app-border p-3 text-sm focus:border-app-primary outline-none"
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="TikTok">TikTok</option>
                    <option value="YouTube">YouTube</option>
                    <option value="SoundCloud">SoundCloud</option>
                    <option value="Spotify">Spotify</option>
                  </select>
                </div>
                <button 
                  type="submit"
                  disabled={isAnalyzing}
                  className="w-full py-4 bg-app-primary text-white text-xs font-bold uppercase tracking-widest hover:bg-app-primary/80 transition-all disabled:opacity-50"
                >
                  {isAnalyzing ? t('analyzing') + '...' : t('confirmAdd')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    );
  };

  const renderProfile = () => (
    <div className="p-8 max-w-4xl mx-auto space-y-12 animate-slide-in">
      <div className="flex items-end gap-8">
        <div className="w-32 h-32 bg-app-surface2 border border-app-border flex items-center justify-center text-4xl font-bold text-app-primary">
          ID
        </div>
        <div className="space-y-2 pb-2">
          <h2 className="text-4xl font-bold font-display tracking-tighter">Iago Duran</h2>
          <p className="text-app-primary font-mono text-sm tracking-widest uppercase">PRO ACCESS • Madrid, ES</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <div className="bg-app-surface border border-app-border p-8 space-y-6">
            <h3 className="text-sm font-mono text-app-text-muted uppercase tracking-widest border-b border-app-border pb-4">{t('userSettings')}</h3>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <p className="text-[10px] text-app-text-muted uppercase font-mono">Email</p>
                <p className="text-sm">duranromeraiago@gmail.com</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-app-text-muted uppercase font-mono">Miembro desde</p>
                <p className="text-sm">Enero 2024</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-app-text-muted uppercase font-mono">Plan Actual</p>
                <p className="text-sm font-bold text-app-primary">JARVIS PRO</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-app-text-muted uppercase font-mono">Idioma</p>
                <p className="text-sm uppercase">{language}</p>
              </div>
            </div>
          </div>

          <div className="bg-app-surface border border-app-border p-8 space-y-6">
            <h3 className="text-sm font-mono text-app-text-muted uppercase tracking-widest border-b border-app-border pb-4">Actividad Reciente</h3>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-app-border last:border-0">
                  <div>
                    <p className="text-xs font-bold">Análisis de DJ completado</p>
                    <p className="text-[10px] text-app-text-muted font-mono">Hace {i * 2} horas</p>
                  </div>
                  <ChevronRight size={14} className="text-app-text-muted" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-app-primary p-8 text-white space-y-4">
            <h3 className="text-sm font-mono uppercase tracking-widest opacity-70">Soporte JARVIS</h3>
            <p className="text-xs leading-relaxed">¿Necesitas ayuda con tus análisis o tienes alguna sugerencia para mejorar el Agente?</p>
            <button className="w-full py-3 bg-white text-app-primary text-[10px] font-bold uppercase tracking-widest hover:bg-opacity-90 transition-colors">Contactar</button>
          </div>
          
          <button className="w-full py-4 border border-app-primary text-app-primary text-[10px] font-bold uppercase tracking-widest hover:bg-app-primary hover:text-white transition-all">
            {t('logout')}
          </button>
        </div>
      </div>
    </div>
  );

  const renderSearchResults = () => {
    const allDjs = [...monitoredDjs, ...verifiedDjs]
      .filter((dj, index, self) => dj.id && index === self.findIndex((t) => t.id === dj.id));
    const localResults = allDjs.filter(dj => 
      dj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dj.handle.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="p-8 space-y-12 animate-slide-in">
        {/* Search History */}
        {searchHistory.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-[10px] font-mono text-app-text-muted uppercase tracking-widest">{t('recentSearches')}</h3>
            <div className="flex flex-wrap gap-2">
              {searchHistory.map((h, i) => (
                <div key={i} className="flex items-center gap-2 bg-app-surface border border-app-border px-3 py-1.5 hover:border-app-primary transition-colors group">
                  <button 
                    onClick={() => {
                      setSearchQuery(h);
                      handleSearchSubmit();
                    }}
                    className="text-xs font-medium"
                  >
                    {h}
                  </button>
                  <button 
                    onClick={() => removeFromSearchHistory(h)}
                    className="text-app-text-muted hover:text-app-primary transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-bold font-display tracking-tighter">{t('searchResults')}</h2>
          <p className="text-sm text-app-text-muted">
            {isSearchingGeneral ? t('searchingGeneral') : `${localResults.length + generalSearchResults.length} resultados para "${searchQuery}"`}
          </p>
        </div>

        {/* Local Results Section */}
        {localResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-[10px] font-mono text-app-text-muted uppercase tracking-widest">En tu Biblioteca</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {localResults.map((dj, idx) => (
                <div key={dj.id || idx} className="bg-app-surface border border-app-border p-6 space-y-4 hover:border-app-primary transition-colors group relative">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 bg-app-surface2 border border-app-border flex items-center justify-center font-bold text-app-primary text-lg">
                      {dj.name.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-app-text-muted uppercase">
                      <PlatformIcon name={dj.platform} />
                      {dj.platform}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold group-hover:text-app-primary transition-colors">{dj.name}</h3>
                    <p className="text-xs text-app-text-muted font-mono">{dj.handle}</p>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-app-border">
                    <span className="text-[10px] font-mono text-app-text-muted uppercase">Seguidores</span>
                    <span className="text-sm font-bold font-mono">{dj.followers ? `${(dj.followers / 1000000).toFixed(1)}M` : '---'}</span>
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        setActiveTab('DJs Monitoreados');
                        setExpandedDjRow(dj.id);
                      }}
                      className="p-2 bg-app-bg border border-app-border text-app-primary hover:bg-app-primary hover:text-white transition-all"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* General Search Results Section */}
        {(isSearchingGeneral || generalSearchResults.length > 0) && (
          <div className="space-y-4">
            <h3 className="text-[10px] font-mono text-app-text-muted uppercase tracking-widest">Resultados Globales</h3>
            {isSearchingGeneral ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-app-surface border border-app-border p-6 space-y-4 animate-pulse">
                    <div className="w-12 h-12 bg-app-surface2"></div>
                    <div className="h-4 bg-app-surface2 w-3/4"></div>
                    <div className="h-3 bg-app-surface2 w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {generalSearchResults.map((dj, idx) => {
                  const isAlreadyMonitored = [...monitoredDjs, ...verifiedDjs].some(m => m.handle === dj.handle);
                  return (
                    <div key={idx} className="bg-app-surface border border-app-border p-6 space-y-4 hover:border-app-primary transition-colors group relative">
                      <div className="flex justify-between items-start">
                        <div className="w-12 h-12 bg-app-surface2 border border-app-border flex items-center justify-center font-bold text-app-primary text-lg">
                          {dj.name.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-app-text-muted uppercase">
                          <PlatformIcon name={dj.platform} />
                          {dj.platform}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold group-hover:text-app-primary transition-colors">{dj.name}</h3>
                        <p className="text-xs text-app-text-muted font-mono">{dj.handle}</p>
                        <p className="text-[10px] text-app-text-muted mt-2 line-clamp-2 italic">{dj.bio}</p>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-app-border">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col">
                            <span className="text-[8px] font-mono text-app-text-muted uppercase">Seguidores</span>
                            <span className="text-xs font-bold font-mono">{dj.followers ? `${(dj.followers / 1000000).toFixed(1)}M` : '---'}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[8px] font-mono text-app-text-muted uppercase">Tendencia</span>
                            <span className={`text-xs font-bold font-mono ${dj.trend === 'up' ? 'text-app-secondary' : dj.trend === 'down' ? 'text-app-primary' : 'text-app-text-muted'}`}>
                              {dj.trend === 'up' ? '↑' : dj.trend === 'down' ? '↓' : '→'}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {!isAlreadyMonitored ? (
                            <button 
                              onClick={() => addDjFromSearch(dj)}
                              className="p-2 bg-app-bg border border-app-border text-app-secondary hover:bg-app-secondary hover:text-white transition-all flex items-center gap-2 text-[10px] font-bold uppercase"
                              title={t('addToMonitoring')}
                            >
                              <PlusCircle size={14} />
                            </button>
                          ) : (
                            <div className="p-2 text-app-secondary">
                              <ShieldCheck size={14} />
                            </div>
                          )}
                          <button 
                            onClick={() => removeFromGeneralResults(idx)}
                            className="p-2 bg-app-bg border border-app-border text-app-primary hover:bg-app-primary hover:text-white transition-all"
                            title={t('removeFromResults')}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {localResults.length === 0 && generalSearchResults.length === 0 && !isSearchingGeneral && (
          <div className="py-20 text-center space-y-4">
            <Search size={48} className="mx-auto text-app-border" />
            <p className="text-app-text-muted font-mono italic">No se encontraron resultados globales para "{searchQuery}"</p>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Panel de Control': return renderDashboard();
      case 'DJs Monitoreados': return renderMonitoredDjs();
      case 'Señales en Vivo': return renderLiveSignals();
      case 'Comparativas': return renderComparisons();
      case 'Niveles de DJ': return renderDjTiers();
      case 'Agente 24h': return renderAgent();
      case 'Configuración': return renderSettings();
      case 'Perfil': return renderProfile();
      case 'Resultados de Búsqueda': return renderSearchResults();
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-app-bg text-app-text flex font-sans selection:bg-app-primary/30">
      {/* Sidebar */}
      <aside className="w-64 border-r border-app-border flex flex-col bg-app-bg z-30 sticky top-0 h-screen">
        <div className="p-8 border-b border-app-border">
          <h1 className="text-xl font-bold tracking-tighter flex items-center gap-2 font-display">
            <div className="w-8 h-8 bg-app-primary flex items-center justify-center">
              <Zap className="text-white fill-white" size={18} />
            </div>
            JARVIS DJ
          </h1>
          <p className="text-[10px] text-app-text-muted font-mono mt-2 uppercase tracking-widest">Intelligence v0.2.0</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavItem 
            icon={<LayoutDashboard size={18} />} 
            label={t('dashboard')} 
            active={activeTab === 'Panel de Control'} 
            onClick={() => setActiveTab('Panel de Control')}
          />
          <NavItem 
            icon={<Users size={18} />} 
            label={t('monitoredDjs')} 
            active={activeTab === 'DJs Monitoreados'} 
            onClick={() => setActiveTab('DJs Monitoreados')}
          />
          <NavItem 
            icon={<Activity size={18} />} 
            label={t('liveSignals')} 
            active={activeTab === 'Señales en Vivo'} 
            onClick={() => setActiveTab('Señales en Vivo')}
          />
          <NavItem 
            icon={<BarChart3 size={18} />} 
            label="Comparativas" 
            active={activeTab === 'Comparativas'} 
            onClick={() => setActiveTab('Comparativas')}
          />
          <NavItem 
            icon={<Users size={18} />} 
            label={t('tiers')} 
            active={activeTab === 'Niveles de DJ'} 
            onClick={() => setActiveTab('Niveles de DJ')}
          />
          <NavItem 
            icon={<Zap size={18} />} 
            label={t('agent24h')} 
            active={activeTab === 'Agente 24h'} 
            onClick={() => setActiveTab('Agente 24h')}
          />

          <div className="pt-8 pb-2 px-4">
            <p className="text-[10px] font-mono text-app-text-muted uppercase tracking-widest">Próximamente</p>
          </div>
          <NavItem icon={<TrendingUp size={18} />} label="Mi Carrera" disabled />
          <NavItem icon={<Zap size={18} />} label="Generador de Contenido" disabled />
          <NavItem icon={<Activity size={18} />} label="JARVIS Chat" disabled />
        </nav>

        <div className="p-4 border-t border-app-border">
          <NavItem 
            icon={<SettingsIcon size={18} />} 
            label="Configuración" 
            active={activeTab === 'Configuración'} 
            onClick={() => setActiveTab('Configuración')}
          />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 border-b border-app-border flex items-center justify-between px-8 bg-app-bg/80 backdrop-blur-md sticky top-0 z-20">
          <form 
            ref={searchRef}
            onSubmit={handleSearchSubmit}
            className="flex items-center gap-4 bg-app-surface px-4 py-3 border border-app-border w-full max-w-xl group focus-within:border-app-primary transition-colors relative"
          >
            <Search size={16} className="text-app-text-muted group-focus-within:text-app-primary" />
            <input 
              type="text" 
              placeholder={t('searchPlaceholder')} 
              className="bg-transparent border-none outline-none text-sm w-full font-sans placeholder:text-app-text-muted"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length > 1 && setIsSearchSuggestionsOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearchSubmit();
                  (e.target as HTMLInputElement).blur();
                }
              }}
            />
            
            {/* Search Suggestions Dropdown */}
            <AnimatePresence>
              {isSearchSuggestionsOpen && searchSuggestions.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-app-surface border border-app-border shadow-2xl z-50 overflow-hidden"
                >
                  <div className="p-3 border-b border-app-border bg-app-bg">
                    <p className="text-[10px] font-mono text-app-text-muted uppercase tracking-widest">{t('searchSuggestions')}</p>
                  </div>
                  <div className="divide-y divide-app-border">
                    {searchSuggestions.map((dj, idx) => (
                      <div 
                        key={dj.id || idx}
                        className="p-4 hover:bg-app-surface2 cursor-pointer flex items-center gap-3 transition-colors"
                        onClick={() => {
                          setSearchQuery(dj.name);
                          setActiveTab('Resultados de Búsqueda');
                          setIsSearchSuggestionsOpen(false);
                        }}
                      >
                        <div className="w-8 h-8 bg-app-bg border border-app-border flex items-center justify-center text-[10px] font-bold text-app-primary">
                          {dj.name.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-xs font-bold">{dj.name}</p>
                          <p className="text-[10px] text-app-text-muted font-mono">{dj.handle}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={handleSearchSubmit}
                    className="w-full p-3 text-center text-[10px] font-bold uppercase tracking-widest text-app-primary hover:bg-app-primary hover:text-white transition-all border-t border-app-border"
                  >
                    Ver todos los resultados
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
          
          <div className="flex items-center gap-6">
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-app-surface border border-app-border">
              <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-app-secondary animate-pulse' : 'bg-app-primary'}`}></div>
              <span className="text-[10px] font-mono text-app-text-muted uppercase tracking-widest">{wsConnected ? 'Live Feed' : 'Offline'}</span>
            </div>

            <div className="relative" ref={notificationsRef}>
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`p-2 hover:bg-app-surface2 transition-colors relative group ${isNotificationsOpen ? 'bg-app-surface2 text-app-primary' : ''}`}
              >
                <Bell size={20} className={isNotificationsOpen ? 'text-app-primary' : 'text-app-text-muted group-hover:text-app-text'} />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-app-primary text-white text-[10px] flex items-center justify-center font-bold border-2 border-app-bg">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, x: -100 }}
                    animate={{ opacity: 1, y: 0, x: -100 }}
                    exit={{ opacity: 0, y: 10, x: -100 }}
                    className="absolute top-full right-0 mt-2 w-80 bg-app-surface border border-app-border shadow-2xl z-50"
                  >
                    <div className="p-4 border-b border-app-border flex justify-between items-center bg-app-bg">
                      <h4 className="text-xs font-bold uppercase tracking-widest">{t('notifications')}</h4>
                      <div className="flex gap-3">
                        {notifications.some(n => !n.read) && (
                          <button 
                            onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                            className="text-[10px] text-app-text-muted hover:text-app-primary font-mono uppercase transition-colors"
                          >
                            {t('markAllRead')}
                          </button>
                        )}
                        <button 
                          onClick={clearNotifications}
                          className="text-[10px] text-app-primary font-mono uppercase"
                        >
                          {t('clear')}
                        </button>
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto divide-y divide-app-border">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <Bell size={24} className="mx-auto text-app-text-muted mb-3 opacity-20" />
                          <p className="text-[10px] text-app-text-muted uppercase tracking-widest">{t('noNotifications')}</p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div 
                            key={notif.id}
                            className={`p-4 hover:bg-app-surface2 transition-colors cursor-pointer relative group ${!notif.read ? 'bg-app-primary/5 border-l-2 border-app-primary' : ''}`}
                            onClick={() => {
                              markAsRead(notif.id);
                              if (notif.actionType === 'changeTab' && notif.actionData) {
                                setActiveTab(notif.actionData);
                                setIsNotificationsOpen(false);
                              }
                            }}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <p className={`text-xs font-bold ${!notif.read ? 'text-app-primary' : ''}`}>{notif.title}</p>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notif.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-app-surface transition-all text-app-text-muted hover:text-app-primary"
                              >
                                <X size={12} />
                              </button>
                            </div>
                            <p className="text-[10px] text-app-text-muted mt-1 leading-relaxed">{notif.message}</p>
                            <p className="text-[9px] text-app-text-muted font-mono mt-2 uppercase">
                              {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <button className="w-full p-3 text-center text-[10px] font-bold uppercase tracking-widest text-app-text-muted hover:text-app-primary transition-colors border-t border-app-border">
                        Ver todas las notificaciones
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="flex items-center gap-4 pl-6 border-l border-app-border relative" ref={profileRef}>
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold">Iago Duran</p>
                <p className="text-[10px] text-app-primary font-mono tracking-tighter">PRO ACCESS</p>
              </div>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`w-10 h-10 bg-app-surface2 border border-app-border flex items-center justify-center font-bold text-app-primary text-sm hover:border-app-primary transition-all ${isProfileOpen ? 'border-app-primary ring-2 ring-app-primary/20' : ''}`}
              >
                ID
              </button>

              {/* Profile Dropdown */}
              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full right-0 mt-2 w-48 bg-app-surface border border-app-border shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-app-border bg-app-bg">
                      <p className="text-xs font-bold">Iago Duran</p>
                      <p className="text-[10px] text-app-text-muted font-mono">ID: 884291</p>
                    </div>
                    <div className="p-2">
                      <button 
                        onClick={() => {
                          setActiveTab('Perfil');
                          setIsProfileOpen(false);
                        }}
                        className="w-full flex items-center gap-3 p-2 text-xs hover:bg-app-surface2 transition-colors text-left"
                      >
                        <User size={14} className="text-app-text-muted" />
                        {t('viewProfile')}
                      </button>
                      <button 
                        onClick={() => {
                          setActiveTab('Configuración');
                          setIsProfileOpen(false);
                        }}
                        className="w-full flex items-center gap-3 p-2 text-xs hover:bg-app-surface2 transition-colors text-left"
                      >
                        <SettingsIcon size={14} className="text-app-text-muted" />
                        {t('userSettings')}
                      </button>
                    </div>
                    <div className="p-2 border-t border-app-border">
                      <button className="w-full flex items-center gap-3 p-2 text-xs hover:bg-app-primary/10 hover:text-app-primary transition-colors text-left">
                        <LogOut size={14} />
                        {t('logout')}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {renderContent()}
        </div>
      </main>

      {/* Toasts */}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-4">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className={`p-4 min-w-80 shadow-2xl border-l-4 flex items-start gap-4 ${
                toast.type === 'success' ? 'bg-app-bg border-app-secondary' : 
                toast.type === 'error' ? 'bg-app-bg border-app-primary' : 
                'bg-app-bg border-app-text-muted'
              }`}
            >
              <div className="flex-1">
                <p className={`text-xs font-bold uppercase tracking-widest ${
                  toast.type === 'success' ? 'text-app-secondary' : 
                  toast.type === 'error' ? 'text-app-primary' : 
                  'text-app-text'
                }`}>{toast.title}</p>
                <p className="text-[10px] text-app-text-muted mt-1">{toast.message}</p>
              </div>
              <button 
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-app-text-muted hover:text-app-text"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
