import { BadRequestException, Injectable } from '@nestjs/common';
import { SseService } from '../sse/sse.service';
import { TemplateService } from '../template/template.service';
import { WorldService } from '../world/world.service';

@Injectable()
export class ActionService {
  constructor(
    private readonly worldService: WorldService,
    private readonly templateService: TemplateService,
    private readonly sseService: SseService,
  ) {}

  handleAction(action: string, payload: any) {
    this.applyEnergyRegen();

    switch (action) {
      case 'iniciarStage':
        return this.iniciarStage(payload?.stageId);
      case 'completarStage':
        return this.completarStage(payload?.stageId);
      case 'abrirCofre':
        return this.abrirCofre(payload?.stageId);
      case 'toggleMochila':
        return this.togglePopup('inventory');
      case 'abrirMisiones':
        return this.togglePopup('missions');
      case 'reclamarMision':
        return this.reclamarMision(payload?.missionId);
      case 'abrirEventos':
        return this.togglePopup('events');
      case 'entrarCasino':
        return this.entrarCasino();
      case 'reiniciarJuego':
        return this.reiniciarJuego();
      default:
        throw new BadRequestException(`Unsupported action: ${action}`);
    }
  }

  private iniciarStage(stageId: number) {
    const state = this.worldService.getState();
    const currentStage = Number(state.world?.currentStage || 1);
    const stage = this.findStage(stageId);

    if (!stage || stage.id !== currentStage || stage.estado !== 'active') {
      throw new BadRequestException('Solo puedes iniciar la etapa activa');
    }

    if (state.world?.stageEnCurso) {
      return this.addToast('aviso', 'La etapa ya esta en curso');
    }

    const energyCost = Number(state.economy?.energyCost || 1);
    const startStageCost = Number(state.economy?.startStageCost || 5);

    if (Number(state.player?.energia || 0) < energyCost) {
      return this.addToast('error', 'No tienes energia suficiente');
    }

    let cost = startStageCost;
    const promociones = [...(state.player?.inventory?.promociones || [])];
    const discountIndex = promociones.findIndex((item: any) => item.efecto === 'descuento_inicio');

    if (discountIndex >= 0) {
      cost = Math.max(1, cost - 2);
      promociones.splice(discountIndex, 1);
    }

    if (Number(state.player?.fichas || 0) < cost) {
      return this.addToast('error', 'No tienes fichas');
    }

    const stages = state.world.stages.map((item: any) =>
      item.id === stage.id ? { ...item, enCurso: true } : { ...item, enCurso: false },
    );

    const patch = {
      player: {
        fichas: Number(state.player.fichas || 0) - cost,
        energia: Number(state.player.energia || 0) - energyCost,
        energyUpdatedAt: new Date().toISOString(),
        inventory: {
          ...state.player.inventory,
          promociones,
        },
      },
      world: {
        stageEnCurso: true,
        stages,
      },
      ui: {
        toasts: this.pushToast(state.ui?.toasts || [], 'inicio', `Etapa ${stage.id} iniciada (-${cost} fichas)`),
      },
    };

    this.publishPatch(patch);
    this.emitEvent('energySpent', { amount: energyCost });
    this.emitEvent('stageStarted', { stageId: stage.id, cost });

    return { ok: true, patch };
  }

