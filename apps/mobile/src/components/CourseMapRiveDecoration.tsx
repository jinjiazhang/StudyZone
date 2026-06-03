import { memo, type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import { Alignment, Fit, RiveView, useRiveFile } from '@rive-app/react-native';
import type { RiveFile } from '@rive-app/react-native';
import type { UnitMapDecorationDto } from '@studyzone/shared-types';

import { resolveAssetUrl } from '@/lib/assets';

type NativeRiveViewProps = {
  file: RiveFile;
  autoPlay?: boolean;
  fit?: Fit;
  alignment?: Alignment;
  stateMachineName?: string;
  style?: object;
};

const NativeRiveView = RiveView as unknown as (props: NativeRiveViewProps) => ReactElement;

export const CourseMapRiveDecoration = memo(function CourseMapRiveDecoration({
  decoration,
  size,
}: {
  decoration: UnitMapDecorationDto;
  size: number;
}) {
  const src = resolveAssetUrl(decoration.src);
  const { riveFile } = useRiveFile(src);

  if (!src || !riveFile) {
    return <View pointerEvents="none" style={[styles.wrap, { width: size, height: size }]} />;
  }

  return (
    <View pointerEvents="none" style={[styles.wrap, { width: size, height: size }]}>
      <NativeRiveView
        file={riveFile}
        autoPlay
        fit={Fit.Contain}
        alignment={Alignment.Center}
        stateMachineName={decoration.stateMachine}
        style={styles.rive}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  rive: {
    flex: 1,
  },
});
