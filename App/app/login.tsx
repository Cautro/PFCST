import React, { useContext, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { AppContext } from '@/context/app-context';
import { api } from '@/lib/api';
import { Card, PrimaryButton, Screen, SectionTitle } from '@/components/ui';

export default function LoginScreen() {
  const { setUser } = useContext(AppContext);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!login || !password) {
      Alert.alert('Введите логин и пароль');
      return;
    }
    try {
      setLoading(true);
      const user = await api.post('/auth/login', { login, password });
      setUser(user);
      router.replace('/');
    } catch (error) {
      Alert.alert('Ошибка входа', 'Проверьте логин и пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Card>
        <SectionTitle>Вход/Авторизация</SectionTitle>
        <Text style={styles.label}>Логин</Text>
        <TextInput
          value={login}
          onChangeText={setLogin}
          placeholder="Введите логин"
          autoCapitalize="none"
          style={styles.input}
        />
        <Text style={styles.label}>Пароль</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Введите пароль"
          secureTextEntry
          style={styles.input}
        />
        <View style={styles.buttonWrap}>
          <PrimaryButton label={loading ? 'Вход...' : 'Войти'} onPress={handleLogin} />
        </View>
      </Card>
      <Card>
        <Text style={styles.helper}>
          Демо-доступы: admin/admin, worker/worker, paint/paint.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: {
    marginTop: 8,
    color: '#5b534a',
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dcd4c4',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 6,
    backgroundColor: '#fffaf0',
  },
  buttonWrap: {
    marginTop: 16,
  },
  helper: {
    color: '#6f655a',
    fontSize: 13,
  },
});
