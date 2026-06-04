import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Volume2 } from 'lucide-react-native';
import type { PictureOrderPrompt } from '@studyzone/shared-types';
import { colors, fonts, radius } from '@/lib/theme';
import { resolveAssetUrl } from '@/lib/assets';
import { useAudio } from '@/lib/audio';
import { exerciseStyles as s } from './styles';
import { SubmitButton } from './SubmitButton';

export function PictureOrderExercise({
  prompt,
  onSubmit,
  disabled,
}: {
  prompt: PictureOrderPrompt;
  onSubmit: (payload: { orderedIds: string[] }) => void;
  disabled?: boolean;
}) {
  const [picked, setPicked] = useState<number[]>([]);
  const { play } = useAudio();
  const remaining = useMemo(
    () => prompt.items.map((_, index) => index).filter((index) => !picked.includes(index)),
    [picked, prompt.items],
  );

  function Card({ index, order }: { index: number; order?: number }) {
    const item = prompt.items[index]!;
    const selected = order !== undefined;
    return (
      <Pressable
        onPress={() => {
          if (disabled) return;
          selected ? setPicked(picked.filter((_, i) => i !== order)) : setPicked([...picked, index]);
        }}
        style={[local.card, item.imageUrl ? local.cardImage : local.cardText, selected && local.cardSelected]}
      >
        {selected && (
          <View style={local.badge}>
            <Text style={local.badgeText}>{order + 1}</Text>
          </View>
        )}
        {item.imageUrl && (
          <Image source={{ uri: resolveAssetUrl(item.imageUrl) }} style={local.image} />
        )}
        {item.text && <Text style={local.cardLabel}>{item.text}</Text>}
        {item.audioUrl && (
          <Pressable onPress={() => play(item.audioUrl)} style={local.audioChip}>
            <Volume2 size={14} color={colors.white} />
          </Pressable>
        )}
      </Pressable>
    );
  }

  return (
    <View style={s.container}>
      <Text style={s.labelSmall}>排序</Text>
      <View style={s.promptCard}>
        <Text style={s.promptBold}>{prompt.instruction}</Text>
      </View>

      <View style={local.answerBank}>
        {picked.length === 0 ? (
          <Text style={local.hint}>按正确顺序点击下方卡片</Text>
        ) : (
          picked.map((itemIndex, order) => (
            <Card key={`${itemIndex}-${order}`} index={itemIndex} order={order} />
          ))
        )}
      </View>

      <View style={local.pool}>
        {remaining.map((itemIndex) => (
          <Card key={itemIndex} index={itemIndex} />
        ))}
      </View>

      <SubmitButton
        onPress={() => onSubmit({ orderedIds: picked.map((index) => prompt.items[index]!.id) })}
        disabled={picked.length !== prompt.items.length || disabled}
      />
    </View>
  );
}

const local = StyleSheet.create({
  answerBank: {
    minHeight: 110,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    padding: 10,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.line,
    backgroundColor: colors.mist,
    alignItems: 'center',
  },
  pool: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  hint: { fontFamily: fonts.heavy, fontSize: 13, color: colors.inkSoft, margin: 'auto' },
  card: {
    overflow: 'hidden',
    borderRadius: radius.lg,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  cardImage: { width: 110 },
  cardText: { paddingHorizontal: 14, paddingVertical: 12 },
  cardSelected: { borderColor: colors.sky, backgroundColor: '#EFF6FF' },
  image: { width: '100%', aspectRatio: 1, backgroundColor: colors.mist },
  cardLabel: { fontFamily: fonts.heavy, fontSize: 14, color: colors.ink, padding: 6, textAlign: 'center' },
  badge: {
    position: 'absolute',
    left: 4,
    top: 4,
    zIndex: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.sky,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: fonts.heavy, fontSize: 11, color: colors.white },
  audioChip: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.sky,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
