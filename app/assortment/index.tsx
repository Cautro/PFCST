import React, { useCallback, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Link } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { api } from '@/lib/api';
import { Card, PrimaryButton, Screen, SecondaryButton, SectionTitle } from '@/components/ui';

type AssortmentItem = {
  id: string;
  name: string;
};

export default function AssortmentScreen() {
  const [items, setItems] = useState<AssortmentItem[]>([]);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const loadItems = useCallback(async () => {
    const data = await api.get<AssortmentItem[]>('/assortment');
    setItems(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems])
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id]
    );
  };

  const handleDelete = async () => {
    if (selected.length === 0) {
      Alert.alert('Выберите изделия для удаления');
      return;
    }
    Alert.alert('Удалить выбранные изделия?', 'Данные будут удалены безвозвратно.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          await api.del('/assortment', { ids: selected });
          setSelected([]);
          setDeleteMode(false);
          await loadItems();
        },
      },
    ]);
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Card>
          <SectionTitle>Управление ассортиментом</SectionTitle>
          <View style={styles.actions}>
            <Link href="/assortment/edit" asChild>
              <PrimaryButton label="Добавить изделие" />
            </Link>
            <SecondaryButton
              label={deleteMode ? 'Отмена удаления' : 'Удалить изделия'}
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

        {items.map((item) => (
          <Card key={item.id}>
            <View style={styles.row}>
              <Text style={styles.name}>{item.name}</Text>
              {deleteMode ? (
                <TouchableOpacity onPress={() => toggleSelect(item.id)}>
                  <Text style={styles.checkboxText}>
                    {selected.includes(item.id) ? '[x]' : '[ ]'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Link href={`/assortment/${item.id}`} style={styles.link}>
                  Подробнее
                </Link>
              )}
            </View>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e1b16',
  },
  link: {
    color: '#24324a',
    fontWeight: '600',
  },
  checkboxText: {
    fontSize: 18,
    color: '#24324a',
  },
});
