import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { api } from '@/lib/api';
import { formatHours } from '@/lib/format';
import { Card, Screen, SectionTitle } from '@/components/ui';

type Summary = {
  todaySeconds: number;
  months: { month: string; seconds: number }[];
  yearSeconds: number;
};

type UserDetail = {
  id: string;
  name: string;
  department: string;
  role: string;
  itemsMadeToday: number;
  summary: Summary;
};

export default function UserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [user, setUser] = useState<UserDetail | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    const data = await api.get<UserDetail>(`/users/${id}`);
    setUser(data);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  if (!user) {
    return <Screen />;
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Card>
          <SectionTitle>{user.name}</SectionTitle>
          <Text style={styles.meta}>Цех: {user.department}</Text>
          <Text style={styles.meta}>Должность: {user.role}</Text>
        </Card>

        <Card>
          <SectionTitle>Сегодня</SectionTitle>
          <Text style={styles.meta}>
            Время работы: {formatHours(user.summary?.todaySeconds ?? 0)}
          </Text>
          <Text style={styles.meta}>Сделано изделий: {user.itemsMadeToday ?? 0} шт</Text>
        </Card>

        <Card>
          <SectionTitle>По месяцам</SectionTitle>
          {user.summary?.months?.length ? (
            user.summary.months.map((entry) => (
              <View key={entry.month} style={styles.row}>
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
          <Text style={styles.meta}>{formatHours(user.summary?.yearSeconds ?? 0)}</Text>
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
    justifyContent: 'space-between',
  },
});
