import React, { useCallback, useContext, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { api } from '@/lib/api';
import { AppContext } from '@/context/app-context';
import { Card, PrimaryButton, Screen, SecondaryButton, SectionTitle, Tag } from '@/components/ui';

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
  status: 'new' | 'in_progress' | 'done';
};

type Order = {
  id: string;
  date: string;
  name: string;
  items: OrderItem[];
  progress: { manufacturingPct: number; paintPct: number };
};

export default function InProgressDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useContext(AppContext);
  const [order, setOrder] = useState<Order | null>(null);
  const [assortment, setAssortment] = useState<AssortmentItem[]>([]);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

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

  const updateItemStatus = async (itemId: string, action: string) => {
    if (!order) return;
    if (action === 'done') {
      await api.post(`/orders/${order.id}/items/${itemId}/done`, { userId: user?.id });
    } else {
      await api.post(`/orders/${order.id}/items/${itemId}/${action}`);
    }
    await loadData();
  };

  const getStatusColor = (status: OrderItem['status']) => {
    if (status === 'done') return '#2f8a4b';
    if (status === 'in_progress') return '#d0a444';
    return '#b8b0a3';
  };

  if (!order) {
    return <Screen />;
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Card>
          <SectionTitle>{order.name}</SectionTitle>
          <Text style={styles.meta}>Дата: {order.date}</Text>
          <Text style={styles.meta}>
            Выполнение: {order.progress.manufacturingPct}%
          </Text>
        </Card>

        <SectionTitle>Изделия</SectionTitle>
        {order.items.map((item) => {
          const details = assortment.find((entry) => entry.id === item.productId);
          const isExpanded = expandedItem === item.id;
          return (
            <Card key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View>
                  <Text style={styles.itemName}>{item.productName}</Text>
                  <Text style={styles.meta}>Количество: {item.quantity}</Text>
                  <Text style={styles.meta}>Цвет: {item.color}</Text>
                </View>
                <Tag label={item.status} color={getStatusColor(item.status)} />
              </View>

              <TouchableOpacity
                onPress={() => setExpandedItem(isExpanded ? null : item.id)}
                style={styles.detailsToggle}>
                <Text style={styles.detailsToggleText}>
                  {isExpanded ? 'Скрыть материалы' : 'Подробнее об изделии'}
                </Text>
              </TouchableOpacity>

              {isExpanded && details && (
                <View style={styles.detailsBlock}>
                  <Text style={styles.detailTitle}>Проволока</Text>
                  {details.wire.map((wire, idx) => (
                    <Text key={`wire_${idx}`} style={styles.meta}>
                      {wire.type} / {wire.lengthCm} см / {wire.qty} отрезков
                    </Text>
                  ))}
                  <Text style={styles.detailTitle}>Труба</Text>
                  {details.tube.length === 0 && (
                    <Text style={styles.meta}>Не требуется</Text>
                  )}
                  {details.tube.map((tube, idx) => (
                    <Text key={`tube_${idx}`} style={styles.meta}>
                      {tube.type} / {tube.lengthCm} см / {tube.qty} отрезков
                    </Text>
                  ))}
                  <Text style={styles.detailTitle}>Прочее</Text>
                  {details.misc.length === 0 && (
                    <Text style={styles.meta}>Не требуется</Text>
                  )}
                  {details.misc.map((misc, idx) => (
                    <Text key={`misc_${idx}`} style={styles.meta}>
                      {misc.name}: {misc.qty}
                    </Text>
                  ))}
                </View>
              )}

              <View style={styles.actions}>
                <PrimaryButton
                  label="Начать"
                  onPress={() => updateItemStatus(item.id, 'start')}
                  disabled={item.status === 'done'}
                />
                <SecondaryButton
                  label="Пауза"
                  onPress={() => updateItemStatus(item.id, 'pause')}
                  disabled={item.status === 'done'}
                />
                <PrimaryButton
                  label="Готово"
                  onPress={() => updateItemStatus(item.id, 'done')}
                  disabled={item.status === 'done'}
                />
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  meta: {
    color: '#6c6359',
    marginTop: 2,
  },
  itemCard: {
    borderWidth: 1,
    borderColor: '#e7ddc7',
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
  detailsToggle: {
    marginTop: 8,
  },
  detailsToggleText: {
    color: '#24324a',
    fontWeight: '600',
  },
  detailsBlock: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f9f4ea',
    borderRadius: 10,
  },
  detailTitle: {
    fontWeight: '700',
    marginTop: 6,
    color: '#3c3227',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
  },
});
