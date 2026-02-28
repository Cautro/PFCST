import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { api } from '@/lib/api';
import { Card, Screen, SectionTitle } from '@/components/ui';

type Order = {
  id: string;
  date: string;
  name: string;
};

export default function CompletedOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');

  const loadOrders = useCallback(async () => {
    const data = await api.get<Order[]>('/orders/completed');
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
        </Card>

        {filtered.map((order) => (
          <Card key={order.id}>
            <View style={styles.row}>
              <View>
                <Text style={styles.date}>{order.date}</Text>
                <Text style={styles.name}>{order.name}</Text>
              </View>
              <Link href={`/orders/${order.id}`} style={styles.link}>
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
  input: {
    borderWidth: 1,
    borderColor: '#dcd4c4',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
    backgroundColor: '#fffaf0',
  },
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
  link: {
    color: '#24324a',
    fontWeight: '600',
  },
});
