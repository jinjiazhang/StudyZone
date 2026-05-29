import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { RotateCcw, Eye } from 'lucide-react-native';
import { colors, fonts, radius } from '../lib/theme';

/**
 * 看拼音写字 — React Native counterpart of the web PinyinToCharacterWrite
 * exercise. React Native has no DOM, so we run the exact same `hanzi-writer`
 * library inside a WebView (loaded from the same jsDelivr CDN the web app
 * relies on) and bridge its quiz callbacks back over `postMessage`.
 *
 * Behaviour mirrors web:
 *   - Stroke-by-stroke quiz; wrong strokes flash and increment `mistakes`.
 *   - The built-in auto-hint is disabled; a manual "显示轮廓" button appears
 *     only after the learner misses the SAME stroke 3 times in a row.
 *   - On completion the canonical outline stays on-screen for comparison and
 *     the result is reported up via `onComplete`.
 *   - "重写" resets the quiz.
 *
 * The parent owns the answer payload: `onComplete({ mistakes, completed })`
 * fires when the character is finished, `onSkip()` when the learner gives up.
 */

const CANVAS = 280;
const HINT_BUTTON_REVEAL_THRESHOLD = 3;
const DEFAULT_BLANK_PLACEHOLDER = '__';

type WriteResult = { mistakes: number; completed: boolean };