  private completarStage(stageId: number) {
    const state = this.worldService.getState();
    const currentStage = Number(state.world.currentStage || 1);
    const stage = this.findStage(stageId);

    if (!stage || stage.id !== currentStage || stage.estado !== 'active') {
      throw new BadRequestException('Solo puedes completar la etapa activa');
    }

    if (!state.world.stageEnCurso) {
      return this.addToast('aviso', 'Primero inicia la etapa');
    }

    let reward = this.randomInt(Number(state.economy.stageRewardRange.min), Number(state.economy.stageRewardRange.max));
    const xpGain = 10;

    const promociones = [...(state.player.inventory?.promociones || [])];
    const rewards = [...(state.player.inventory?.recompensas || [])];

    const ticketIndex = promociones.findIndex((item: any) => item.efecto === 'ticket_x2');
    if (ticketIndex >= 0) {
      reward = reward * 2;
      promociones.splice(ticketIndex, 1);
    }

    if (Math.random() < 0.5) {
      rewards.push({
        id: `rw-${Date.now()}`,
        nombre: `Token Brillante ${currentStage}`,
        rareza: this.pickRareza(),
        icono: 'item_recompensa',
      });
    }

    if (Math.random() < 0.3) {
      promociones.push({
        id: `promo-${Date.now()}`,
        nombre: `Ticket x2`,
        rareza: 'epica',
        icono: 'item_promocion',
        efecto: 'ticket_x2',
      });
    }

    const finalizada = currentStage >= 7;
    const nextStageId = finalizada ? 7 : currentStage + 1;

    const stages = state.world.stages.map((item: any) => {
      if (item.id === currentStage) {
        return { ...item, estado: 'completed', enCurso: false };
      }
      if (!finalizada && item.id === nextStageId) {
        return { ...item, estado: 'active', enCurso: false };
      }
      if (item.id !== currentStage && item.estado === 'active') {
        return { ...item, estado: 'unlocked', enCurso: false };
      }
      return { ...item, enCurso: false };
    });

    const nextXp = Number(state.player.xp || 0) + xpGain;
    const patch = {
      player: {
        fichas: Number(state.player.fichas || 0) + reward,
        xp: nextXp,
        nivel: this.computeLevel(Number(state.player.nivel || 1), nextXp),
        currentStage: nextStageId,
        posicion: {
          stageId: nextStageId,
        },
        inventory: {
          recompensas: rewards,
          promociones,
        },
        retoDelDia: {
          ...state.player.retoDelDia,
          progreso: Math.min(Number(state.player.retoDelDia.progreso || 0) + 1, Number(state.player.retoDelDia.total || 1)),
        },
      },
      world: {
        currentStage: nextStageId,
        stageEnCurso: false,
        stages,
        casino: {
          ...state.world.casino,
          estado: finalizada ? 'unlocked' : state.world.casino.estado,
        },
      },
      misiones: {
        activas: (state.misiones.activas || []).map((mission: any) => ({
          ...mission,
          progreso: Math.min(currentStage, mission.total || 7),
        })),
      },
      ui: {
        toasts: this.pushToast(state.ui.toasts || [], 'recompensa', `+${reward} fichas por etapa ${currentStage}`),
      },
    };

    this.publishPatch(patch);
    this.emitEvent('stageCompleted', { stageId: currentStage });
    this.emitEvent('coinsEarned', { amount: reward, fromStage: currentStage });

    if (finalizada) {
      this.emitEvent('casinoUnlocked', { worldId: state.world.id });
    }

    return { ok: true, patch };
  }

  private abrirCofre(stageId: number) {
    const state = this.worldService.getState();
    const stage = this.findStage(stageId);

    if (!stage || stage.estado !== 'completed' || stage.cofre !== 'closed') {
      return this.addToast('aviso', 'No hay cofre disponible en esa etapa');
    }

    const cost = Number(state.economy.chestCost || 10);
    if (Number(state.player.fichas || 0) < cost) {
      return this.addToast('error', 'No tienes fichas');
    }

    const rewards = [...(state.player.inventory?.recompensas || [])];
    rewards.push({
      id: `chest-${Date.now()}`,
      nombre: `Cofre Premium E${stage.id}`,
      rareza: 'epica',
      icono: 'item_recompensa',
    });

    const stages = state.world.stages.map((item: any) =>
      item.id === stage.id ? { ...item, cofre: 'open' } : item,
    );

    const patch = {
      player: {
        fichas: Number(state.player.fichas || 0) - cost,
        inventory: {
          ...state.player.inventory,
          recompensas: rewards,
        },
      },
      world: {
        stages,
      },
      ui: {
        toasts: this.pushToast(state.ui.toasts || [], 'cofre', `Cofre premium abierto (-${cost} fichas)`),
      },
    };

    this.publishPatch(patch);
    this.emitEvent('chestOpened', { stageId: stage.id });

    return { ok: true, patch };
  }

  private togglePopup(target: 'inventory' | 'missions' | 'events') {
    const state = this.worldService.getState();
    const patch = {
      ui: {
        popup: state.ui.popup === target ? null : target,
      },
    };

    this.publishPatch(patch);
    return { ok: true, patch };
  }

