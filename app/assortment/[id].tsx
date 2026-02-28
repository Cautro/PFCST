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

export default function AssortmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<AssortmentItem | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    const data = await api.get<AssortmentItem>(`/assortment/${id}`);
    setItem(data);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  if (!item) {
    return <Screen />;
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Card>
          <SectionTitle>{item.name}</SectionTitle>
          <Link href={{ pathname: '/assortment/edit', params: { id: item.id } }} asChild>
            <PrimaryButton label="Редактировать изделие" />
          </Link>
        </Card>

        <Card>
          <SectionTitle>Проволока</SectionTitle>
          {item.wire.length === 0 && <Text style={styles.meta}>Не требуется</Text>}
          {item.wire.map((wire, idx) => (
            <Text key={`wire_${idx}`} style={styles.meta}>
              {wire.type} / {wire.lengthCm} см / {wire.qty} отрезков
            </Text>
          ))}
        </Card>

        <Card>
          <SectionTitle>Труба</SectionTitle>
          {item.tube.length === 0 && <Text style={styles.meta}>Не требуется</Text>}
          {item.tube.map((tube, idx) => (
            <Text key={`tube_${idx}`} style={styles.meta}>
              {tube.type} / {tube.lengthCm} см / {tube.qty} отрезков
            </Text>
          ))}
        </Card>

        <Card>
          <SectionTitle>Прочие материалы</SectionTitle>
          {item.misc.length === 0 && <Text style={styles.meta}>Не требуется</Text>}
          {item.misc.map((misc, idx) => (
            <Text key={`misc_${idx}`} style={styles.meta}>
              {misc.name}: {misc.qty}
            </Text>
          ))}
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
});
