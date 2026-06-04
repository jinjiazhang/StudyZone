import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  User,
  Shield,
  Bell,
  Target,
  Volume2,
  Heart,
  Sparkles,
  LifeBuoy,
  LogOut,
} from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { colors, fonts, radius } from '@/lib/theme';
import { Mascot } from '@/components/Mascot';

type Row = {
  icon: React.ReactNode;
  name: string;
  detail?: string;
  toggle?: boolean;
  defaultOn?: boolean;
};

export default function Settings() {
  const router = useRouter();
  const clear = useAuth((s) => s.clear);
  const [confirm, setConfirm] = useState(false);
  const [toggles, setToggles] = useState<Record<string, boolean>>({ 音效: true });

  const groups: { group: string; rows: Row[] }[] = [
    {
      group: '账户',
      rows: [
        { icon: <User size={18} color={colors.inkSoft} />, name: '个人资料' },
        { icon: <Shield size={18} color={colors.inkSoft} />, name: '隐私与安全' },
        { icon: <Bell size={18} color={colors.inkSoft} />, name: '通知' },
      ],
    },
    {
      group: '学习',
      rows: [
        { icon: <Target size={18} color={colors.inkSoft} />, name: '每日目标', detail: '40 经验' },
        { icon: <Volume2 size={18} color={colors.inkSoft} />, name: '音效', toggle: true, defaultOn: true },
        { icon: <Heart size={18} color={colors.inkSoft} />, name: '无限生命', detail: '订阅' },
      ],
    },
    {
      group: '其他',
      rows: [
        { icon: <Sparkles size={18} color={colors.inkSoft} />, name: '外观主题', detail: '浅色' },
        { icon: <LifeBuoy size={18} color={colors.inkSoft} />, name: '帮助中心' },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <ChevronLeft size={22} color={colors.inkSoft} />
        </Pressable>
        <Text style={styles.topTitle}>设置</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {groups.map((grp) => (
          <View key={grp.group} style={{ marginBottom: 18 }}>
            <Text style={styles.groupLabel}>{grp.group}</Text>
            <View style={styles.card}>
              {grp.rows.map((r, ri) => {
                const on = r.toggle
                  ? toggles[r.name] ?? r.defaultOn ?? false
                  : false;
                return (
                  <View
                    key={r.name}
                    style={[
                      styles.row,
                      ri < grp.rows.length - 1 && styles.rowBorder,
                    ]}
                  >
                    <View style={styles.rowIcon}>{r.icon}</View>
                    <Text style={styles.rowName}>{r.name}</Text>
                    {r.detail && <Text style={styles.rowDetail}>{r.detail}</Text>}
                    {r.toggle ? (
                      <Pressable
                        onPress={() => setToggles((t) => ({ ...t, [r.name]: !on }))}
                        style={[styles.switch, { backgroundColor: on ? colors.green : colors.line }]}
                      >
                        <View style={[styles.knob, { left: on ? 23 : 3 }]} />
                      </Pressable>
                    ) : (
                      <ChevronRight size={18} color={colors.inkFaint} />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        <Pressable style={styles.logoutBtn} onPress={() => setConfirm(true)}>
          <LogOut size={19} color={colors.rose} />
          <Text style={styles.logoutText}>退出登录</Text>
        </Pressable>
        <Text style={styles.version}>StudyZone · 学习园地 · v2.0</Text>
      </ScrollView>

      <Modal visible={confirm} transparent animationType="slide" onRequestClose={() => setConfirm(false)}>
        <Pressable style={styles.backdrop} onPress={() => setConfirm(false)}>
          <Pressable style={styles.confirmSheet} onPress={(e) => e.stopPropagation()}>
            <View style={{ alignItems: 'center' }}>
              <Mascot size={92} mood="sad" />
              <Text style={styles.confirmTitle}>真的要走了吗？</Text>
              <Text style={styles.confirmSub}>连胜还在等你回来呢</Text>
            </View>
            <Pressable
              style={styles.confirmDanger}
              onPress={() => {
                clear();
                router.replace('/login');
              }}
            >
              <Text style={styles.confirmDangerText}>退出登录</Text>
            </Pressable>
            <Pressable style={styles.confirmGhost} onPress={() => setConfirm(false)}>
              <Text style={styles.confirmGhostText}>再学一会儿</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgSoft },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: colors.line,
    backgroundColor: colors.white,
  },
  backBtn: { padding: 4 },
  topTitle: { fontFamily: fonts.heavy, fontSize: 17, color: colors.ink },
  scroll: { padding: 16, paddingBottom: 40 },
  groupLabel: {
    fontFamily: fonts.heavy,
    fontSize: 12,
    color: colors.inkFaint,
    textTransform: 'uppercase',
    letterSpacing: 1.3,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.cardLine,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13 },
  rowBorder: { borderBottomWidth: 2, borderBottomColor: colors.line },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: colors.bgSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowName: { flex: 1, fontFamily: fonts.heavy, fontSize: 15, color: colors.ink },
  rowDetail: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.inkFaint },
  switch: { width: 48, height: 28, borderRadius: 999, justifyContent: 'center' },
  knob: {
    position: 'absolute',
    top: 3,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.white,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: '#FFD9D9',
    paddingVertical: 14,
  },
  logoutText: { fontFamily: fonts.heavy, fontSize: 16, color: colors.rose },
  version: {
    textAlign: 'center',
    marginTop: 16,
    fontFamily: fonts.sansBold,
    fontSize: 12,
    color: colors.inkFaint,
  },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(30,28,24,0.45)' },
  confirmSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: 22,
    paddingBottom: 32,
    gap: 10,
  },
  confirmTitle: { fontFamily: fonts.heavy, fontSize: 19, color: colors.ink, marginTop: 6 },
  confirmSub: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.inkSoft, marginTop: 4, marginBottom: 8 },
  confirmDanger: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: '#FFD9D9',
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmDangerText: { fontFamily: fonts.heavy, fontSize: 16, color: colors.rose },
  confirmGhost: { paddingVertical: 12, alignItems: 'center' },
  confirmGhostText: { fontFamily: fonts.heavy, fontSize: 15, color: colors.inkSoft },
});
