import { Application, Assets, Container, Graphics, Sprite, Text, TextStyle } from 'pixi.js';
import type { GameEventMessage, Item, Stage, WorldTemplate } from '../types';

type DispatchAction = (action: string, payload?: any) => void;

type StageVisual = {
  id: number;
  container: Container;
  glow: Graphics;
  body: Graphics;
  label: Text;
};

type FloatingToast = {
  id: string;
  container: Container;
  life: number;
};

type CoinParticle = {
  sprite: Graphics;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  t: number;
};


type StagePassFx = {
  runner: Container;
  runnerBody: Graphics;
  slash: Graphics;
  impact: Graphics;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  t: number;
  duration: number;
  impactShown: boolean;
};

export class PixiWorld {
  private app: Application | null = null;
  private host: HTMLDivElement | null = null;
  private currentState: WorldTemplate | null = null;

  private logicalSize = { width: 720, height: 860 };
  private sourceWorldSize = { width: 1040, height: 620 };
  private worldViewport = { x: 52, y: 126, width: 616, height: 610 };

  private root = new Container();
  private worldLayer = new Container();
  private uiLayer = new Container();
  private popupLayer = new Container();
  private fxLayer = new Container();

  private bg = new Graphics();
  private stars = new Graphics();
  private ground = new Graphics();
  private path = new Graphics();
  private fadeOverlay = new Graphics();

  private player = new Container();
  private playerBody = new Graphics();
  private playerSpriteIdle: Sprite | null = null;
  private playerSpriteWalk: Sprite | null = null;
  private playerSpriteKey = '';
  private playerSpriteLoading = false;
  private playerSpriteFailedKey = '';
  private jumpSpriteTexture: any | null = null;
  private jumpSpriteKey = '';
  private jumpSpriteLoading = false;
  private playerLabel = new Text({ text: '', style: new TextStyle({ fill: '#ecfeff', fontSize: 14, fontWeight: 'bold' }) });
  private backpack = new Graphics();

  private book = new Container();
  private bookBody = new Graphics();
  private bookLabel = new Text({ text: 'MISIONES', style: new TextStyle({ fill: '#ffee99', fontSize: 12, fontWeight: 'bold' }) });

  private board = new Container();
  private boardBody = new Graphics();
  private boardLabel = new Text({ text: 'EVENTOS', style: new TextStyle({ fill: '#d6f6ff', fontSize: 12, fontWeight: 'bold' }) });

  private npc = new Container();
  private npcBody = new Graphics();
  private npcLabel = new Text({ text: 'GUIA', style: new TextStyle({ fill: '#fef3c7', fontSize: 10, fontWeight: 'bold' }) });

  private casino = new Container();
  private casinoGlow = new Graphics();
  private casinoBody = new Graphics();
  private casinoLabel = new Text({ text: 'GRAN CASINO', style: new TextStyle({ fill: '#ffe8a3', fontSize: 16, fontWeight: 'bold' }) });
  private casinoHomeSprite: Sprite | null = null;
  private casinoHomeSpriteKey = '';
  private casinoHomeSpriteLoading = false;

  private hudTop = new Container();
  private avatarDot = new Graphics();
  private levelText = new Text({ text: '', style: new TextStyle({ fill: '#fef3c7', fontSize: 18, fontWeight: 'bold' }) });
  private xpBarBg = new Graphics();
  private xpBarFill = new Graphics();
  private fichasText = new Text({ text: '', style: new TextStyle({ fill: '#fef3c7', fontSize: 18, fontWeight: 'bold' }) });
  private energiaText = new Text({ text: '', style: new TextStyle({ fill: '#dbeafe', fontSize: 18, fontWeight: 'bold' }) });
  private energiaBarBg = new Graphics();
  private energiaBarFill = new Graphics();
  private retoText = new Text({ text: '', style: new TextStyle({ fill: '#fde68a', fontSize: 14, fontWeight: '600' }) });
  private retoBarBg = new Graphics();
  private retoBarFill = new Graphics();

  private dock = new Container();
  private dockBg = new Graphics();
  private dockMochila = new Container();
  private dockCasino = new Container();
  private dockTienda = new Container();

  private popup = new Container();
  private popupBg = new Graphics();
  private popupTitle = new Text({ text: '', style: new TextStyle({ fill: '#f8fafc', fontSize: 22, fontWeight: 'bold' }) });
  private popupBody = new Container();
  private popupClose = new Container();
  private restartButton = new Container();

  private stageVisuals = new Map<number, StageVisual>();
  private toasts = new Map<string, FloatingToast>();
  private seenToastIds = new Set<string>();
  private coinParticles: CoinParticle[] = [];
  private stagePassFx: StagePassFx[] = [];

  private inventoryTab: 'recompensas' | 'promociones' = 'recompensas';
  private lastPopup: WorldTemplate['ui']['popup'] = null;
  private lastEventIndex = 0;

  private playerTarget = { x: 140, y: 360 };
  private elapsed = 0;
  private energyFlash = 0;
  private worldFade = 0;
  private isPlayerMoving = false;
  private stagePassPlayerHidden = false;
  private casinoTransitionHidden = false;
  private enterCasinoPending = false;
  private lastWorldId = '';

  private onResize = () => this.resizeToHost();
  private resizeObserver: ResizeObserver | null = null;

  constructor(private dispatchAction: DispatchAction) {}

