'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Pause, Play, RotateCcw, Search, Square } from 'lucide-react';
import {
  Alignment,
  Fit,
  Layout,
  useRive,
  type RiveFile,
} from '@rive-app/react-canvas';

type RiveManifest = {
  assets: Record<string, string[]>;
};

type RiveAsset = {
  group: string;
  name: string;
  path: string;
  src: string;
};

type PlaybackMode = 'animation' | 'stateMachine';

type RiveMetadata = {
  animations: string[];
  stateMachines: string[];
};

const previewLayout = new Layout({
  fit: Fit.Contain,
  alignment: Alignment.Center,
});

function fileLabel(path: string) {
  return path.split('/').pop()?.replace(/\.riv$/, '') ?? path;
}

function RivePreviewStage({
  asset,
  mode,
  selectedAnimation,
  selectedStateMachine,
  reloadToken,
  onMetadata,
  onReady,
}: {
  asset: RiveAsset | null;
  mode: PlaybackMode;
  selectedAnimation: string;
  selectedStateMachine: string;
  reloadToken: number;
  onMetadata: (metadata: RiveMetadata) => void;
  onReady: (rive: unknown) => void;
}) {
  const { RiveComponent, rive } = useRive({
    src: asset?.src,
    autoplay: true,
    animations: mode === 'animation' && selectedAnimation ? selectedAnimation : undefined,
    stateMachines:
      mode === 'stateMachine' && selectedStateMachine ? selectedStateMachine : undefined,
    layout: previewLayout,
    shouldDisableRiveListeners: false,
  });

  useEffect(() => {
    if (!rive) return;

    const runtime = rive as unknown as {
      animationNames?: string[];
      stateMachineNames?: string[];
      riveFile?: RiveFile & {
        animationNames?: string[];
        stateMachineNames?: string[];
      };
    };

    onReady(rive);
    onMetadata({
      animations: runtime.animationNames ?? runtime.riveFile?.animationNames ?? [],
      stateMachines: runtime.stateMachineNames ?? runtime.riveFile?.stateMachineNames ?? [],
    });
  }, [rive, onMetadata, onReady]);

  if (!asset) {
    return (
      <div className="flex h-full items-center justify-center text-sm font-bold text-[#777]">
        Select a Rive asset
      </div>
    );
  }

  return <RiveComponent className="h-full w-full" />;
}

