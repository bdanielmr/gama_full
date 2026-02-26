export type Item = {
  id: string;
  nombre: string;
  rareza?: 'comun' | 'rara' | 'epica';
  icono?: string;
  efecto?: 'ticket_x2' | 'descuento_inicio';
};

export type Stage = {
  id: number;
  x: number;
  y: number;
  estado: 'locked' | 'unlocked' | 'active' | 'completed';
  tipo: string;
  enCurso?: boolean;
  cofre?: 'none' | 'closed' | 'open';
};

export type GameEventMessage = {
  type: 'event';
  name: string;
  data: Record<string, any>;
};

export type PatchMessage = {
  type: 'patch';
  patch: Record<string, any>;
};

export type WorldTemplate = {
  version: string;
  narrativa: {
    id: string;
    titulo: string;
    tema: string;
  };
  assets: {
    background: string;
    sprites: Record<string, string>;
  };
  economy: {
    currencyName: string;
    startStageCost: number;
    chestCost: number;
    energyCost: number;
    energyMax: number;
    energyRegenSeconds: number;
    stageRewardRange: { min: number; max: number };
  };
  player: {
    id: string;
    nombre: string;
    nivel: number;
    xp: number;
    fichas: number;
    energia: number;
    energiaMax: number;
    energyUpdatedAt: string;
    currentStage: number;
    posicion: { stageId: number };
    inventory: {
      recompensas: Item[];
      promociones: Item[];
    };
    retoDelDia: {
      descripcion: string;
      progreso: number;
      total: number;
      reclamado: boolean;
    };
  };
  world: {
    id: string;
    stages: Stage[];
    currentStage: number;
    stageEnCurso: boolean;
    casino: { x: number; y: number; estado: 'locked' | 'unlocked' };
    props: {
      pathCurvePoints: Array<{ x: number; y: number }>;
    };
    npc: { x: number; y: number; nombre: string };
    board: { x: number; y: number };
    book: { x: number; y: number };
  };
  misiones: {
    activas: Array<{
      id: string;
      titulo: string;
      descripcion: string;
      progreso: number;
      total: number;
      reclamada: boolean;
    }>;
  };
  ui: {
    popup: 'missions' | 'inventory' | 'events' | null;
    toasts: Array<{ id: string; tipo: string; texto: string }>;
    hud: {
      fichasCounter: { x: number; y: number };
      energiaCounter: { x: number; y: number };
    };
    dock: {
      mochila: { x: number; y: number };
      casino: { x: number; y: number };
      tienda: { x: number; y: number };
    };
    popups: {
      bgColor: string;
      borderColor: string;
    };
  };
  layout: {
    components: Array<{ id: string; component?: string; type?: string; props?: Record<string, any> }>;
  };
  interactions: Record<string, { payload: string[] }>;
};

export type ActionRequest = {
  action: string;
  payload?: any;
};
