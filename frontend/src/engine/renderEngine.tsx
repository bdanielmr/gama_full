import { componentRegistry } from './componentRegistry';
import type { GameEventMessage, WorldTemplate } from '../types';

type Props = {
  worldState: WorldTemplate;
  onAction: (action: string, payload?: any) => Promise<void>;
  runtimeEvents?: GameEventMessage[];
};

export default function RenderEngine({ worldState, onAction, runtimeEvents = [] }: Props) {
  return (
    <main className="layout-grid">
      {worldState.layout.components.map((componentConfig) => {
        const componentName = componentConfig.component || componentConfig.type || 'Unknown';
        const Component = componentRegistry[componentName];

        if (!Component) {
          return (
            <section key={componentConfig.id} className="card">
              <h2>Unknown component</h2>
              <p>{componentName}</p>
            </section>
          );
        }

        return (
          <Component
            key={componentConfig.id}
            worldState={worldState}
            onAction={onAction}
            runtimeEvents={runtimeEvents}
            {...(componentConfig.props || {})}
          />
        );
      })}
    </main>
  );
}
