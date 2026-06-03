import { memo, type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import type { UnitMapDecorationDto } from '@studyzone/shared-types';

import { resolveAssetUrl } from '@/lib/assets';

type RiveRuntime = {
  Alignment: { Center: unknown };
  Fit: { Contain: unknown };
  RiveView: unknown;
  useRiveFile: (src: string) => { riveFile?: unknown };
};

type NativeRiveViewProps = {
  file: unknown;
  autoPlay?: boolean;
  fit?: unknown;
  alignment?: unknown;
  stateMachineName?: string;
  style?: object;
};

let cachedRiveRuntime: RiveRuntime | null | undefined;

function getRiveRuntime(): RiveRuntime | null {
  if (Constants.appOwnership === 'expo') return null;
  if (cachedRiveRuntime !== undefined) return cachedRiveRuntime;

  try {
    cachedRiveRuntime = require('@rive-app/react-native') as RiveRuntime;
  } catch {
    cachedRiveRuntime = null;
  }

  return cachedRiveRuntime;
}

export const MapDecoration = memo(function MapDecoration({
  decoration,
  size,
}: {
  decoration: UnitMapDecorationDto;
  size: number;
}) {
  const riveRuntime = getRiveRuntime();

  if (!riveRuntime) {
    return <MapDecorationPlaceholder size={size} />;
  }

  return <NativeMapDecoration decoration={decoration} riveRuntime={riveRuntime} size={size} />;
});

function NativeMapDecoration({
  decoration,
  riveRuntime,
  size,
}: {
  decoration: UnitMapDecorationDto;
  riveRuntime: RiveRuntime;
  size: number;
}) {
  const src = resolveAssetUrl(decoration.src);
  const { riveFile } = riveRuntime.useRiveFile(src ?? '');
  const NativeRiveView = riveRuntime.RiveView as (props: NativeRiveViewProps) => ReactElement;

  if (!src || !riveFile) {
    return <MapDecorationPlaceholder size={size} />;
  }

  return (
    <View pointerEvents="none" style={[styles.wrap, { width: size, height: size }]}>
      <NativeRiveView
        file={riveFile}
        autoPlay
        fit={riveRuntime.Fit.Contain}
        alignment={riveRuntime.Alignment.Center}
        stateMachineName={decoration.stateMachine}
        style={styles.rive}
      />
    </View>
  );
}

function MapDecorationPlaceholder({ size }: { size: number }) {
  return <View pointerEvents="none" style={[styles.wrap, { width: size, height: size }]} />;
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  rive: {
    flex: 1,
  },
});
