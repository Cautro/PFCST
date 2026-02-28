import React, { useCallback, useEffect, useState } from 'react';
import {
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

type Wire = { type: string; lengthCm: string; qty: string };
type Tube = { type: string; lengthCm: string; qty: string };
type Misc = { name: string; qty: string };

export default function AssortmentEditScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [name, setName] = useState('');
  const [wire, setWire] = useState<Wire[]>([{ type: 'd3', lengthCm: '0', qty: '0' }]);
  const [tube, setTube] = useState<Tube[]>([{ type: '20x20', lengthCm: '0', qty: '0' }]);
  const [misc, setMisc] = useState<Misc[]>([{ name: '', qty: '0' }]);

  const loadData = useCallback(async () => {
    if (!id) return;
    const data = await api.get(`/assortment/${id}`);
    setName(data.name);
    setWire(
      data.wire.map((entry: Wire) => ({
        type: entry.type,
        lengthCm: String(entry.lengthCm),
        qty: String(entry.qty),
      }))
    );
    setTube(
      data.tube.map((entry: Tube) => ({
        type: entry.type,
        lengthCm: String(entry.lengthCm),
        qty: String(entry.qty),
      }))
    );
    setMisc(
      data.misc.map((entry: Misc) => ({
        name: entry.name,
        qty: String(entry.qty),
      }))
    );
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async () => {
    const payload = {
      name,
      wire: wire
        .filter((entry) => entry.type && entry.qty !== '0')
        .map((entry) => ({
          type: entry.type,
          lengthCm: Number(entry.lengthCm),
          qty: Number(entry.qty),
        })),
      tube: tube
        .filter((entry) => entry.type && entry.qty !== '0')
        .map((entry) => ({
          type: entry.type,
          lengthCm: Number(entry.lengthCm),
          qty: Number(entry.qty),
        })),
      misc: misc
        .filter((entry) => entry.name && entry.qty !== '0')
        .map((entry) => ({
          name: entry.name,
          qty: Number(entry.qty),
        })),
    };
    if (id) {
      await api.put(`/assortment/${id}`, payload);
    } else {
      await api.post('/assortment', payload);
    }
    router.back();
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Card>
          <SectionTitle>Данные изделия</SectionTitle>
          <Text style={styles.label}>Название изделия</Text>
          <TextInput value={name} onChangeText={setName} style={styles.input} />
        </Card>

        <Card>
          <SectionTitle>Проволока</SectionTitle>
          {wire.map((entry, index) => (
            <View key={`wire_${index}`} style={styles.rowGroup}>
              <TextInput
                value={entry.type}
                onChangeText={(value) =>
                  setWire((prev) =>
                    prev.map((item, idx) => (idx === index ? { ...item, type: value } : item))
                  )
                }
                placeholder="d2/d3/d4"
                style={styles.input}
              />
              <TextInput
                value={entry.lengthCm}
                onChangeText={(value) =>
                  setWire((prev) =>
                    prev.map((item, idx) =>
                      idx === index ? { ...item, lengthCm: value } : item
                    )
                  )
                }
                placeholder="Размер в см"
                keyboardType="numeric"
                style={styles.input}
              />
              <TextInput
                value={entry.qty}
                onChangeText={(value) =>
                  setWire((prev) =>
                    prev.map((item, idx) => (idx === index ? { ...item, qty: value } : item))
                  )
                }
                placeholder="Кол-во"
                keyboardType="numeric"
                style={styles.input}
              />
              <TouchableOpacity
                onPress={() => setWire((prev) => prev.filter((_, idx) => idx !== index))}
                style={styles.removeBtn}>
                <Text style={styles.removeText}>Удалить</Text>
              </TouchableOpacity>
            </View>
          ))}
          <SecondaryButton
            label="Добавить строку проволоки"
            onPress={() => setWire((prev) => [...prev, { type: 'd3', lengthCm: '0', qty: '0' }])}
          />
        </Card>

        <Card>
          <SectionTitle>Труба</SectionTitle>
          {tube.map((entry, index) => (
            <View key={`tube_${index}`} style={styles.rowGroup}>
              <TextInput
                value={entry.type}
                onChangeText={(value) =>
                  setTube((prev) =>
                    prev.map((item, idx) => (idx === index ? { ...item, type: value } : item))
                  )
                }
                placeholder="Вид трубы"
                style={styles.input}
              />
              <TextInput
                value={entry.lengthCm}
                onChangeText={(value) =>
                  setTube((prev) =>
                    prev.map((item, idx) =>
                      idx === index ? { ...item, lengthCm: value } : item
                    )
                  )
                }
                placeholder="Размер в см"
                keyboardType="numeric"
                style={styles.input}
              />
              <TextInput
                value={entry.qty}
                onChangeText={(value) =>
                  setTube((prev) =>
                    prev.map((item, idx) => (idx === index ? { ...item, qty: value } : item))
                  )
                }
                placeholder="Кол-во"
                keyboardType="numeric"
                style={styles.input}
              />
              <TouchableOpacity
                onPress={() => setTube((prev) => prev.filter((_, idx) => idx !== index))}
                style={styles.removeBtn}>
                <Text style={styles.removeText}>Удалить</Text>
              </TouchableOpacity>
            </View>
          ))}
          <SecondaryButton
            label="Добавить строку трубы"
            onPress={() => setTube((prev) => [...prev, { type: '20x20', lengthCm: '0', qty: '0' }])}
          />
        </Card>

        <Card>
          <SectionTitle>Прочие материалы</SectionTitle>
          {misc.map((entry, index) => (
            <View key={`misc_${index}`} style={styles.rowGroup}>
              <TextInput
                value={entry.name}
                onChangeText={(value) =>
                  setMisc((prev) =>
                    prev.map((item, idx) => (idx === index ? { ...item, name: value } : item))
                  )
                }
                placeholder="Название"
                style={styles.input}
              />
              <TextInput
                value={entry.qty}
                onChangeText={(value) =>
                  setMisc((prev) =>
                    prev.map((item, idx) => (idx === index ? { ...item, qty: value } : item))
                  )
                }
                placeholder="Кол-во"
                keyboardType="numeric"
                style={styles.input}
              />
              <TouchableOpacity
                onPress={() => setMisc((prev) => prev.filter((_, idx) => idx !== index))}
                style={styles.removeBtn}>
                <Text style={styles.removeText}>Удалить</Text>
              </TouchableOpacity>
            </View>
          ))}
          <SecondaryButton
            label="Добавить прочий материал"
            onPress={() => setMisc((prev) => [...prev, { name: '', qty: '0' }])}
          />
        </Card>

        <Card>
          <PrimaryButton label="Сохранить изделие" onPress={handleSave} />
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
  rowGroup: {
    marginBottom: 12,
  },
  removeBtn: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  removeText: {
    color: '#c03c2e',
    fontWeight: '600',
  },
});
