# AI code hints

Guidance for AI coding assistants (Junie, Copilot, Claude, etc.) working in this repo.

## Code style

- Prefer `const` arrow functions over `function` declarations, including React
  components and top-level helpers:

  ```ts
  // Yes
  export const formatScore = (score: number): string => `${score} pts`;
  export const Scoreboard = ({ guild }: { guild: GuildDetail }) => { ... };

  // No
  export function formatScore(score: number): string { ... }
  export function Scoreboard({ guild }: { guild: GuildDetail }) { ... }
  ```

  `const` isn't hoisted, so define a function before any code that runs at
  module load and calls it. References from inside callbacks and JSX are fine.

## Web pages: container / hook / view

Every page in `apps/web/src/pages` lives in its own folder, named after the
page, and is split into three files:

```
pages/HigherLowerLeaderboard/
  useHigherLowerLeaderboard.ts            // hook: state, effects, API calls, handlers
  HigherLowerLeaderboard.view.tsx         // view: props in, JSX out
  HigherLowerLeaderboard.container.tsx    // container: wires the hook to the view
```

- **Container** (`X.container.tsx`, exports `XContainer`) is the only thing
  the router, the Dashboard or a parent tab shell renders. It takes the
  page's inputs (`guild`, `route`, `router`, ids), calls the hook and renders
  the view - nothing else:

  ```tsx
  export const XContainer = ({ guild }: { guild: GuildDetail }) => (
    <XView {...useX({ guild })} />
  );
  ```

- **Hook** (`useX.ts`, exports `useX`) owns everything stateful: `useState`,
  `useEffect`, data loading, API calls, `useNotify`, `Form.useForm`, derived
  values and event handlers. It is a `.ts` file, so no JSX - anything that
  needs markup belongs in the view. Its return type is the view's props:
  `export const useX = (...): XViewProps => { ... }`.
- **View** (`X.view.tsx`, exports `XView` and `interface XViewProps`) is
  presentational: it renders only from its props, with no `useState`,
  `useEffect` or API calls. Pass through anything it needs (`guild`,
  `router`) via the hook's return value.
- A sub-component only one page uses goes in a `components/` folder inside
  that page's folder - not inline in the view file. A purely presentational
  one is a single file (`pages/X/components/Y.tsx`); one with state of its
  own gets its own folder with the same three files
  (`pages/X/components/Y/useY.ts`, `Y.view.tsx`, `Y.container.tsx`). A
  sub-component's own sub-components go in its own `components/` folder the
  same way.
- A component used by more than one page goes in `src/components` instead.
- Page-level doc comments ("what this page is and why") go on the container;
  comments about data and behaviour go with the code they describe in the hook.

- Don't use a lot of comments to explain what the code does. If you feel the need to, consider
  refactoring the code into smaller functions with descriptive names instead.