export function HanziWriterCanvas({
  character,
  pinyin,
  sentence,
  blankPlaceholder,
  allowedMistakes = 3,
  leniency = 1.0,
  disabled,
  completedResult,
  onComplete,
  onSkip,
}: {
  character: string;
  pinyin: string;
  sentence: string;
  blankPlaceholder?: string;
  allowedMistakes?: number;
  leniency?: number;
  disabled?: boolean;
  /** When set, the answer has been recorded (drives the blank reveal). */
  completedResult?: WriteResult | null;
  onComplete: (result: WriteResult) => void;
  onSkip: (result: WriteResult) => void;
}) {
  const webRef = useRef<WebView | null>(null);
  const consecutiveMistakesRef = useRef(0);
  const submittedRef = useRef(false);

  const [mistakes, setMistakes] = useState(0);
  const [strokesDone, setStrokesDone] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showingOutline, setShowingOutline] = useState(false);
  const [hintButtonRevealed, setHintButtonRevealed] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const placeholder = blankPlaceholder || DEFAULT_BLANK_PLACEHOLDER;
  const [before, after] = useMemo(() => splitOnce(sentence, placeholder), [sentence, placeholder]);
  const revealed = completed || !!completedResult;

  const html = useMemo(
    () => buildHtml(character, leniency),
    [character, leniency],
  );

  const onMessage = useCallback(
    (e: WebViewMessageEvent) => {
      let msg: any;
      try {
        msg = JSON.parse(e.nativeEvent.data);
      } catch {
        return;
      }
      switch (msg.type) {
        case 'mistake': {
          setMistakes(msg.totalMistakes);
          consecutiveMistakesRef.current += 1;
          if (consecutiveMistakesRef.current >= HINT_BUTTON_REVEAL_THRESHOLD) {
            setHintButtonRevealed(true);
          }
          break;
        }
        case 'stroke': {
          setStrokesDone(msg.strokeNum + 1);
          consecutiveMistakesRef.current = 0;
          break;
        }
        case 'complete': {
          setCompleted(true);
          setMistakes(msg.totalMistakes);
          setShowingOutline(true);
          setHintButtonRevealed(true);
          if (submittedRef.current) break;
          submittedRef.current = true;
          onComplete({ mistakes: msg.totalMistakes, completed: true });
          break;
        }
        case 'error': {
          setLoadError(
            '汉字数据加载失败，请检查网络（hanzi-writer 默认从 jsDelivr CDN 拉取笔顺数据）。',
          );
          break;
        }
      }
    },
    [onComplete],
  );

  function inject(js: string) {
    webRef.current?.injectJavaScript(`${js}; true;`);
  }

  function handleReset() {
    if (disabled) return;
    submittedRef.current = false;
    consecutiveMistakesRef.current = 0;
    setMistakes(0);
    setStrokesDone(0);
    setCompleted(false);
    setShowingOutline(false);
    setHintButtonRevealed(false);
    inject('window.szReset && window.szReset()');
  }

  function handleToggleHint() {
    if (disabled || loadError) return;
    const next = !showingOutline;
    setShowingOutline(next);
    inject(`window.szShowOutline && window.szShowOutline(${next})`);
  }

  function handleSkip() {
    if (disabled || submittedRef.current) return;
    submittedRef.current = true;
    inject('window.szReveal && window.szReveal()');
    onSkip({ mistakes: Math.max(mistakes, allowedMistakes + 1), completed: false });
  }

  const overBudget = mistakes > allowedMistakes;

  return (
    <View style={{ gap: 16 }}>
      <Text style={styles.labelSmall}>看拼音写字</Text>

      {/* Sentence with highlighted blank */}
      <View style={styles.sentenceCard}>
        <Text style={styles.sentenceText}>
          {before}
          <Text style={[styles.blank, revealed ? styles.blankDone : styles.blankPending]}>
            {revealed ? character : '？'}
          </Text>
          {after}
        </Text>
        <Text style={styles.pinyin}>{pinyin}</Text>
      </View>

      {/* Drawing canvas */}
      <View style={styles.canvasWrap}>
        <View style={styles.canvas}>
          <WebView
            ref={webRef}
            originWhitelist={['*']}
            source={{ html }}
            onMessage={onMessage}
            scrollEnabled={false}
            javaScriptEnabled
            domStorageEnabled
            style={styles.webview}
            // Block further drawing once the attempt has been graded.
            pointerEvents={disabled ? 'none' : 'auto'}
          />
          {loadError && (
            <View style={styles.errorOverlay}>
              <Text style={styles.errorText}>{loadError}</Text>
            </View>
          )}
        </View>

        {/* Status row */}
        <View style={styles.statusRow}>
          <Text style={[styles.statusText, overBudget && { color: colors.roseDark }]}>
            错笔：{mistakes} / {allowedMistakes}
          </Text>
          <Text style={styles.statusText}>已写：{strokesDone} 笔</Text>
        </View>

        {/* Toolbar */}
        <View style={styles.toolbar}>
          <Pressable
            onPress={handleReset}
            disabled={disabled}
            style={[styles.toolBtn, disabled && { opacity: 0.5 }]}
          >
            <RotateCcw size={16} color={colors.inkSoft} />
            <Text style={styles.toolBtnText}>重写</Text>
          </Pressable>
          {hintButtonRevealed && (
            <Pressable
              onPress={handleToggleHint}
              disabled={disabled || !!loadError}
              style={[styles.toolBtn, showingOutline && styles.toolBtnActive, disabled && { opacity: 0.5 }]}
            >
              <Eye size={16} color={showingOutline ? colors.white : colors.inkSoft} />
              <Text style={[styles.toolBtnText, showingOutline && { color: colors.white }]}>
                {showingOutline ? '隐藏轮廓' : '显示轮廓'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Skip — mirrors web: judged wrong, costs a heart, lets the lesson advance. */}
      {!revealed && (
        <Pressable onPress={handleSkip} disabled={disabled} style={styles.skipBtn}>
          <Text style={styles.skipBtnText}>写不出来，跳过</Text>
        </Pressable>
      )}
    </View>
  );
}

function splitOnce(haystack: string, needle: string): [string, string] {
  const idx = haystack.indexOf(needle);
  if (idx === -1) return [haystack, ''];
  return [haystack.slice(0, idx), haystack.slice(idx + needle.length)];
}

/**
 * Self-contained HTML that loads hanzi-writer (UMD, jsDelivr — same source as
 * the web app) and runs a quiz, bridging callbacks to RN via postMessage.
 */
function buildHtml(character: string, leniency: number): string {
  const safeChar = JSON.stringify(character);
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<style>
  html, body { margin: 0; padding: 0; background: #fff; overflow: hidden; }
  #wrap { position: relative; width: ${CANVAS}px; height: ${CANVAS}px; margin: 0 auto; }
  .grid { position: absolute; inset: 0; pointer-events: none; }
  .grid .v { position: absolute; left: 50%; top: 0; width: 1px; height: 100%; transform: translateX(-50%); background: rgba(229,229,229,0.6); }
  .grid .h { position: absolute; left: 0; top: 50%; width: 100%; height: 1px; transform: translateY(-50%); background: rgba(229,229,229,0.6); }
  .grid .box { position: absolute; inset: 8px; border: 1px dashed rgba(229,229,229,0.5); }
  #target { position: absolute; inset: 0; }
</style>
</head>
<body>
  <div id="wrap">
    <div class="grid"><div class="v"></div><div class="h"></div><div class="box"></div></div>
    <div id="target"></div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/hanzi-writer@3.5/dist/hanzi-writer.min.js"></script>
  <script>
    var RN = window.ReactNativeWebView;
    function post(o){ try { RN && RN.postMessage(JSON.stringify(o)); } catch(e){} }
    var writer = null;
    var CHAR = ${safeChar};
    var LENIENCY = ${Number.isFinite(leniency) ? leniency : 1.0};

    function startQuiz(){
      writer.quiz({
        showHintAfterMisses: Infinity,
        leniency: LENIENCY,
        onMistake: function(d){ post({ type:'mistake', totalMistakes: d.totalMistakes, strokeNum: d.strokeNum }); },
        onCorrectStroke: function(d){ post({ type:'stroke', strokeNum: d.strokeNum }); },
        onComplete: function(d){
          try { writer.showOutline(); } catch(e){}
          post({ type:'complete', totalMistakes: d.totalMistakes });
        }
      });
    }

    function boot(){
      if (!window.HanziWriter){ post({ type:'error' }); return; }
      try {
        var host = document.getElementById('target');
        host.innerHTML = '';
        writer = HanziWriter.create(host, CHAR, {
          width: ${CANVAS}, height: ${CANVAS}, padding: 8,
          showCharacter: false, showOutline: false,
          strokeColor: '#1f2937', outlineColor: '#d1d5db',
          highlightColor: '#f43f5e', drawingWidth: 28,
          strokeAnimationSpeed: 1.0
        });
        startQuiz();
        post({ type:'ready' });
      } catch(e){ post({ type:'error' }); }
    }

    window.szReset = function(){
      if (!writer) return;
      try { writer.cancelQuiz(); writer.hideOutline(); writer.hideCharacter(); } catch(e){}
      startQuiz();
    };
    window.szShowOutline = function(show){
      if (!writer) return;
      try { show ? writer.showOutline() : writer.hideOutline(); } catch(e){}
    };
    window.szReveal = function(){
      if (!writer) return;
      try { writer.cancelQuiz(); writer.showCharacter(); } catch(e){}
    };

    if (window.HanziWriter) boot();
    else {
      var t = 0, iv = setInterval(function(){
        if (window.HanziWriter){ clearInterval(iv); boot(); }
        else if (++t > 50){ clearInterval(iv); post({ type:'error' }); }
      }, 100);
    }
  </script>
</body>
</html>`;
}

const styles = StyleSheet.create({
  labelSmall: {
    fontFamily: fonts.heavy,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.inkSoft,
  },
  sentenceCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.mist,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
  },
  sentenceText: { fontFamily: fonts.heavy, fontSize: 24, lineHeight: 36, color: colors.ink },
  blank: {
    fontFamily: fonts.heavy,
    fontSize: 24,
    paddingHorizontal: 6,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  blankPending: { color: colors.skyDark, backgroundColor: colors.white },
  blankDone: { color: colors.greenDark, backgroundColor: colors.greenSoft },
  pinyin: { fontFamily: fonts.heavy, fontSize: 16, color: colors.skyDark, letterSpacing: 1 },
  canvasWrap: { alignItems: 'center', gap: 12 },
  canvas: {
    width: CANVAS,
    height: CANVAS,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  webview: { flex: 1, backgroundColor: 'transparent' },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  errorText: { fontFamily: fonts.heavy, fontSize: 13, color: colors.roseDark, textAlign: 'center' },
  statusRow: { flexDirection: 'row', gap: 16 },
  statusText: { fontFamily: fonts.heavy, fontSize: 13, color: colors.inkSoft },
  toolbar: { flexDirection: 'row', gap: 8 },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  toolBtnActive: { backgroundColor: colors.sky, borderColor: colors.skyDark },
  toolBtnText: { fontFamily: fonts.heavy, fontSize: 13, color: colors.inkSoft },
  skipBtn: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  skipBtnText: { fontFamily: fonts.heavy, fontSize: 13, color: colors.inkSoft },
});
