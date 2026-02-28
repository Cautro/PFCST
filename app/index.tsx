import React, { useContext } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Link } from 'expo-router';

import { AppContext } from '@/context/app-context';
import { canAccess } from '@/lib/roles';
import { formatSeconds } from '@/lib/format';
import { Card, PrimaryButton, Screen, SectionTitle, SecondaryButton } from '@/components/ui';
import { api } from '@/lib/api';

const MENU_ITEMS = [
  { key: 'orders', label: 'Заказы', route: '/orders' },
  { key: 'users', label: 'Пользователи', route: '/users' },
  { key: 'completed', label: 'Выполненные заказы', route: '/completed' },
  { key: 'assortment', label: 'Ассортимент', route: '/assortment' },
  { key: 'inProgress', label: 'Заказы в процессе', route: '/in-progress' },
  { key: 'paint', label: 'Покрас изделий', route: '/paint' },
  { key: 'profile', label: 'ФИО пользователя', route: '/profile' },
];

export default function MenuScreen() {
  const { user, logout, shift, refreshUserDetail } = useContext(AppContext);

  const handleStopShift = async () => {
    const total = shift.stopShift();
    if (user && total > 0) {
      const date = new Date().toISOString().slice(0, 10);
      await api.post('/time/log', { userId: user.id, date, seconds: total });
      await refreshUserDetail();
    }
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Card>
          <SectionTitle>Смена</SectionTitle>
          <Text style={styles.userName}>
            {user ? user.name : 'Войдите в систему'}
          </Text>
          <Text style={styles.timer}>{formatSeconds(shift.elapsedSeconds)}</Text>
          <Text style={styles.timerStatus}>
            {shift.isRunning
              ? shift.isAutoPaused
                ? 'Автопауза (обед/ночь)'
                : shift.isPaused
                  ? 'Пауза'
                  : 'Смена идет'
              : 'Смена не начата'}
          </Text>
          <View style={styles.row}>
            <PrimaryButton
              label="Начало смены"
              onPress={shift.startShift}
              disabled={!user || shift.isRunning}
            />
            <SecondaryButton
              label="Пауза"
              onPress={shift.pauseShift}
              disabled={!user || !shift.isRunning || shift.isPaused}
            />
          </View>
          <View style={styles.row}>
            <SecondaryButton
              label="Продолжить"
              onPress={shift.resumeShift}
              disabled={!user || !shift.isRunning || !shift.isPaused}
            />
            <PrimaryButton
              label="Конец смены"
              onPress={() =>
                Alert.alert('Завершить смену?', 'Смена будет остановлена и сохранена.', [
                  { text: 'Отмена', style: 'cancel' },
                  { text: 'Завершить', style: 'destructive', onPress: handleStopShift },
                ])
              }
              disabled={!user || !shift.isRunning}
            />
          </View>
          {!user && (
            <Link href="/login" asChild>
              <TouchableOpacity style={styles.loginButton}>
                <Text style={styles.loginText}>Вход/Авторизация</Text>
              </TouchableOpacity>
            </Link>
          )}
          {user && (
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() =>
                Alert.alert('Выйти из учетной записи?', '', [
                  { text: 'Отмена', style: 'cancel' },
                  { text: 'Выйти', style: 'destructive', onPress: logout },
                ])
              }>
              <Text style={styles.logoutText}>Выход</Text>
            </TouchableOpacity>
          )}
        </Card>

        <SectionTitle>Меню</SectionTitle>
        {MENU_ITEMS.map((item) => {
          const enabled = canAccess(item.key, user);
          return (
            <Card key={item.key} style={!enabled ? styles.cardDisabled : undefined}>
              <View style={styles.menuRow}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                {enabled ? (
                  <Link href={item.route} asChild>
                    <TouchableOpacity>
                      <Text style={styles.menuAction}>Открыть</Text>
                    </TouchableOpacity>
                  </Link>
                ) : (
                  <Text style={styles.menuActionDisabled}>Недоступно</Text>
                )}
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e1b16',
  },
  timer: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 4,
    color: '#24324a',
  },
  timerStatus: {
    color: '#6c6359',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  loginButton: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#24324a',
    alignItems: 'center',
  },
  loginText: {
    color: '#24324a',
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#c03c2e',
    alignItems: 'center',
  },
  logoutText: {
    color: '#c03c2e',
    fontWeight: '600',
  },
  cardDisabled: {
    opacity: 0.5,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e1b16',
  },
  menuAction: {
    color: '#24324a',
    fontWeight: '600',
  },
  menuActionDisabled: {
    color: '#a0968a',
  },
});
