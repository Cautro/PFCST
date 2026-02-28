import React, { useContext, useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppContext } from '@/context/app-context';
import { api } from '@/lib/api';
import { formatHours, formatSeconds } from '@/lib/format';
import { Card, PrimaryButton, Screen, SecondaryButton, SectionTitle } from '@/components/ui';

export default function ProfileScreen() {
  const { user, userDetail, summary, refreshUserDetail, shift } = useContext(AppContext);

  useEffect(() => {
    refreshUserDetail();
  }, [refreshUserDetail]);

  const handleStopShift = async () => {
    if (!user) return;
    const total = shift.stopShift();
    if (total > 0) {
      const date = new Date().toISOString().slice(0, 10);
      await api.post('/time/log', { userId: user.id, date, seconds: total });
      await refreshUserDetail();
    }
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Card>
          <SectionTitle>{user?.name ?? 'Пользователь'}</SectionTitle>
          <Text style={styles.meta}>Время смены: {formatSeconds(shift.elapsedSeconds)}</Text>
          <Text style={styles.meta}>
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
        </Card>

        <Card>
          <SectionTitle>Сегодня</SectionTitle>
          <Text style={styles.meta}>
            Время работы: {formatHours(summary?.todaySeconds ?? 0)}
          </Text>
          <Text style={styles.meta}>
            Сделано изделий: {userDetail?.itemsMadeToday ?? 0} шт
          </Text>
        </Card>

        <Card>
          <SectionTitle>По месяцам</SectionTitle>
          {summary?.months?.length ? (
            summary.months.map((entry) => (
              <View key={entry.month} style={styles.monthRow}>
                <Text style={styles.meta}>{entry.month}</Text>
                <Text style={styles.meta}>{formatHours(entry.seconds)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.meta}>Нет данных</Text>
          )}
        </Card>

        <Card>
          <SectionTitle>За год</SectionTitle>
          <Text style={styles.meta}>{formatHours(summary?.yearSeconds ?? 0)}</Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  meta: {
    color: '#6c6359',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  monthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