  async mount(host: HTMLDivElement, state: WorldTemplate) {
    if (this.app) {
      return;
    }

    this.host = host;
    this.currentState = state;
    this.lastWorldId = state.world?.id || '';

    const app = new Application();
    await app.init({
      width: Math.max(host.clientWidth, 1),
      height: Math.max(host.clientHeight, 1),
      antialias: true,
      background: '#050915',
    });

    this.app = app;
    host.innerHTML = '';
    host.appendChild(app.canvas);

    this.root.addChild(this.bg);
    this.root.addChild(this.stars);
    this.root.addChild(this.path);
    this.root.addChild(this.worldLayer);
    this.root.addChild(this.uiLayer);
    this.root.addChild(this.popupLayer);
    this.root.addChild(this.fxLayer);
    this.root.addChild(this.fadeOverlay);

    this.popupLayer.addChild(this.popup);
    this.popup.addChild(this.popupBg);
    this.popup.addChild(this.popupTitle);
    this.popup.addChild(this.popupBody);
    this.popup.addChild(this.popupClose);

    app.stage.addChild(this.root);

    this.worldLayer.sortableChildren = true;

    this.createBackground();
    this.createWorldObjects(state);
    this.createHud();
    this.createDock();
    this.createPopupSkeleton();
    this.createStages(state.world.stages);

    this.update(state);

    this.resizeToHost();
    window.addEventListener('resize', this.onResize);

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.resizeToHost());
      this.resizeObserver.observe(host);
      if (host.parentElement) {
        this.resizeObserver.observe(host.parentElement);
      }
    }

    this.attachTicker();
  }

  update(state: WorldTemplate) {
    const worldId = state.world?.id || '';
    if (this.lastWorldId && worldId && this.lastWorldId !== worldId) {
      this.enterCasinoPending = false;
      this.casinoTransitionHidden = false;
      this.backpack.visible = true;
      this.syncPlayerVisibility();
    }
    this.lastWorldId = worldId;

    this.currentState = state;
    if (!this.app) {
      return;
    }

    this.applyWorldTheme(state.player?.nivel || 1);
    this.updatePath(state.world.props.pathCurvePoints || state.world.stages);
    this.updateStages(state.world.stages);
    this.updatePlayer(state);
    this.updateHud(state);
    this.updateWorldObjects(state);
    this.updateDock(state);
    this.updatePopup(state);
    this.syncToasts(state.ui.toasts);
  }

  handleEvents(events: GameEventMessage[]) {
    if (events.length < this.lastEventIndex) {
      this.lastEventIndex = 0;
    }

    for (let i = this.lastEventIndex; i < events.length; i += 1) {
      this.handleEvent(events[i]);
    }
    this.lastEventIndex = events.length;
  }

  destroy() {
    window.removeEventListener('resize', this.onResize);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    if (this.app) {
      try {
        this.app.destroy();
      } catch {
        // noop
      }
      this.app = null;
    }

    this.removePlayerSprites();
    this.removeCasinoHomeSprite();
    this.stageVisuals.clear();
    this.toasts.clear();
    this.seenToastIds.clear();
    this.coinParticles = [];
    this.stagePassFx = [];
    this.enterCasinoPending = false;
    this.casinoTransitionHidden = false;
    this.backpack.visible = true;
    this.setPlayerVisibilityForStagePass(false);
    this.currentState = null;
    this.host = null;
    this.lastEventIndex = 0;
  }

  private resizeToHost() {
    if (!this.app || !this.host) {
      return;
    }

    const hostRect = this.host.getBoundingClientRect();
    const parentRect = this.host.parentElement?.getBoundingClientRect();

    let width = Math.round(hostRect.width || parentRect?.width || 0);
    if (width < 320) {
      width = Math.max(320, Math.round(parentRect?.width || 320));
      this.host.style.width = '100%';
    }

    let height = Math.round(hostRect.height || parentRect?.height || 0);
    if (height < 220) {
      const fallbackHeight = Math.max(500, Math.min(Math.round((width * 860) / 720), 900));
      this.host.style.height = `${fallbackHeight}px`;
      this.host.style.minHeight = `${fallbackHeight}px`;
      height = fallbackHeight;
    }

    this.app.renderer.resize(width, height);

    const scale = Math.min(width / this.logicalSize.width, height / this.logicalSize.height);
    this.root.scale.set(scale);
    this.root.x = (width - this.logicalSize.width * scale) / 2;
    this.root.y = (height - this.logicalSize.height * scale) / 2;
  }

  private createBackground() {
    this.bg.rect(0, 0, this.logicalSize.width, this.logicalSize.height);
    this.bg.fill({ color: 0x08142a });

    for (let i = 0; i < 130; i += 1) {
      const x = Math.random() * this.logicalSize.width;
      const y = Math.random() * this.logicalSize.height * 0.6;
      const r = Math.random() * 1.7 + 0.4;
      this.stars.circle(x, y, r);
      this.stars.fill({ color: 0x9fc5ff, alpha: Math.random() * 0.75 + 0.2 });
    }

    this.worldLayer.addChild(this.ground);
    this.applyWorldTheme(this.currentState?.player?.nivel || 1);

    this.fadeOverlay.rect(0, 0, this.logicalSize.width, this.logicalSize.height);
    this.fadeOverlay.fill({ color: 0x000000, alpha: 1 });
    this.fadeOverlay.alpha = 0;
  }

  private applyWorldTheme(level: number) {
    const isDarkGreen = Number(level || 1) >= 2;

    this.bg.clear();
    this.bg.rect(0, 0, this.logicalSize.width, this.logicalSize.height);
    this.bg.fill({ color: isDarkGreen ? 0x10291d : 0x08142a });

    this.ground.clear();
    this.ground.roundRect(20, 150, this.logicalSize.width - 40, this.logicalSize.height - 240, 28);
    this.ground.fill({ color: isDarkGreen ? 0x163629 : 0x0d1b33, alpha: 0.88 });
    this.ground.stroke({ color: isDarkGreen ? 0x2d6a4f : 0x2e3f6b, width: 2 });
  }

  private createWorldObjects(state: WorldTemplate) {
    this.playerBody.roundRect(-20, -34, 40, 62, 12);
    this.playerBody.fill({ color: 0x4cc9f0, alpha: 0.95 });
    this.playerBody.stroke({ color: 0xa5f3fc, width: 2.2 });

    this.backpack.roundRect(-9, -9, 20, 26, 6);
    this.backpack.fill({ color: 0x8d5524 });
    this.backpack.stroke({ color: 0xe8b27e, width: 2 });
    this.backpack.x = -22;
    this.backpack.y = -10;
    this.backpack.eventMode = 'static';
    this.backpack.cursor = 'pointer';
    this.backpack.on('pointertap', () => this.dispatchAction('toggleMochila', {}));

    this.playerLabel.anchor.set(0.5, 0);
    this.playerLabel.x = 0;
    this.playerLabel.y = 34;

    this.player.addChild(this.playerBody);
    this.player.addChild(this.backpack);
    this.player.addChild(this.playerLabel);
    this.player.zIndex = 60;
    this.worldLayer.addChild(this.player);

    this.ensurePlayerSprites(state);
    this.ensureJumpSpriteTexture(state);

    this.bookBody.roundRect(-36, -26, 72, 52, 10);
    this.bookBody.fill({ color: 0x6d4c41, alpha: 0.95 });
    this.bookBody.stroke({ color: 0xffd166, width: 2 });
    this.bookLabel.anchor.set(0.5);
    this.book.addChild(this.bookBody);
    this.book.addChild(this.bookLabel);
    this.book.eventMode = 'static';
    this.book.cursor = 'pointer';
    this.book.on('pointertap', () => this.dispatchAction('abrirMisiones', {}));
    this.uiLayer.addChild(this.book);

    this.boardBody.roundRect(-40, -25, 80, 50, 10);
    this.boardBody.fill({ color: 0x374151, alpha: 0.95 });
    this.boardBody.stroke({ color: 0x93c5fd, width: 2 });
    this.boardLabel.anchor.set(0.5);
    this.board.addChild(this.boardBody);
    this.board.addChild(this.boardLabel);
    this.board.eventMode = 'static';
    this.board.cursor = 'pointer';
    this.board.on('pointertap', () => this.dispatchAction('abrirEventos', {}));
    this.uiLayer.addChild(this.board);

    this.npcBody.circle(0, 0, 18);
    this.npcBody.fill({ color: 0xf59e0b, alpha: 0.9 });
    this.npcBody.stroke({ color: 0xfef3c7, width: 2 });
    this.npcLabel.anchor.set(0.5, 0);
    this.npcLabel.y = 20;
    this.npc.addChild(this.npcBody);
    this.npc.addChild(this.npcLabel);
    this.npc.visible = false;

    this.casinoGlow.circle(0, 0, 92);
    this.casinoGlow.fill({ color: 0xffd166, alpha: 0.2 });

    this.casinoBody.roundRect(-72, -58, 144, 116, 18);
    this.casinoBody.fill({ color: 0x5f6673, alpha: 0.9 });
    this.casinoBody.stroke({ color: 0xb0b7c3, width: 3 });

    this.casinoLabel.anchor.set(0.5);

    this.casino.addChild(this.casinoGlow);
    this.casino.addChild(this.casinoBody);
    this.casino.addChild(this.casinoLabel);
    this.casino.eventMode = 'static';
    this.casino.cursor = 'pointer';
    this.casino.on('pointertap', () => this.onCasinoClick());
    this.casino.zIndex = 25;
    this.worldLayer.addChild(this.casino);

    this.ensureCasinoHomeSprite(state);
  }

  private createHud() {
    const hudBg = new Graphics();
    hudBg.roundRect(20, 14, 680, 120, 14);
    hudBg.fill({ color: 0x0b1020, alpha: 0.88 });
    hudBg.stroke({ color: 0xffd166, width: 1.6, alpha: 0.72 });

    this.avatarDot.circle(0, 0, 18);
    this.avatarDot.fill({ color: 0x38bdf8, alpha: 0.9 });
    this.avatarDot.x = 52;
    this.avatarDot.y = 52;

    this.levelText.x = 82;
    this.levelText.y = 26;

    this.xpBarBg.roundRect(82, 50, 160, 12, 6);
    this.xpBarBg.fill({ color: 0x111827, alpha: 0.95 });
    this.xpBarBg.stroke({ color: 0x64748b, width: 1.2 });

    this.fichasText.x = 270;
    this.fichasText.y = 26;

    this.energiaText.x = 470;
    this.energiaText.y = 26;

    this.energiaBarBg.roundRect(470, 50, 178, 10, 5);
    this.energiaBarBg.fill({ color: 0x111827, alpha: 0.95 });
    this.energiaBarBg.stroke({ color: 0x64748b, width: 1.2 });

    this.retoText.x = 82;
    this.retoText.y = 82;

    this.retoBarBg.roundRect(82, 104, 566, 10, 5);
    this.retoBarBg.fill({ color: 0x111827, alpha: 0.95 });
    this.retoBarBg.stroke({ color: 0x64748b, width: 1.2 });

    this.hudTop.addChild(hudBg);
    this.hudTop.addChild(this.avatarDot);
    this.hudTop.addChild(this.levelText);
    this.hudTop.addChild(this.xpBarBg);
    this.hudTop.addChild(this.xpBarFill);
    this.hudTop.addChild(this.fichasText);
    this.hudTop.addChild(this.energiaText);
    this.hudTop.addChild(this.energiaBarBg);
    this.hudTop.addChild(this.energiaBarFill);
    this.hudTop.addChild(this.retoText);
    this.hudTop.addChild(this.retoBarBg);
    this.hudTop.addChild(this.retoBarFill);

    this.restartButton = this.makeDockButton('REINICIO', () => this.dispatchAction('reiniciarJuego', {}), 94, 36);
    this.restartButton.x = 650;
    this.restartButton.y = 50;
    this.hudTop.addChild(this.restartButton);

    this.uiLayer.addChild(this.hudTop);
  }

  private createDock() {
    this.dockBg.roundRect(190, 760, 340, 84, 18);
    this.dockBg.fill({ color: 0x0b1020, alpha: 0.9 });
    this.dockBg.stroke({ color: 0xffd166, width: 1.8, alpha: 0.82 });
    this.dock.addChild(this.dockBg);

    this.dockMochila = this.makeDockButton('MOCHILA', () => this.dispatchAction('toggleMochila', {}));
    this.dockCasino = this.makeDockButton('CASINO', () => this.dispatchAction('entrarCasino', {}));
    this.dockTienda = this.makeDockButton('TIENDA', () => this.dispatchAction('abrirEventos', {}));

    this.dock.addChild(this.dockMochila);
    this.dock.addChild(this.dockCasino);
    this.dock.addChild(this.dockTienda);

    this.uiLayer.addChild(this.dock);
  }

  private createPopupSkeleton() {
    const closeBtn = this.makeDockButton('X', () => {
      const popup = this.currentState?.ui.popup;
      if (popup === 'inventory') {
        this.dispatchAction('toggleMochila', {});
      }
      if (popup === 'missions') {
        this.dispatchAction('abrirMisiones', {});
      }
      if (popup === 'events') {
        this.dispatchAction('abrirEventos', {});
      }
    }, 44, 34);
    this.popupClose.removeChildren();
    this.popupClose.addChild(closeBtn);
  }

  private createStages(stages: Stage[]) {
    this.removePlayerSprites();
    this.removeCasinoHomeSprite();
    this.stageVisuals.clear();
    for (const stage of stages) {
      const container = new Container();
      const glow = new Graphics();
      const body = new Graphics();
      const label = new Text({
        text: String(stage.id),
        style: new TextStyle({ fill: '#ffffff', fontSize: 15, fontWeight: 'bold' }),
      });

      label.anchor.set(0.5);
      glow.circle(0, 0, 30);
      glow.fill({ color: 0x70d6ff, alpha: 0.16 });

      container.addChild(glow);
      container.addChild(body);
      container.addChild(label);
      const mapped = this.mapWorldPoint(stage.x, stage.y);
      container.x = mapped.x;
      container.y = mapped.y;
      container.zIndex = 20;
      container.eventMode = 'static';
      container.cursor = 'pointer';
      container.on('pointertap', () => this.onStageClick(stage.id));

      this.worldLayer.addChild(container);
      this.stageVisuals.set(stage.id, { id: stage.id, container, glow, body, label });
    }
  }

  private onCasinoClick() {
    const state = this.currentState;
    if (!state) {
      return;
    }

    if (state.world.casino.estado !== 'unlocked') {
      this.dispatchAction('entrarCasino', {});
      return;
    }

    if (this.enterCasinoPending) {
      return;
    }

    const casinoPos = this.mapWorldPoint(state.world.casino.x, state.world.casino.y);
    this.playerTarget = { x: casinoPos.x - 24, y: casinoPos.y + 14 };
    this.enterCasinoPending = true;
  }

  private onStageClick(stageId: number) {
    const state = this.currentState;
    if (!state) {
      return;
    }

    const stage = state.world.stages.find((item) => item.id === stageId);
    if (!stage || stage.estado === 'locked') {
      return;
    }

    if (stage.estado === 'active') {
      // Single-click flow handled authoritatively by BFF.
      this.dispatchAction('resolverStage', { stageId: stage.id });
      return;
    }

    if (stage.estado === 'completed' && stage.cofre === 'closed') {
      this.dispatchAction('abrirCofre', { stageId: stage.id });
    }
  }

  private updatePath(points: Array<{ x: number; y: number }>) {
    this.path.clear();
    if (!points.length) {
      return;
    }

    const first = this.mapWorldPoint(points[0].x, points[0].y);
    this.path.moveTo(first.x, first.y);
    for (let i = 1; i < points.length; i += 1) {
      const p = this.mapWorldPoint(points[i].x, points[i].y);
      this.path.lineTo(p.x, p.y);
    }
    this.path.stroke({ color: 0x2f83f7, width: 10, alpha: 0.22 });

    this.path.moveTo(first.x, first.y);
    for (let i = 1; i < points.length; i += 1) {
      const p = this.mapWorldPoint(points[i].x, points[i].y);
      this.path.lineTo(p.x, p.y);
    }
    this.path.stroke({ color: 0xffd166, width: 2.3, alpha: 0.72 });
  }

  private updateStages(stages: Stage[]) {
    for (const stage of stages) {
      const visual = this.stageVisuals.get(stage.id);
      if (!visual) {
        continue;
      }

      const mapped = this.mapWorldPoint(stage.x, stage.y);
      visual.container.x = mapped.x;
      visual.container.y = mapped.y;
      visual.body.clear();
      visual.label.text = String(stage.id);

      if (stage.estado === 'locked') {
        visual.body.circle(0, 0, 20);
        visual.body.fill({ color: 0x4b5563, alpha: 0.62 });
        visual.body.stroke({ color: 0x8d99ae, width: 2 });
        visual.glow.alpha = 0.05;
        visual.label.style.fill = '#d1d5db';
      } else if (stage.estado === 'unlocked') {
        visual.body.circle(0, 0, 20);
        visual.body.fill({ color: 0x219ebc, alpha: 0.96 });
        visual.body.stroke({ color: 0x8ecae6, width: 2.2 });
        visual.glow.alpha = 0.16;
        visual.label.style.fill = '#f8fbff';
      } else if (stage.estado === 'active') {
        visual.body.circle(0, 0, 22);
        visual.body.fill({ color: 0xffb703, alpha: 0.99 });
        visual.body.stroke({ color: 0xffe8a1, width: 3 });
        visual.glow.alpha = 0.26;
        visual.label.style.fill = '#111827';
        visual.label.text = stage.enCurso ? '▶' : String(stage.id);
      } else {
        visual.body.circle(0, 0, 21);
        visual.body.fill({ color: 0xd4af37, alpha: 0.98 });
        visual.body.stroke({ color: 0xfff1af, width: 2.4 });
        visual.glow.alpha = 0.1;
        visual.label.style.fill = '#111827';
        visual.label.text = stage.cofre === 'closed' ? '🎁' : '✓';
      }
    }
  }

  private ensureCasinoHomeSprite(state: WorldTemplate) {
    const spriteUrl = state.assets?.sprites?.home_casino || '/assets/home_casino.png';
    if (!spriteUrl) {
      this.removeCasinoHomeSprite();
      this.casinoBody.visible = true;
      this.casinoLabel.visible = true;
      return;
    }

    if (this.casinoHomeSpriteKey === spriteUrl && (this.casinoHomeSprite || this.casinoHomeSpriteLoading)) {
      return;
    }

    this.casinoHomeSpriteKey = spriteUrl;
    this.casinoHomeSpriteLoading = true;

    void (async () => {
      try {
        const tex = await Assets.load(spriteUrl);
        if (this.casinoHomeSpriteKey !== spriteUrl) {
          return;
        }

        this.removeCasinoHomeSprite();

        const sprite = new Sprite(tex as any);
        sprite.anchor.set(0.5);
        sprite.width = 130;
        sprite.height = 98;
        sprite.x = 22;
        sprite.y = 2;

        this.casino.addChild(sprite);
        this.casino.setChildIndex(sprite, this.casino.children.length - 1);
        this.casinoHomeSprite = sprite;
        this.casinoBody.visible = false;
        this.casinoLabel.visible = false;
      } catch {
        this.removeCasinoHomeSprite();
        this.casinoBody.visible = true;
        this.casinoLabel.visible = true;
      } finally {
        if (this.casinoHomeSpriteKey === spriteUrl) {
          this.casinoHomeSpriteLoading = false;
        }
      }
    })();
  }

  private removeCasinoHomeSprite() {
    if (!this.casinoHomeSprite) {
      return;
    }
    this.casino.removeChild(this.casinoHomeSprite);
    this.casinoHomeSprite.destroy();
    this.casinoHomeSprite = null;
  }

  private ensureJumpSpriteTexture(state: WorldTemplate) {
    const jumpUrl = state.assets?.sprites?.jump_men || '/assets/jump_men.png';
    if (!jumpUrl) {
      return;
    }

    if (this.jumpSpriteTexture && this.jumpSpriteKey === jumpUrl) {
      return;
    }

    if (this.jumpSpriteLoading && this.jumpSpriteKey === jumpUrl) {
      return;
    }

    this.jumpSpriteKey = jumpUrl;
    this.jumpSpriteLoading = true;

    void (async () => {
      try {
        const tex = await Assets.load(jumpUrl);
        if (this.jumpSpriteKey === jumpUrl) {
          this.jumpSpriteTexture = tex;
        }
      } catch {
        // keep fallback vector if asset is unavailable
      } finally {
        if (this.jumpSpriteKey === jumpUrl) {
          this.jumpSpriteLoading = false;
        }
      }
    })();
  }

  private ensurePlayerSprites(state: WorldTemplate) {
    const sprites = state.assets?.sprites || {};
    const idleUrl = sprites.player_idle || sprites.player_hombre_idle;
    const walkUrl = sprites.player_walk || sprites.player_hombre_walk || idleUrl;

    if (!idleUrl) {
      this.removePlayerSprites();
    this.removeCasinoHomeSprite();
      this.playerBody.visible = true;
      this.playerBody.alpha = 0.95;
      return;
    }

    const key = `${idleUrl}|${walkUrl}`;

    if (this.playerSpriteFailedKey === key) {
      this.playerBody.visible = true;
      this.playerBody.alpha = 0.95;
      return;
    }

    if (this.playerSpriteKey === key && (this.playerSpriteIdle || this.playerSpriteLoading)) {
      return;
    }

    this.playerSpriteKey = key;
    this.playerSpriteLoading = true;

    void (async () => {
      try {
        const idleTexture = await Assets.load(idleUrl);
        const walkTexture = walkUrl && walkUrl !== idleUrl ? await Assets.load(walkUrl) : idleTexture;

        if (this.playerSpriteKey !== key) {
          return;
        }

        this.removePlayerSprites(false);

        const idle = new Sprite(idleTexture as any);
        const walk = new Sprite(walkTexture as any);

        for (const sprite of [idle, walk]) {
          sprite.anchor.set(0.5, 1);
          sprite.width = 56;
          sprite.height = 78;
          sprite.x = 0;
          sprite.y = 28;
        }

        walk.visible = false;

        this.player.addChildAt(idle, 0);
        this.player.addChildAt(walk, 0);

        this.playerSpriteIdle = idle;
        this.playerSpriteWalk = walk;
        this.playerBody.visible = false;
        this.playerBody.alpha = 0.95;
      } catch {
        this.playerSpriteFailedKey = key;
        this.removePlayerSprites(false);
        this.playerBody.visible = true;
        this.playerBody.alpha = 0.95;
      } finally {
        if (this.playerSpriteKey === key) {
          this.playerSpriteLoading = false;
        }
      }
    })();
  }

  private removePlayerSprites(resetKey = true) {
    if (this.playerSpriteIdle) {
      this.player.removeChild(this.playerSpriteIdle);
      this.playerSpriteIdle.destroy();
      this.playerSpriteIdle = null;
    }

    if (this.playerSpriteWalk) {
      this.player.removeChild(this.playerSpriteWalk);
      this.playerSpriteWalk.destroy();
      this.playerSpriteWalk = null;
    }

    if (resetKey) {
      this.playerSpriteKey = '';
      this.playerSpriteLoading = false;
      this.playerSpriteFailedKey = '';
    }

    this.playerBody.visible = true;
    this.playerBody.alpha = 0.95;
  }

  private updatePlayer(state: WorldTemplate) {
    const stage = state.world.stages.find((item) => item.id === state.player.currentStage) || state.world.stages[0];
    if (!stage) {
      return;
    }

    this.ensurePlayerSprites(state);
    this.ensureJumpSpriteTexture(state);
    const mappedStage = this.mapWorldPoint(stage.x, stage.y);
    this.playerTarget = { x: mappedStage.x - 28, y: mappedStage.y + 26 };
    this.playerLabel.text = state.player.nombre;
  }

  private updateHud(state: WorldTemplate) {
    this.levelText.text = `Nv ${state.player.nivel}`;

    const xpBase = (state.player.nivel - 1) * 100;
    const xpProgress = Math.max(0, Math.min(1, (state.player.xp - xpBase) / 100));
    this.xpBarFill.clear();
    this.xpBarFill.roundRect(82, 50, 160 * xpProgress, 12, 6);
    this.xpBarFill.fill({ color: 0x5eead4, alpha: 0.95 });

    this.fichasText.text = `🪙 ${state.player.fichas}`;

    this.energiaText.text = `⚡ ${state.player.energia}/${state.player.energiaMax}`;
    this.energiaBarFill.clear();
    const energyProgress = Math.max(0, Math.min(1, state.player.energia / Math.max(1, state.player.energiaMax)));
    this.energiaBarFill.roundRect(470, 50, 178 * energyProgress, 10, 5);
    this.energiaBarFill.fill({ color: this.energyFlash > 0 ? 0xf97316 : 0x60a5fa, alpha: 0.95 });

    const reto = state.player.retoDelDia;
    this.retoText.text = `Reto del dia: ${reto.descripcion} (${reto.progreso}/${reto.total})`;
    this.retoBarFill.clear();
    const retoProgress = Math.max(0, Math.min(1, reto.progreso / Math.max(1, reto.total)));
    this.retoBarFill.roundRect(82, 104, 566 * retoProgress, 10, 5);
    this.retoBarFill.fill({ color: reto.reclamado ? 0x22c55e : 0xf59e0b, alpha: 0.95 });
  }

  private updateWorldObjects(state: WorldTemplate) {
    this.ensureCasinoHomeSprite(state);
    const bookPos = this.mapWorldPoint(state.world.book.x, state.world.book.y);
    this.book.x = bookPos.x;
    this.book.y = bookPos.y;

    const boardPos = this.mapWorldPoint(state.world.board.x, state.world.board.y);
    void boardPos;
    this.board.x = this.logicalSize.width - bookPos.x;
    this.board.y = bookPos.y;

    const npcPos = this.mapWorldPoint(state.world.npc.x, state.world.npc.y);
    this.npc.x = npcPos.x;
    this.npc.y = npcPos.y;
    this.npcLabel.text = state.world.npc.nombre;
    this.npc.visible = false;

    const casinoPos = this.mapWorldPoint(state.world.casino.x, state.world.casino.y);
    this.casino.x = casinoPos.x;
    this.casino.y = casinoPos.y;

    this.casinoBody.clear();
    if (state.world.casino.estado === 'locked') {
      this.casinoBody.roundRect(-72, -58, 144, 116, 18);
      this.casinoBody.fill({ color: 0x5f6673, alpha: 0.75 });
      this.casinoBody.stroke({ color: 0x9aa0ab, width: 3 });
      this.casinoGlow.alpha = 0.06;
      if (this.casinoHomeSprite) this.casinoHomeSprite.alpha = 1;
    } else {
      this.casinoBody.roundRect(-72, -58, 144, 116, 18);
      this.casinoBody.fill({ color: 0x6d28d9, alpha: 0.95 });
      this.casinoBody.stroke({ color: 0xffd166, width: 3.4 });
      this.casinoGlow.alpha = 0.32;
      if (this.casinoHomeSprite) this.casinoHomeSprite.alpha = 1;
    }
  }

  private updateDock(state: WorldTemplate) {
    void state;
    this.dockMochila.x = 252;
    this.dockMochila.y = 802;
    this.dockCasino.x = 360;
    this.dockCasino.y = 802;
    this.dockTienda.x = 468;
    this.dockTienda.y = 802;
  }

  private updatePopup(state: WorldTemplate) {
    const popup = state.ui.popup;
    if (!popup) {
      this.popup.visible = false;
      this.popupBody.removeChildren();
      this.lastPopup = null;
      return;
    }

    this.popup.visible = true;
    this.popup.x = this.logicalSize.width * 0.5;
    this.popup.y = this.logicalSize.height * 0.5;

    this.popupBg.clear();
    this.popupBg.roundRect(-300, -260, 600, 520, 14);
    this.popupBg.fill({ color: 0x0b1020, alpha: 0.95 });
    this.popupBg.stroke({ color: 0xffd166, width: 2.2, alpha: 0.9 });

    this.popupTitle.anchor.set(0.5, 0);
    this.popupTitle.x = 0;
    this.popupTitle.y = -228;

    this.popupBody.x = -260;
    this.popupBody.y = -176;

    this.popupClose.x = 262;
    this.popupClose.y = -228;

    if (this.lastPopup !== popup) {
      this.popupBody.removeChildren();
      if (popup === 'inventory') {
        this.inventoryTab = 'recompensas';
      }
      this.lastPopup = popup;
    }

    this.popupBody.removeChildren();

    if (popup === 'missions') {
      this.renderMissionsPopup(state);
    }

    if (popup === 'inventory') {
      this.renderInventoryPopup(state);
    }

    if (popup === 'events') {
      this.renderEventsPopup(state);
    }
  }

  private renderMissionsPopup(state: WorldTemplate) {
    this.popupTitle.text = 'Libro de Misiones';
    const mission = state.misiones.activas?.[0];

    if (!mission) {
      this.popupBody.addChild(this.makeLine('No hay misiones activas.', 0, 0));
      return;
    }

    this.popupBody.addChild(this.makeLine(mission.titulo, 0, 0, '#ffe08a', 18, true));
    this.popupBody.addChild(this.makeLine(mission.descripcion, 0, 34, '#dbeafe'));
    this.popupBody.addChild(this.makeLine(`Progreso: ${mission.progreso}/${mission.total}`, 0, 70, '#fcd34d'));

    if (mission.progreso >= mission.total && !mission.reclamada) {
      this.popupBody.addChild(this.makeButton('Reclamar', 0, 120, () => this.dispatchAction('reclamarMision', { missionId: mission.id })));
    } else if (mission.reclamada) {
      this.popupBody.addChild(this.makeLine('Recompensa ya reclamada', 0, 120, '#86efac'));
    }
  }

  private renderInventoryPopup(state: WorldTemplate) {
    this.popupTitle.text = 'Mochila';

    this.popupBody.addChild(
      this.makeButton('Recompensas', 0, 0, () => {
        this.inventoryTab = 'recompensas';
        if (this.currentState) this.updatePopup(this.currentState);
      }, this.inventoryTab === 'recompensas'),
    );
    this.popupBody.addChild(
      this.makeButton('Promociones', 190, 0, () => {
        this.inventoryTab = 'promociones';
        if (this.currentState) this.updatePopup(this.currentState);
      }, this.inventoryTab === 'promociones'),
    );

    const items: Item[] = this.inventoryTab === 'recompensas'
      ? state.player.inventory.recompensas
      : state.player.inventory.promociones;

    if (!items.length) {
      this.popupBody.addChild(this.makeLine('Sin items en esta categoria.', 0, 54, '#cbd5e1'));
      return;
    }

    items.slice(-7).forEach((item, index) => {
      const y = 56 + index * 35;
      this.popupBody.addChild(this.makeLine(`${item.nombre}`, 0, y, this.getRarezaColor(item.rareza), 14, true));
      if (item.efecto) {
        this.popupBody.addChild(this.makeLine(`Efecto: ${item.efecto}`, 210, y, '#93c5fd', 12));
      }
    });
  }

  private renderEventsPopup(state: WorldTemplate) {
    this.popupTitle.text = 'Tablon de Eventos';
    const events = state.ui.toasts.slice(-8).reverse();

    if (!events.length) {
      this.popupBody.addChild(this.makeLine('No hay eventos recientes.', 0, 0));
      return;
    }

    events.forEach((event, index) => {
      this.popupBody.addChild(this.makeLine(`[${event.tipo}] ${event.texto}`, 0, index * 34, '#dbeafe', 13));
    });
  }

  private syncToasts(serverToasts: WorldTemplate['ui']['toasts']) {
    for (const toast of serverToasts.slice(-5)) {
      if (this.toasts.has(toast.id) || this.seenToastIds.has(toast.id)) {
        continue;
      }

      const container = new Container();
      const bg = new Graphics();
      bg.roundRect(0, 0, 300, 44, 10);
      bg.fill({ color: 0x111827, alpha: 0.9 });
      bg.stroke({ color: 0xffd166, width: 1.3, alpha: 0.8 });

      const label = new Text({
        text: toast.texto,
        style: new TextStyle({ fill: '#f8fafc', fontSize: 15, fontWeight: '600', wordWrap: true, wordWrapWidth: 270 }),
      });
      label.x = 12;
      label.y = 11;

      container.addChild(bg);
      container.addChild(label);
      container.x = this.logicalSize.width - 325;
      container.y = 138 + this.toasts.size * 50;

      this.fxLayer.addChild(container);
      this.toasts.set(toast.id, { id: toast.id, container, life: 360 });
      this.seenToastIds.add(toast.id);
    }
  }

  private handleEvent(event: GameEventMessage) {
    if (!this.currentState) {
      return;
    }

    if (event.name === 'stageCompleted') {
      const completedStageId = Number(event.data?.stageId || this.currentState.world.currentStage);
      const fromStage = this.currentState.world.stages.find((item) => item.id === completedStageId);
      const toStage = this.currentState.world.stages.find((item) => item.id === this.currentState.player.currentStage)
        || this.currentState.world.stages.find((item) => item.id === completedStageId + 1);

      if (fromStage && toStage) {
        const from = this.mapWorldPoint(fromStage.x, fromStage.y);
        const to = this.mapWorldPoint(toStage.x, toStage.y);
        this.spawnStagePassAnimation(from.x, from.y - 58, to.x, to.y - 58);
      }
    }

    if (event.name === 'coinsEarned') {
      const stageId = Number(event.data?.fromStage || this.currentState.world.currentStage);
      const stage = this.currentState.world.stages.find((item) => item.id === stageId);
      if (stage) {
        const from = this.mapWorldPoint(stage.x, stage.y);
        this.spawnCoinBurst(from.x, from.y - 20, 300, 34);
      }
    }

    if (event.name === 'energySpent') {
      this.energyFlash = 1;
    }

    if (event.name === 'energyRegen') {
      const amount = Number(event.data?.amount || 1);
      this.spawnFloatingText(`+${amount} energia`, this.currentState.ui.hud.energiaCounter.x, this.currentState.ui.hud.energiaCounter.y, '#86efac');
    }

    if (event.name === 'casinoUnlocked') {
      const casinoPos = this.mapWorldPoint(this.currentState.world.casino.x, this.currentState.world.casino.y);
      this.spawnFloatingText('Casino desbloqueado', casinoPos.x - 42, casinoPos.y - 90, '#fcd34d');
    }

    if (event.name === 'worldChanged') {
      this.worldFade = 1;
    }
  }

  private syncPlayerVisibility() {
    this.player.visible = !(this.stagePassPlayerHidden || this.casinoTransitionHidden);
  }

  private setPlayerVisibilityForStagePass(hidden: boolean) {
    this.stagePassPlayerHidden = hidden;
    this.syncPlayerVisibility();
  }

  private spawnStagePassAnimation(fromX: number, fromY: number, toX: number, toY: number) {
    const runner = new Container();
    const runnerBody = new Graphics();
    runnerBody.roundRect(-11, -28, 22, 44, 8);
    runnerBody.fill({ color: 0x4cc9f0, alpha: 0.95 });
    runnerBody.stroke({ color: 0xdbeafe, width: 1.6, alpha: 0.9 });

    const sword = new Graphics();
    sword.roundRect(7, -8, 18, 4, 2);
    sword.fill({ color: 0xfff3c2, alpha: 0.95 });
    sword.stroke({ color: 0xffd166, width: 1.2, alpha: 0.9 });

    runner.addChild(runnerBody);
    runner.addChild(sword);
    runner.x = fromX;
    runner.y = fromY;
    runner.zIndex = 80;
    this.fxLayer.addChild(runner);

    const jumpSpriteFromCache = this.jumpSpriteTexture;
    if (jumpSpriteFromCache) {
      const jumpSprite = new Sprite(jumpSpriteFromCache as any);
      jumpSprite.anchor.set(0.5, 1);
      jumpSprite.width = 72;
      jumpSprite.height = 96;
      jumpSprite.y = 24;
      runner.addChild(jumpSprite);
      runnerBody.visible = false;
      sword.visible = false;
    } else {
      const jumpSpriteUrl = this.currentState?.assets?.sprites?.jump_men || '/assets/jump_men.png';
      void (async () => {
        try {
          const tex = await Assets.load(jumpSpriteUrl);
          this.jumpSpriteTexture = tex;
          this.jumpSpriteKey = jumpSpriteUrl;
          if (!runner.parent) {
            return;
          }
          const jumpSprite = new Sprite(tex as any);
          jumpSprite.anchor.set(0.5, 1);
          jumpSprite.width = 72;
          jumpSprite.height = 96;
          jumpSprite.y = 24;
          runner.addChild(jumpSprite);
          runnerBody.visible = false;
          sword.visible = false;
        } catch {
          // keep vector fallback if jump sprite is unavailable
        }
      })();
    }

    const slash = new Graphics();
    this.fxLayer.addChild(slash);

    const impact = new Graphics();
    impact.alpha = 0;
    this.fxLayer.addChild(impact);

    this.setPlayerVisibilityForStagePass(true);

    this.stagePassFx.push({
      runner,
      runnerBody,
      slash,
      impact,
      fromX,
      fromY,
      toX,
      toY,
      t: 0,
      duration: 40,
      impactShown: false,
    });
  }

  private spawnCoinBurst(fromX: number, fromY: number, toX: number, toY: number) {
    for (let i = 0; i < 10; i += 1) {
      const sprite = new Graphics();
      sprite.circle(0, 0, 5);
      sprite.fill({ color: 0xffd166, alpha: 1 });
      sprite.x = fromX + (Math.random() * 30 - 15);
      sprite.y = fromY + (Math.random() * 20 - 10);
      this.fxLayer.addChild(sprite);

      this.coinParticles.push({
        sprite,
        fromX: sprite.x,
        fromY: sprite.y,
        toX,
        toY,
        t: 0,
      });
    }
  }

  private spawnFloatingText(text: string, x: number, y: number, color: string) {
    const label = new Text({ text, style: new TextStyle({ fill: color, fontSize: 14, fontWeight: 'bold' }) });
    label.x = x;
    label.y = y;
    this.fxLayer.addChild(label);

    const id = `temp-${Date.now()}-${Math.random()}`;
    this.toasts.set(id, {
      id,
      container: label,
      life: 120,
    });
  }

  private attachTicker() {
    if (!this.app) {
      return;
    }

    this.app.ticker.add((ticker) => {
      this.elapsed += ticker.deltaTime;

      const dx = this.playerTarget.x - this.player.x;
      const dy = this.playerTarget.y - this.player.y;
      this.isPlayerMoving = Math.abs(dx) + Math.abs(dy) > 1.2;

      this.player.x += dx * 0.14;
      this.player.y += dy * 0.14;
      this.player.y += Math.sin(this.elapsed * 0.09) * 0.12;

      if (this.enterCasinoPending) {
        const remaining = Math.abs(this.playerTarget.x - this.player.x) + Math.abs(this.playerTarget.y - this.player.y);
        if (remaining < 8) {
          this.enterCasinoPending = false;
          this.casinoTransitionHidden = true;
          this.backpack.visible = false;
          this.syncPlayerVisibility();
          this.dispatchAction('entrarCasino', {});
        }
      }

      if (this.playerSpriteIdle && this.playerSpriteWalk) {
        this.playerSpriteWalk.visible = this.isPlayerMoving;
        this.playerSpriteIdle.visible = !this.isPlayerMoving;
        this.playerBody.visible = false;
        this.playerBody.alpha = 0.95;
      } else {
        this.playerBody.visible = true;
        this.playerBody.alpha = 0.95;
      }

      if (!this.casinoTransitionHidden) {
        this.backpack.visible = true;
      }

      for (const stage of this.stageVisuals.values()) {
        const stageState = this.currentState?.world.stages.find((item) => item.id === stage.id);
        if (!stageState) {
          continue;
        }

        if (stageState.estado === 'active') {
          const pulse = 1 + Math.sin(this.elapsed * 0.12 + stage.id) * 0.09;
          stage.container.scale.set(pulse);
          stage.glow.alpha = 0.2 + Math.sin(this.elapsed * 0.12 + stage.id) * 0.1;
        } else if (stageState.estado === 'unlocked') {
          stage.container.scale.set(1);
          stage.glow.alpha = 0.12 + Math.sin(this.elapsed * 0.08 + stage.id) * 0.08;
        } else {
          stage.container.scale.set(1);
        }
      }

      if (this.currentState?.world.casino.estado === 'unlocked') {
        this.casinoGlow.alpha = 0.22 + Math.sin(this.elapsed * 0.08) * 0.14;
      }

      for (let i = this.stagePassFx.length - 1; i >= 0; i -= 1) {
        const fx = this.stagePassFx[i];
        fx.t += ticker.deltaTime;
        const progress = Math.min(1, fx.t / fx.duration);
        const ease = 1 - (1 - progress) * (1 - progress);
        const arc = Math.sin(progress * Math.PI) * 32;
        const x = fx.fromX + (fx.toX - fx.fromX) * ease;
        const y = fx.fromY + (fx.toY - fx.fromY) * ease - arc;

        fx.runner.x = x;
        fx.runner.y = y;
        fx.runner.alpha = 1 - progress * 0.5;

        const angle = Math.atan2(fx.toY - fx.fromY, fx.toX - fx.fromX);
        fx.runner.rotation = angle * 0.18;
        fx.runnerBody.scale.y = 1 + Math.sin(this.elapsed * 0.55) * 0.05;

        const trailLen = 54;
        const tx = Math.cos(angle) * trailLen;
        const ty = Math.sin(angle) * trailLen;
        fx.slash.clear();
        fx.slash.moveTo(x, y);
        fx.slash.lineTo(x - tx, y - ty);
        fx.slash.stroke({ color: 0xffd166, width: 7, alpha: Math.max(0, 0.7 - progress * 0.55) });
        fx.slash.moveTo(x - tx * 0.62, y - ty * 0.62);
        fx.slash.lineTo(x - tx * 1.1, y - ty * 1.1);
        fx.slash.stroke({ color: 0x93c5fd, width: 3, alpha: Math.max(0, 0.45 - progress * 0.35) });

        if (progress > 0.84 && !fx.impactShown) {
          fx.impactShown = true;
          fx.impact.x = fx.toX;
          fx.impact.y = fx.toY;
          fx.impact.clear();
          fx.impact.circle(0, 0, 6);
          fx.impact.fill({ color: 0xffd166, alpha: 1 });
          fx.impact.circle(0, 0, 20);
          fx.impact.stroke({ color: 0xfff1af, width: 3, alpha: 0.9 });
          this.spawnFloatingText('Etapa superada', fx.toX - 42, fx.toY - 72, '#fde68a');
        }

        if (fx.impactShown) {
          fx.impact.alpha = Math.max(0, fx.impact.alpha - 0.07 * ticker.deltaTime);
          fx.impact.scale.set(fx.impact.scale.x + 0.01 * ticker.deltaTime);
        }

        if (progress >= 1) {
          this.fxLayer.removeChild(fx.runner);
          this.fxLayer.removeChild(fx.slash);
          this.fxLayer.removeChild(fx.impact);
          fx.runner.destroy();
          fx.slash.destroy();
          fx.impact.destroy();
          this.stagePassFx.splice(i, 1);
          if (this.stagePassFx.length === 0) {
            this.setPlayerVisibilityForStagePass(false);
          }
        }
      }

      for (let i = this.coinParticles.length - 1; i >= 0; i -= 1) {
        const coin = this.coinParticles[i];
        coin.t += 0.04 * ticker.deltaTime;

        const p = Math.min(coin.t, 1);
        const curve = Math.sin(p * Math.PI) * 32;
        coin.sprite.x = coin.fromX + (coin.toX - coin.fromX) * p;
        coin.sprite.y = coin.fromY + (coin.toY - coin.fromY) * p - curve;
        coin.sprite.alpha = 1 - p * 0.4;

        if (p >= 1) {
          this.fxLayer.removeChild(coin.sprite);
          this.coinParticles.splice(i, 1);
        }
      }

      for (const [id, toast] of this.toasts.entries()) {
        toast.life -= ticker.deltaTime;
        toast.container.y -= 0.05 * ticker.deltaTime;

        if (toast.life < 70) {
          toast.container.alpha = Math.max(0, toast.life / 70);
        }

        if (toast.life <= 0) {
          this.fxLayer.removeChild(toast.container);
          this.toasts.delete(id);
        }
      }

      let idx = 0;
      for (const toast of this.toasts.values()) {
        if (toast.id.startsWith('temp-')) {
          continue;
        }
        toast.container.x = this.logicalSize.width - 325;
        toast.container.y += (138 + idx * 50 - toast.container.y) * 0.1;
        idx += 1;
      }

      if (this.energyFlash > 0) {
        this.energyFlash = Math.max(0, this.energyFlash - 0.06 * ticker.deltaTime);
      }

      if (this.worldFade > 0) {
        this.fadeOverlay.alpha = Math.min(1, this.worldFade);
        this.worldFade = Math.max(0, this.worldFade - 0.03 * ticker.deltaTime);
      } else {
        this.fadeOverlay.alpha = 0;
      }
    });
  }

  private mapWorldPoint(x: number, y: number) {
    const nx = Math.max(0, Math.min(1, x / this.sourceWorldSize.width));
    const ny = Math.max(0, Math.min(1, y / this.sourceWorldSize.height));

    return {
      x: this.worldViewport.x + ny * this.worldViewport.width,
      y: this.worldViewport.y + (1 - nx) * this.worldViewport.height,
    };
  }

  private makeLine(text: string, x: number, y: number, color = '#f8fafc', size = 15, bold = false) {
    const line = new Text({ text, style: new TextStyle({ fill: color, fontSize: size, fontWeight: bold ? 'bold' : 'normal' }) });
    line.x = x;
    line.y = y;
    return line;
  }

  private makeButton(label: string, x: number, y: number, onClick: () => void, active = false) {
    const button = new Container();
    const bg = new Graphics();
    bg.roundRect(0, 0, 170, 36, 9);
    bg.fill({ color: active ? 0xffd166 : 0x1f2937, alpha: 0.95 });
    bg.stroke({ color: active ? 0xffef9f : 0x64748b, width: 1.8 });

    const text = new Text({
      text: label,
      style: new TextStyle({ fill: active ? '#0f172a' : '#e2e8f0', fontSize: 13, fontWeight: 'bold' }),
    });
    text.anchor.set(0.5);
    text.x = 85;
    text.y = 18;

    button.addChild(bg);
    button.addChild(text);
    button.x = x;
    button.y = y;
    button.eventMode = 'static';
    button.cursor = 'pointer';
    button.on('pointertap', onClick);

    return button;
  }

  private makeDockButton(label: string, onClick: () => void, width = 86, height = 52) {
    const button = new Container();
    const bg = new Graphics();
    bg.roundRect(-width / 2, -height / 2, width, height, 12);
    bg.fill({ color: 0x111827, alpha: 0.92 });
    bg.stroke({ color: 0xffd166, width: 1.8, alpha: 0.82 });

    const text = new Text({
      text: label,
      style: new TextStyle({ fill: '#fde68a', fontSize: 13, fontWeight: 'bold' }),
    });
    text.anchor.set(0.5);

    button.addChild(bg);
    button.addChild(text);
    button.eventMode = 'static';
    button.cursor = 'pointer';
    button.on('pointertap', onClick);
    return button;
  }

  private getRarezaColor(rareza?: string) {
    if (rareza === 'epica') {
      return '#e9a8ff';
    }
    if (rareza === 'rara') {
      return '#93c5fd';
    }
    return '#f8fafc';
  }
}
