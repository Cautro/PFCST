import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { api } from '@/lib/api';
import { Card, PrimaryButton, Screen, SecondaryButton, SectionTitle } from '@/components/ui';

type AssortmentItem = {
  id: string;
  name: string;
};

type OrderItem = {
  id?: string;
  productId: string;
  productName: string;
  color: string;
  quantity: string;
};

export default function OrderEditScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [name, setName] = useState('');
  const [items, setItems] = useState<OrderItem[]>([
    { productId: '', productName: '', color: 'белый', quantity: '1' },
  ]);
  const [assortment, setAssortment] = useState<AssortmentItem[]>([]);

  const loadData = useCallback(async () => {
    const assort = await api.get<AssortmentItem[]>('/assortment');
    setAssortment(assort);
    if (id) {
      const order = await api.get(`/orders/${id}`);
      setDate(order.date);
      setName(order.name);
      setItems(
        order.items.map((item: OrderItem) => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          color: item.color,
          quantity: String(item.quantity),
        }))
      );
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const suggestions = useMemo(
    () => (input: string) =>
      assortment.filter((entry) =>
        entry.name.toLowerCase().startsWith(input.toLowerCase())
      ),
    [assortment]
  );

  const updateItem = (index: number, patch: Partial<OrderItem>) => {
    setItems((prev) => prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));
  };

  const handleSave = async () => {
    if (!date || !name.trim()) {
      Alert.alert('Заполните дату и название заказа');
      return;
    }
    if (items.some((item) => !item.productName.trim() || !item.quantity)) {
      Alert.alert('Заполните все изделия');
      return;
    }
    const payload = {
      date,
      name,
      items: items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        color: item.color,
        quantity: Number(item.quantity),
      })),
    };
    if (id) {
      await api.put(`/orders/${id}`, payload);
    } else {
      await api.post('/orders', payload);
    }
    router.back();
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Card>
          <SectionTitle>Данные заказа</SectionTitle>
          <Text style={styles.label}>Дата</Text>
          <TextInput value={date} onChangeText={setDate} style={styles.input} />
          <Text style={styles.label}>Название заказа</Text>
          <TextInput value={name} onChangeText={setName} style={styles.input} />
        </Card>

        <SectionTitle>Изделия в заказе</SectionTitle>
        {items.map((item, index) => {
          const matches =
            item.productName.length > 0 ? suggestions(item.productName).slice(0, 5) : [];
          return (
            <Card key={`${item.id ?? 'new'}_${index}`}>
              <Text style={styles.label}>Название изделия</Text>
              <TextInput
                value={item.productName}
                onChangeText={(value) => updateItem(index, { productName: value, productId: '' })}
                style={styles.input}
              />
              {matches.length > 0 && (
                <View style={styles.suggestions}>
                  {matches.map((match) => (
                    <TouchableOpacity
                      key={match.id}
                      onPress={() =>
                        updateItem(index, { productName: match.name, productId: match.id })
                      }>
                      <Text style={styles.suggestionItem}>{match.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <Text style={styles.label}>Цвет</Text>
              <View style={styles.colorRow}>
                {['белый', 'черный'].map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorChip,
                      item.color === color && styles.colorChipActive,
                    ]}
                    onPress={() => updateItem(index, { color })}>
                    <Text
                      style={[
                        styles.colorText,
                        item.color === color && styles.colorTextActive,
                      ]}>
                      {color}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.label}>Количество</Text>
              <TextInput
                value={item.quantity}
                onChangeText={(value) => updateItem(index, { quantity: value })}
                keyboardType="numeric"
                style={styles.input}
              />
              <View style={styles.itemActions}>
                <SecondaryButton
                  label="Удалить позицию"
                  onPress={() =>
                    setItems((prev) => prev.filter((_, idx) => idx !== index))
                  }
                  disabled={items.length === 1}
                />
              </View>
            </Card>
          );
        })}

        <Card>
          <SecondaryButton
            label="Добавить изделие"
            onPress={() =>
              setItems((prev) => [
                ...prev,
                { productId: '', productName: '', color: 'белый', quantity: '1' },
              ])
            }
          />
        </Card>

        <Card>
          <PrimaryButton label="Сохранить заказ" onPress={handleSave} />
        </Card>
      </ScrollView>
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
  suggestions: {
    marginTop: 6,
    backgroundColor: '#f9f6ee',
    borderRadius: 8,
    padding: 6,
    borderWidth: 1,
    borderColor: '#ede4d4',
  },
  suggestionItem: {
    paddingVertical: 6,
    color: '#2d241b',
  },
  colorRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  colorChip: {
    borderWidth: 1,
    borderColor: '#dcd4c4',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  colorChipActive: {
    backgroundColor: '#24324a',
    borderColor: '#24324a',
  },
  colorText: {
    color: '#3c3227',
  },
  colorTextActive: {
    color: '#ffffff',
  },
  itemActions: {
    marginTop: 10,
  },
});
