import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import type { UnitMapDecorationDto } from '@studyzone/shared-types';

import { resolveAssetUrl } from '@/lib/assets';

const RIVE_RUNTIME_URL = '/assets/rive/runtime/rive.js';

export const CourseMapRiveDecoration = memo(function CourseMapRiveDecoration({
  decoration,
  size,
}: {
  decoration: UnitMapDecorationDto;
  size: number;
}) {
  const src = resolveAssetUrl(decoration.src);
  const runtimeSrc = resolveAssetUrl(RIVE_RUNTIME_URL);
  const html = useMemo(
    () =>
      src && runtimeSrc
        ? buildRiveHtml({
            src,
            runtimeSrc,
            stateMachine: decoration.stateMachine,
            animation: decoration.animation,
          })
        : '',
    [decoration.animation, decoration.stateMachine, runtimeSrc, src],
  );

  if (!src || !runtimeSrc) return null;

  return (
    <View pointerEvents="none" style={[styles.wrap, { width: size, height: size }]}>
      <WebView
        originWhitelist={['*']}
        source={{ html, baseUrl: src }}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        javaScriptEnabled
        domStorageEnabled={false}
        mixedContentMode="always"
        style={styles.webview}
      />
    </View>
  );
});

function buildRiveHtml({
  src,
  runtimeSrc,
  stateMachine,
  animation,
}: {
  src: string;
  runtimeSrc: string;
  stateMachine?: string;
  animation?: string;
}) {
  const config = JSON.stringify({
    src,
    stateMachine,
    animation,
  });

  return `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <style>
      html, body, canvas {
        width: 100%;
        height: 100%;
        margin: 0;
        overflow: hidden;
        background: transparent;
      }
      canvas {
        display: block;
      }
    </style>
  </head>
  <body>
    <canvas id="rive-canvas"></canvas>
    <script src="${runtimeSrc}"></script>
    <script>
      const config = ${config};
      const canvas = document.getElementById('rive-canvas');
      function resizeCanvas() {
        const scale = window.devicePixelRatio || 1;
        canvas.width = Math.max(1, Math.floor(window.innerWidth * scale));
        canvas.height = Math.max(1, Math.floor(window.innerHeight * scale));
      }
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      window.addEventListener('load', function () {
        new rive.Rive({
          src: config.src,
          canvas,
          autoplay: true,
          stateMachines: config.stateMachine ? [config.stateMachine] : undefined,
          animations: config.animation ? [config.animation] : undefined,
          layout: new rive.Layout({
            fit: rive.Fit.Contain,
            alignment: rive.Alignment.Center,
          }),
          onLoad: function (instance) {
            instance.resizeDrawingSurfaceToCanvas();
          },
        });
      });
    </script>
  </body>
</html>`;
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
