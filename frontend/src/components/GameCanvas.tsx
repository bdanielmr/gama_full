import { useEffect, useRef } from 'react';
import { PixiWorld } from '../engine/PixiWorld';
import type { GameEventMessage, WorldTemplate } from '../types';

type Props = {
  worldState: WorldTemplate;
  onAction: (action: string, payload?: any) => Promise<void>;
  runtimeEvents?: GameEventMessage[];
};

export default function GameCanvas({ worldState, onAction, runtimeEvents = [] }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const worldRef = useRef<PixiWorld | null>(null);

  useEffect(() => {
    if (!hostRef.current) {
      return;
    }

    let disposed = false;
    const world = new PixiWorld((action, payload) => {
      onAction(action, payload).catch(() => undefined);
    });

    world
      .mount(hostRef.current, worldState)
      .then(() => {
        if (disposed) {
          world.destroy();
          return;
        }
        worldRef.current = world;
      })
      .catch(() => undefined);

    return () => {
      disposed = true;
      worldRef.current?.destroy();
      worldRef.current = null;
    };
  }, []);

  useEffect(() => {
    worldRef.current?.update(worldState);
  }, [worldState]);

  useEffect(() => {
    worldRef.current?.handleEvents(runtimeEvents);
  }, [runtimeEvents]);

  return <div ref={hostRef} className="game-host" />;
}