  private reclamarMision(missionId: string) {
    const state = this.worldService.getState();
    const mission = (state.misiones.activas || []).find((item: any) => item.id === missionId);

    if (!mission) {
      throw new BadRequestException('Mision no encontrada');
    }

    if (Number(mission.progreso || 0) < Number(mission.total || 0)) {
      return this.addToast('aviso', 'Mision aun incompleta');
    }

    if (mission.reclamada) {
      return this.addToast('aviso', 'Mision ya reclamada');
    }

    const bonus = 25;
    const promociones = [...(state.player.inventory.promociones || [])];
    promociones.push({
      id: `promo-${Date.now()}`,
      nombre: 'Ticket x2',
      rareza: 'epica',
      icono: 'item_promocion',
      efecto: 'ticket_x2',
    });

    const patch = {
      player: {
        fichas: Number(state.player.fichas || 0) + bonus,
        inventory: {
          ...state.player.inventory,
          promociones,
        },
      },
      misiones: {
        activas: (state.misiones.activas || []).map((item: any) =>
          item.id === missionId ? { ...item, reclamada: true } : item,
        ),
      },
      ui: {
        toasts: this.pushToast(state.ui.toasts || [], 'mision', `Mision reclamada (+${bonus} fichas)`),
      },
    };

    this.publishPatch(patch);
    return { ok: true, patch };
  }

  private entrarCasino() {
    const state = this.worldService.getState();
    if (state.world.id === 'world_1' && state.world.casino.estado !== 'unlocked') {
      return this.addToast('aviso', 'Completa las 7 etapas primero');
    }

    if (state.world.id === 'world_1') {
      const world2Template = this.templateService.getTemplate('world_2');
      const patch = {
        narrativa: world2Template.narrativa,
        world: world2Template.world,
        misiones: world2Template.misiones,
        player: {
          ...state.player,
          currentStage: 1,
          posicion: { stageId: 1 },
          retoDelDia: world2Template.player.retoDelDia,
        },
        ui: {
          ...state.ui,
          popup: null,
          toasts: this.pushToast(state.ui.toasts || [], 'mundo', 'Entrando a Distrito Nocturno'),
        },
      };

      this.publishPatch(patch);
      this.emitEvent('worldChanged', { worldId: 'world_2' });
      return { ok: true, patch };
    }

    return this.addToast('casino', 'Bienvenido a la Sala VIP');
  }

  private reiniciarJuego() {
    const resetState = this.worldService.resetState();
    this.sseService.emit({ type: 'patch', patch: resetState });
    this.emitEvent('worldChanged', { worldId: resetState.world.id, reset: true });
    return { ok: true, patch: resetState };
  }

  private applyEnergyRegen() {
    const state = this.worldService.getState();
    const regenSeconds = Number(state.economy?.energyRegenSeconds || 30);
    const energyMax = Number(state.player?.energiaMax || state.economy?.energyMax || 5);
    const currentEnergy = Number(state.player?.energia || 0);

    if (currentEnergy >= energyMax) {
      return;
    }

    const updatedAt = new Date(state.player?.energyUpdatedAt || Date.now()).getTime();
    const now = Date.now();
    const elapsed = Math.max(0, now - updatedAt);
    const interval = regenSeconds * 1000;
    const units = Math.floor(elapsed / interval);

    if (units <= 0) {
      return;
    }

    const recovered = Math.min(units, energyMax - currentEnergy);
    const nextEnergy = currentEnergy + recovered;
    const consumedTime = recovered * interval;
    const nextUpdatedAt = new Date(updatedAt + consumedTime).toISOString();

    const patch = {
      player: {
        energia: nextEnergy,
        energyUpdatedAt: nextUpdatedAt,
      },
      ui: {
        toasts: this.pushToast(state.ui?.toasts || [], 'energia', `+${recovered} energia`),
      },
    };

    this.publishPatch(patch);
    this.emitEvent('energyRegen', { amount: recovered });
  }

  private addToast(tipo: string, texto: string) {
    const state = this.worldService.getState();
    const patch = {
      ui: {
        toasts: this.pushToast(state.ui?.toasts || [], tipo, texto),
      },
    };
    this.publishPatch(patch);
    return { ok: false, patch };
  }

  private pushToast(list: any[], tipo: string, texto: string) {
    return [
      ...list,
      {
        id: `toast-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        tipo,
        texto,
      },
    ].slice(-12);
  }

  private findStage(stageId: number) {
    const state = this.worldService.getState();
    return (state.world?.stages || []).find((item: any) => item.id === Number(stageId));
  }

  private randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private computeLevel(currentLevel: number, xp: number) {
    let level = currentLevel;
    while (xp >= level * 100) {
      level += 1;
    }
    return level;
  }

  private pickRareza() {
    const roll = Math.random();
    if (roll < 0.6) {
      return 'comun';
    }
    if (roll < 0.9) {
      return 'rara';
    }
    return 'epica';
  }

  private publishPatch(patch: any) {
    this.worldService.applyPatch(patch);
    this.sseService.emit({ type: 'patch', patch });
  }

  private emitEvent(name: string, data: any) {
    this.sseService.emit({ type: 'event', name, data });
  }
}
