import React, { useCallback, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Link } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { api } from '@/lib/api';
import { Card, PrimaryButton, Screen, SecondaryButton, SectionTitle } from '@/components/ui';

type Order = {
  id: string;
  date: string;
  name: string;
  items: unknown[];
  progress: { manufacturingPct: number; paintPct: number };
};

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [deleteMode, setDeleteMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const loadOrders = useCallback(async () => {
    const data = await api.get<Order[]>('/orders');
    setOrders(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders])
  );

  const filtered = orders.filter((order) =>
    order.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id]
    );
  };

  const handleDelete = async () => {
    if (selected.length === 0) {
      Alert.alert('Выберите заказы для удаления');
      return;
    }
    Alert.alert('Удалить выбранные заказы?', 'Заказы будут удалены безвозвратно.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          await api.del('/orders', { ids: selected });
          setSelected([]);
          setDeleteMode(false);
          await loadOrders();
        },
      },
    ]);
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Card>
          <SectionTitle>Поиск</SectionTitle>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Введите название заказа"
            style={styles.input}
          />
          <View style={styles.actions}>
            <Link href="/orders/edit" asChild>
              <PrimaryButton label="Добавить заказ" />
            </Link>
            <SecondaryButton
              label={deleteMode ? 'Отмена удаления' : 'Удалить заказы'}
              onPress={() => {
                setDeleteMode((prev) => !prev);
                setSelected([]);
              }}
            />
          </View>
          {deleteMode && (
            <View style={styles.actions}>
              <PrimaryButton label="Подтвердить удаление" onPress={handleDelete} />
            </View>
          )}
        </Card>

        {filtered.map((order) => (
          <Card key={order.id}>
            <View style={styles.orderRow}>
              <View>
                <Text style={styles.orderDate}>{order.date}</Text>
                <Text style={styles.orderName}>{order.name}</Text>
                <Text style={styles.orderProgress}>
                  Изготовление: {order.progress.manufacturingPct}%
                </Text>
              </View>
              <View style={styles.orderActions}>
                {deleteMode ? (
                  <TouchableOpacity onPress={() => toggleSelect(order.id)}>
                    <Text style={styles.checkboxText}>
                      {selected.includes(order.id) ? '[x]' : '[ ]'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Link href={`/orders/${order.id}`} asChild>
                    <TouchableOpacity>
                      <Text style={styles.detailLink}>Подробнее</Text>
                    </TouchableOpacity>
                  </Link>
                )}
              </View>
            </View>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#dcd4c4',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
    backgroundColor: '#fffaf0',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderDate: {
    color: '#6c6359',
    fontSize: 12,
  },
  orderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e1b16',
    marginTop: 2,
  },
  orderProgress: {
    color: '#6c6359',
    marginTop: 4,
  },
  orderActions: {
    alignItems: 'flex-end',
  },
  detailLink: {
    color: '#24324a',
    fontWeight: '600',
  },
  checkboxText: {
    fontSize: 18,
    color: '#24324a',
  },
});
