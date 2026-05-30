import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Volume2 } from 'lucide-react-native';
import type { ListenInputPrompt } from '@studyzone/shared-types';
import { colors } from '@/lib/theme';
import { useAudioPlayer } from '@/lib/use-audio-player';
import { exerciseStyles as s } from './styles';
import { SubmitButton } from './SubmitButton';

export function ListenInputExercise({
  prompt,
  onSubmit,
  disabled,
}: {
  prompt: ListenInputPrompt;
  onSubmit: (payload: { accepted: string[] }) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState('');
  const { play, playingUrl } = useAudioPlayer();

  return (
    <View style={s.container}>
      <Text style={s.labelSmall}>听音频，输入你听到的内容</Text>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable
          onPress={() => play(prompt.audioUrl)}
          style={[s.audioBtn, playingUrl === prompt.audioUrl && s.audioBtnActive]}
        >
          <Volume2 size={20} color={playingUrl === prompt.audioUrl ? colors.white : colors.sky} />
          <Text style={[s.audioBtnText, playingUrl === prompt.audioUrl && s.audioBtnTextActive]}>
            播放
          </Text>
        </Pressable>
        {prompt.audioUrlSlow && (
          <Pressable
            onPress={() => play(prompt.audioUrlSlow!)}
            style={[s.audioBtn, playingUrl === prompt.audioUrlSlow && s.audioBtnActive]}
          >
            <Text style={[s.audioBtnText, playingUrl === prompt.audioUrlSlow && s.audioBtnTextActive]}>
              🐢 慢速
            </Text>
          </Pressable>
        )}
      </View>

      <TextInput
        value={text}
        onChangeText={setText}
        style={s.textInput}
        placeholder="输入你听到的内容…"
        placeholderTextColor={colors.inkSoft}
        multiline
        editable={!disabled}
      />
      <SubmitButton
        onPress={() => onSubmit({ accepted: [text.trim()] })}
        disabled={!text.trim() || disabled}
      />
    </View>
  );
}
