Arquitectura:

- `frontend`: React + PixiJS (render-only + applyPatch + SSE)
- `bff`: NestJS state-authoritative (economia, energia, loot, progreso)

## Endpoints BFF

- `GET /template`
- `GET /template?worldId=world_2`
- `GET /state`
- `POST /action`
- `GET /events` (SSE)

Mensajes SSE:

- `{ "type": "patch", "patch": {...} }`
- `{ "type": "event", "name": "...", "data": {...} }`

## UI Diegetica en Pixi

Todo ocurre dentro del canvas:

- HUD superior: nivel, barra XP, fichas, energia, reto del dia
- Mundo central: camino curvo, 7 stages, NPC guia, libro de misiones, tablon, casino
- Dock inferior: mochila, casino, tienda
- Popups in-game: misiones, mochila, eventos
- Toasts flotantes
- Boton diegetico: **REINICIO**

## Economia autoritativa (BFF)

- iniciar etapa: `-5` fichas + `-1` energia
- completar etapa: `+10..40` fichas + `+10` XP
- abrir cofre premium: `-10` fichas
- promociones:
  - `ticket_x2` duplica recompensa una vez
  - `descuento_inicio` reduce costo de inicio
- energia:
  - max 5
  - regenera +1 cada 30s (mock)

## Acciones soportadas

- `iniciarStage { stageId }`
- `completarStage { stageId }`
- `abrirCofre { stageId }`
- `toggleMochila {}`
- `abrirMisiones {}`
- `reclamarMision { missionId }`
- `abrirEventos {}`
- `entrarCasino {}`
- `reiniciarJuego {}`

## Mundo 2

Al entrar al casino tras completar etapa 7 del `world_1`, el BFF aplica patch con `world_2` y emite evento `worldChanged`.

## Ejecutar

### BFF

```bash
cd new_project/bff
npm install
npm run start:dev
```

### Frontend

```bash
cd new_project/frontend
npm install
npm run dev
```

Abrir `http://localhost:5173`.
