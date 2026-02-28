import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { api } from '@/lib/api';
import { Card, PrimaryButton, Screen, SecondaryButton, SectionTitle, Tag } from '@/components/ui';

type OrderItem = {
  id: string;
  productName: string;
  color: string;
  quantity: number;
  paintStatus: 'not_ready' | 'ready' | 'in_progress' | 'done';
};

type Order = {
  id: string;
  date: string;
  name: string;
  items: OrderItem[];
  progress: { manufacturingPct: number; paintPct: number };
};

export default function PaintDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    const orderData = await api.get<Order>(`/orders/${id}`);
    setOrder(orderData);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const updatePaintStatus = async (itemId: string, action: 'paint-start' | 'paint-done') => {
    if (!order) return;
    await api.post(`/orders/${order.id}/items/${itemId}/${action}`);
    await loadData();
  };

  const getPaintColor = (status: OrderItem['paintStatus']) => {
    if (status === 'done') return '#2f8a4b';
    if (status === 'in_progress') return '#d0a444';
    if (status === 'ready') return '#8a7f72';
    return '#b8b0a3';
  };

  if (!order) {
    return <Screen />;
  }

  const visibleItems = order.items.filter((item) => item.paintStatus !== 'not_ready');

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Card>
          <SectionTitle>{order.name}</SectionTitle>
          <Text style={styles.meta}>Дата: {order.date}</Text>
          <Text style={styles.meta}>Покрас: {order.progress.paintPct}%</Text>
        </Card>

        {visibleItems.map((item) => (
          <Card key={item.id}>
            <View style={styles.itemHeader}>
              <View>
                <Text style={styles.itemName}>{item.productName}</Text>
                <Text style={styles.meta}>Количество: {item.quantity}</Text>
                <Text style={styles.meta}>Цвет: {item.color}</Text>
              </View>
              <Tag label={item.paintStatus} color={getPaintColor(item.paintStatus)} />
            </View>
            <View style={styles.actions}>
              <PrimaryButton
                label="Начать"
                onPress={() => updatePaintStatus(item.id, 'paint-start')}
                disabled={item.paintStatus === 'done'}
              />
              <SecondaryButton
                label="Завершить"
                onPress={() => updatePaintStatus(item.id, 'paint-done')}
                disabled={item.paintStatus === 'done'}
              />
            </View>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  meta: {
    color: '#6c6359',
    marginTop: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e1b16',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
});
