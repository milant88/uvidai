import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useChatStore } from '@/store/chat-store';
import { useSettingsStore } from '@/store/settings-store';
import { colors } from '@/constants/theme';

const SUGGESTIONS = [
  'Koji kvart u Beogradu je najbolji za porodice?',
  'Uporedi Vračar i Dorćol',
  'Kvalitet vazduha u Novom Sadu',
];

function useThemeColors() {
  const systemScheme = useColorScheme();
  const theme = useSettingsStore((s) => s.theme);
  const resolved =
    theme === 'system'
      ? systemScheme ?? 'dark'
      : theme === 'dark'
        ? 'dark'
        : 'light';
  return colors[resolved];
}

export default function HomeScreen() {
  const themeColors = useThemeColors();
  const messages = useChatStore((s) => s.messages);
  const isLoading = useChatStore((s) => s.isLoading);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const clearChat = useChatStore((s) => s.clearChat);

  const [input, setInput] = useState('');
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages, isLoading]);

  function handleSubmit() {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    sendMessage(text);
  }

  function handleSuggestion(item: string) {
    setInput(item);
  }

  const styles = createStyles(themeColors);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>UvidAI Chat</Text>
        <TouchableOpacity onPress={clearChat} style={styles.clearBtn}>
          <Text style={styles.clearBtnText}>Obriši</Text>
        </TouchableOpacity>
      </View>

      {messages.length === 0 ? (
        <View style={styles.welcome}>
          <View style={styles.welcomeIcon}>
            <Text style={styles.welcomeIconText}>🗺️</Text>
          </View>
          <Text style={styles.welcomeTitle}>Dobrodošli u UvidAI</Text>
          <Text style={styles.welcomeText}>
            Pitajte o lokacijama u Beogradu i Novom Sadu — kvalitet vazduha,
            škole, transport, zelenilo i još mnogo toga.
          </Text>
          <View style={styles.suggestions}>
            {SUGGESTIONS.map((s) => (
              <TouchableOpacity
                key={s}
                style={styles.suggestion}
                onPress={() => handleSuggestion(s)}
              >
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubble,
                item.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant,
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  item.role === 'user'
                    ? styles.bubbleTextUser
                    : styles.bubbleTextAssistant,
                ]}
              >
                {item.content}
              </Text>
            </View>
          )}
          ListFooterComponent={
            isLoading ? (
              <View style={styles.typing}>
                <View style={[styles.dot, styles.dot1]} />
                <View style={[styles.dot, styles.dot2]} />
                <View style={[styles.dot, styles.dot3]} />
              </View>
            ) : null
          }
        />
      )}

      {/* Input */}
      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          placeholder="Unesite pitanje..."
          placeholderTextColor={themeColors.textMuted}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSubmit}
          editable={!isLoading}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendBtn, isLoading && styles.sendBtnDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text style={styles.sendBtnText}>Pošalji</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function createStyles(c: (typeof colors)['dark']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    title: {
      fontSize: 14,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      color: c.textMuted,
    },
    clearBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    clearBtnText: { color: c.textMuted, fontSize: 13 },
    welcome: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: 48,
    },
    welcomeIcon: {
      width: 64,
      height: 64,
      borderRadius: 12,
      backgroundColor: c.accentMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    welcomeIconText: { fontSize: 32 },
    welcomeTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: c.textPrimary,
      marginBottom: 8,
    },
    welcomeText: {
      fontSize: 14,
      color: c.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      maxWidth: 280,
    },
    suggestions: {
      marginTop: 24,
      width: '100%',
      maxWidth: 320,
      gap: 8,
    },
    suggestion: {
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgSecondary,
    },
    suggestionText: {
      fontSize: 13,
      color: c.textSecondary,
    },
    messageList: {
      padding: 16,
      paddingBottom: 24,
    },
    bubble: {
      maxWidth: '85%',
      padding: 12,
      borderRadius: 12,
      marginBottom: 8,
    },
    bubbleUser: {
      alignSelf: 'flex-end',
      backgroundColor: c.accent,
    },
    bubbleAssistant: {
      alignSelf: 'flex-start',
      backgroundColor: c.bgSecondary,
      borderWidth: 1,
      borderColor: c.border,
    },
    bubbleText: { fontSize: 15 },
    bubbleTextUser: { color: c.bg },
    bubbleTextAssistant: { color: c.textPrimary },
    typing: {
      flexDirection: 'row',
      gap: 4,
      padding: 12,
      marginLeft: 16,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: c.textMuted,
    },
    dot1: { opacity: 0.3 },
    dot2: { opacity: 0.6 },
    dot3: { opacity: 1 },
    inputArea: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: c.border,
      backgroundColor: c.bgSecondary,
    },
    input: {
      flex: 1,
      padding: 12,
      borderRadius: 10,
      backgroundColor: c.inputBg,
      borderWidth: 1,
      borderColor: c.inputBorder,
      fontSize: 15,
      color: c.textPrimary,
    },
    sendBtn: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 10,
      backgroundColor: c.accent,
    },
    sendBtnDisabled: { opacity: 0.5 },
    sendBtnText: {
      color: c.bg,
      fontWeight: '600',
      fontSize: 14,
    },
  });
}
