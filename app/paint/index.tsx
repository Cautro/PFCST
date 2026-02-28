import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { api } from '@/lib/api';
import { Card, Screen, SectionTitle } from '@/components/ui';

type Order = {
  id: string;
  date: string;
  name: string;
  progress: { manufacturingPct: number; paintPct: number };
};

export default function PaintScreen() {
  const [orders, setOrders] = useState<Order[]>([]);

  const loadOrders = useCallback(async () => {
    const data = await api.get<Order[]>('/orders/paint');
    setOrders(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders])
  );

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <SectionTitle>Покрас изделий</SectionTitle>
        {orders.map((order) => (
          <Card key={order.id}>
            <View style={styles.row}>
              <View>
                <Text style={styles.date}>{order.date}</Text>
                <Text style={styles.name}>{order.name}</Text>
                <Text style={styles.progress}>Покрас: {order.progress.paintPct}%</Text>
              </View>
              <Link href={`/paint/${order.id}`} style={styles.link}>
                Подробнее
              </Link>
            </View>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    color: '#6c6359',
    fontSize: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e1b16',
    marginTop: 2,
  },
  progress: {
    color: '#6c6359',
    marginTop: 4,
  },
  link: {
    color: '#24324a',
    fontWeight: '600',
  },
});
