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
cd /Users/bryandanielmoncadaramos/gama_full/bff
npm install
npm run start:dev
```

### Frontend

```bash
cd /Users/bryandanielmoncadaramos/gama_full/frontend
npm install
npm run dev
```

Abrir `http://localhost:5173`.

## Frontend como paquete local (Rollup/Vite Library Mode)

El frontend ahora soporta empaquetado de libreria para integrar en otro proyecto interno.

### Generar build de libreria

```bash
cd /Users/bryandanielmoncadaramos/gama_full/frontend
npm run build:lib
```

Salida:

- `dist-lib/index.js` (ESM)
- `dist-lib/index.cjs` (CommonJS)
- `dist-lib/style.css`
- `dist-lib/*.d.ts`

### Crear tarball local

```bash
cd /Users/bryandanielmoncadaramos/gama_full/frontend
npm run pack:local
```

Esto genera algo como:

- `bdanielmr-ruta-casino-frontend-1.0.0.tgz`

### Instalar en otro proyecto

```bash
cd /ruta/de/otro-proyecto
npm install /Users/bryandanielmoncadaramos/gama_full/frontend/bdanielmr-ruta-casino-frontend-1.0.0.tgz
```

### Uso basico

```tsx
import { RutaCasinoApp } from '@bdanielmr/ruta-casino-frontend';
import '@bdanielmr/ruta-casino-frontend/styles.css';

export default function PantallaJuego() {
  return <RutaCasinoApp />;
}
```

Notas:

- Define `VITE_BFF_URL` en el proyecto consumidor apuntando a tu BFF.
- El paquete declara `react` y `react-dom` como `peerDependencies`.