export default function RivePreviewPage() {
  const [assets, setAssets] = useState<RiveAsset[]>([]);
  const [selectedPath, setSelectedPath] = useState('');
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<PlaybackMode>('animation');
  const [selectedAnimation, setSelectedAnimation] = useState('');
  const [selectedStateMachine, setSelectedStateMachine] = useState('');
  const [metadata, setMetadata] = useState<RiveMetadata>({
    animations: [],
    stateMachines: [],
  });
  const [runtime, setRuntime] = useState<unknown>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [loadError, setLoadError] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    let isMounted = true;

    async function loadManifest() {
      try {
        const response = await fetch('/assets/rive/manifest.json');
        if (!response.ok) throw new Error(`Manifest request failed: ${response.status}`);
        const manifest = (await response.json()) as RiveManifest;
        const nextAssets = Object.entries(manifest.assets).flatMap(([group, paths]) =>
          paths.map((path) => ({
            group,
            name: fileLabel(path),
            path,
            src: `/assets/rive/${path}`,
          })),
        );

        if (!isMounted) return;
        setAssets(nextAssets);
        setSelectedPath(nextAssets[0]?.path ?? '');
        setExpandedGroups(new Set(Object.keys(manifest.assets).slice(0, 1)));
      } catch (error) {
        if (!isMounted) return;
        setLoadError(error instanceof Error ? error.message : 'Failed to load Rive manifest');
      }
    }

    loadManifest();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.path === selectedPath) ?? null,
    [assets, selectedPath],
  );

  const filteredAssets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return assets;

    return assets.filter((asset) =>
      `${asset.group} ${asset.path}`.toLowerCase().includes(normalizedQuery),
    );
  }, [assets, query]);

  const groupedAssets = useMemo(() => {
    return filteredAssets.reduce<Record<string, RiveAsset[]>>((acc, asset) => {
      const groupAssets = acc[asset.group] ?? [];
      groupAssets.push(asset);
      acc[asset.group] = groupAssets;
      return acc;
    }, {});
  }, [filteredAssets]);

  const visibleGroups = useMemo(() => {
    const hasQuery = query.trim().length > 0;
    return new Set([
      ...Array.from(expandedGroups),
      ...(hasQuery ? Object.keys(groupedAssets) : []),
    ]);
  }, [expandedGroups, groupedAssets, query]);

  useEffect(() => {
    setMetadata({ animations: [], stateMachines: [] });
    setSelectedAnimation('');
    setSelectedStateMachine('');
    setRuntime(null);
    setReloadToken((value) => value + 1);
  }, [selectedPath]);

  useEffect(() => {
    if (mode === 'animation' && !selectedAnimation && metadata.animations[0]) {
      setSelectedAnimation(metadata.animations[0]);
    }
    if (mode === 'stateMachine' && !selectedStateMachine && metadata.stateMachines[0]) {
      setSelectedStateMachine(metadata.stateMachines[0]);
    }
  }, [metadata, mode, selectedAnimation, selectedStateMachine]);

  function control(action: 'play' | 'pause' | 'stop' | 'reset') {
    const rive = runtime as {
      play?: (name?: string) => void;
      pause?: (name?: string) => void;
      stop?: (name?: string) => void;
      reset?: () => void;
    } | null;

    if (!rive) return;
    const activeName = mode === 'animation' ? selectedAnimation : selectedStateMachine;

    if (action === 'reset') {
      rive.reset?.();
      setReloadToken((value) => value + 1);
      return;
    }

    rive[action]?.(activeName || undefined);
  }

  function toggleGroup(group: string) {
    setExpandedGroups((current) => {
      const next = new Set(current);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  }

  return (
    <main className="min-h-screen bg-[#f7f7f7] text-[#3c3c3c]">
      <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col gap-5 px-4 py-5 lg:flex-row">
        <aside className="flex min-h-0 w-full flex-col rounded-lg border-2 border-[#e5e5e5] bg-white lg:w-[360px]">
          <div className="border-b-2 border-[#e5e5e5] p-4">
            <h1 className="text-xl font-black">Rive Preview</h1>
            <div className="mt-3 flex h-11 items-center gap-2 rounded-lg border-2 border-[#e5e5e5] bg-[#f7f7f7] px-3">
              <Search className="h-4 w-4 text-[#777]" aria-hidden />
              <input
                className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-[#999]"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search assets"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {loadError ? (
              <div className="rounded-lg border-2 border-[#ffb3b3] bg-[#fff1f1] p-3 text-sm font-bold text-[#d23f31]">
                {loadError}
              </div>
            ) : null}

            {Object.entries(groupedAssets).map(([group, groupAssets]) => (
              <section key={group} className="mb-4">
                <button
                  type="button"
                  onClick={() => toggleGroup(group)}
                  className="mb-2 flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-xs font-black uppercase text-[#777] hover:bg-[#f7f7f7]"
                >
                  {visibleGroups.has(group) ? (
                    <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
                  )}
                  <span className="min-w-0 flex-1 truncate">{group}</span>
                  <span className="shrink-0 rounded-full bg-[#f0f0f0] px-2 py-0.5 text-[11px]">
                    {groupAssets.length}
                  </span>
                </button>
                {visibleGroups.has(group) ? (
                  <div className="space-y-1">
                    {groupAssets.map((asset) => {
                      const isActive = asset.path === selectedPath;
                      return (
                        <button
                          key={asset.path}
                          type="button"
                          onClick={() => setSelectedPath(asset.path)}
                          className={[
                            'flex h-12 w-full items-center justify-between rounded-md px-3 text-left transition',
                            isActive
                              ? 'bg-[#ddf4ff] text-[#0e8fcc]'
                              : 'hover:bg-[#f2f2f2] text-[#3c3c3c]',
                          ].join(' ')}
                        >
                          <span className="min-w-0 truncate text-sm font-black">{asset.name}</span>
                          <span className="ml-3 shrink-0 text-xs font-bold text-[#999]">.riv</span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </section>
            ))}
          </div>
        </aside>

        <section className="flex min-h-[720px] flex-1 flex-col rounded-lg border-2 border-[#e5e5e5] bg-white">
          <div className="flex flex-col gap-3 border-b-2 border-[#e5e5e5] p-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="truncate text-lg font-black">{selectedAsset?.name ?? 'No asset'}</div>
              <div className="truncate text-sm font-bold text-[#777]">
                {selectedAsset?.src ?? 'Manifest has no Rive files'}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex h-10 overflow-hidden rounded-md border-2 border-[#e5e5e5]">
                <button
                  type="button"
                  onClick={() => setMode('animation')}
                  className={`px-3 text-sm font-black ${
                    mode === 'animation' ? 'bg-[#1cb0f6] text-white' : 'bg-white text-[#4b4b4b]'
                  }`}
                >
                  Animations
                </button>
                <button
                  type="button"
                  onClick={() => setMode('stateMachine')}
                  className={`border-l-2 border-[#e5e5e5] px-3 text-sm font-black ${
                    mode === 'stateMachine' ? 'bg-[#1cb0f6] text-white' : 'bg-white text-[#4b4b4b]'
                  }`}
                >
                  State Machines
                </button>
              </div>

              <select
                className="h-10 max-w-[280px] rounded-md border-2 border-[#e5e5e5] bg-white px-3 text-sm font-bold outline-none"
                value={mode === 'animation' ? selectedAnimation : selectedStateMachine}
                onChange={(event) =>
                  mode === 'animation'
                    ? setSelectedAnimation(event.target.value)
                    : setSelectedStateMachine(event.target.value)
                }
              >
                {(mode === 'animation' ? metadata.animations : metadata.stateMachines).length ? (
                  (mode === 'animation' ? metadata.animations : metadata.stateMachines).map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))
                ) : (
                  <option value="">No {mode === 'animation' ? 'animations' : 'state machines'}</option>
                )}
              </select>

              <button
                type="button"
                aria-label="Play"
                title="Play"
                onClick={() => control('play')}
                className="grid h-10 w-10 place-items-center rounded-md border-2 border-[#58a700] bg-[#58cc02] text-white"
              >
                <Play className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Pause"
                title="Pause"
                onClick={() => control('pause')}
                className="grid h-10 w-10 place-items-center rounded-md border-2 border-[#e5e5e5] bg-white text-[#4b4b4b]"
              >
                <Pause className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Stop"
                title="Stop"
                onClick={() => control('stop')}
                className="grid h-10 w-10 place-items-center rounded-md border-2 border-[#e5e5e5] bg-white text-[#4b4b4b]"
              >
                <Square className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Reload"
                title="Reload"
                onClick={() => control('reset')}
                className="grid h-10 w-10 place-items-center rounded-md border-2 border-[#e5e5e5] bg-white text-[#4b4b4b]"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid flex-1 grid-rows-[1fr_auto] gap-4 p-4">
            <div className="flex min-h-[460px] items-start justify-center rounded-lg border-2 border-dashed border-[#d7d7d7] bg-[#fbfbfb] p-4">
              <div className="h-[420px] w-full max-w-[640px] overflow-hidden rounded-md bg-white shadow-[inset_0_0_0_2px_#eeeeee]">
                <RivePreviewStage
                  key={`${selectedAsset?.src ?? 'none'}-${mode}-${selectedAnimation}-${selectedStateMachine}-${reloadToken}`}
                  asset={selectedAsset}
                  mode={mode}
                  selectedAnimation={selectedAnimation}
                  selectedStateMachine={selectedStateMachine}
                  reloadToken={reloadToken}
                  onMetadata={setMetadata}
                  onReady={setRuntime}
                />
              </div>
            </div>

            <div className="grid gap-3 text-sm font-bold text-[#4b4b4b] md:grid-cols-3">
              <div className="rounded-lg bg-[#f7f7f7] p-3">
                <div className="text-xs font-black uppercase text-[#777]">Animations</div>
                <div className="mt-1">{metadata.animations.length}</div>
              </div>
              <div className="rounded-lg bg-[#f7f7f7] p-3">
                <div className="text-xs font-black uppercase text-[#777]">State Machines</div>
                <div className="mt-1">{metadata.stateMachines.length}</div>
              </div>
              <div className="rounded-lg bg-[#f7f7f7] p-3">
                <div className="text-xs font-black uppercase text-[#777]">Assets</div>
                <div className="mt-1">{assets.length}</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
