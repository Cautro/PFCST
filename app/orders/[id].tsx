import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { api } from '@/lib/api';
import { Card, PrimaryButton, Screen, SectionTitle } from '@/components/ui';

type AssortmentItem = {
  id: string;
  name: string;
  wire: { type: string; lengthCm: number; qty: number }[];
  tube: { type: string; lengthCm: number; qty: number }[];
  misc: { name: string; qty: number }[];
};

type OrderItem = {
  id: string;
  productId: string;
  productName: string;
  color: string;
  quantity: number;
};

type Order = {
  id: string;
  date: string;
  name: string;
  items: OrderItem[];
  progress: { manufacturingPct: number; paintPct: number };
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [assortment, setAssortment] = useState<AssortmentItem[]>([]);

  const loadData = useCallback(async () => {
    if (!id) return;
    const [orderData, assortmentData] = await Promise.all([
      api.get<Order>(`/orders/${id}`),
      api.get<AssortmentItem[]>('/assortment'),
    ]);
    setOrder(orderData);
    setAssortment(assortmentData);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  if (!order) {
    return <Screen />;
  }

  const totalWire = order.items.reduce((acc, item) => {
    const product = assortment.find((entry) => entry.id === item.productId);
    const wireCount =
      product?.wire.reduce((sum, wire) => sum + wire.qty * item.quantity, 0) ?? 0;
    return acc + wireCount;
  }, 0);

  const totalTube = order.items.reduce((acc, item) => {
    const product = assortment.find((entry) => entry.id === item.productId);
    const tubeCount =
      product?.tube.reduce((sum, tube) => sum + tube.qty * item.quantity, 0) ?? 0;
    return acc + tubeCount;
  }, 0);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Card>
          <SectionTitle>{order.name}</SectionTitle>
          <Text style={styles.meta}>Дата: {order.date}</Text>
          <Text style={styles.meta}>Изготовление: {order.progress.manufacturingPct}%</Text>
          <View style={styles.actions}>
            <Link href={{ pathname: '/orders/edit', params: { id: order.id } }} asChild>
              <PrimaryButton label="Редактировать заказ" />
            </Link>
          </View>
        </Card>

        <SectionTitle>Изделия</SectionTitle>
        {order.items.map((item) => (
          <Card key={item.id}>
            <Text style={styles.itemName}>{item.productName}</Text>
            <Text style={styles.meta}>Количество: {item.quantity}</Text>
            <Text style={styles.meta}>Цвет: {item.color}</Text>
          </Card>
        ))}

        <Card>
          <SectionTitle>Итого по заказу</SectionTitle>
          <Text style={styles.meta}>Проволоки на заказ: {totalWire} отрезков</Text>
          <Text style={styles.meta}>Трубы на заказ: {totalTube} отрезков</Text>
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
  actions: {
    marginTop: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e1b16',
  },
});
