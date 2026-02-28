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

type User = {
  id: string;
  name: string;
  login: string;
  password: string;
  role: string;
  department: string;
};

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Руководитель' },
  { value: 'deputy', label: 'Зам. руководителя' },
  { value: 'support', label: 'Тех. поддержка' },
  { value: 'worker', label: 'Сотрудник' },
];

const DEPARTMENTS = [
  { value: 'welding', label: 'Сварка' },
  { value: 'paint', label: 'Покраска' },
];

export default function UsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('worker');
  const [department, setDepartment] = useState('welding');

  const loadUsers = useCallback(async () => {
    const data = await api.get<User[]>('/users');
    setUsers(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [loadUsers])
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id]
    );
  };

  const handleDelete = async () => {
    if (selected.length === 0) {
      Alert.alert('Выберите сотрудников для удаления');
      return;
    }
    Alert.alert('Удалить выбранных сотрудников?', 'Данные будут удалены безвозвратно.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          await api.del('/users', { ids: selected });
          setSelected([]);
          setDeleteMode(false);
          await loadUsers();
        },
      },
    ]);
  };

  const handleAdd = async () => {
    if (!name || !login || !password) {
      Alert.alert('Заполните все поля');
      return;
    }
    await api.post('/users', {
      name,
      login,
      password,
      role,
      department,
    });
    setName('');
    setLogin('');
    setPassword('');
    await loadUsers();
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Card>
          <SectionTitle>Добавление сотрудника</SectionTitle>
          <Text style={styles.label}>ФИО сотрудника</Text>
          <TextInput value={name} onChangeText={setName} style={styles.input} />
          <Text style={styles.label}>Логин</Text>
          <TextInput value={login} onChangeText={setLogin} style={styles.input} />
          <Text style={styles.label}>Пароль</Text>
          <TextInput value={password} onChangeText={setPassword} style={styles.input} />
          <Text style={styles.label}>Должность</Text>
          <View style={styles.choiceRow}>
            {ROLE_OPTIONS.map((entry) => (
              <TouchableOpacity
                key={entry.value}
                onPress={() => setRole(entry.value)}
                style={[
                  styles.choiceChip,
                  role === entry.value && styles.choiceChipActive,
                ]}>
                <Text
                  style={[
                    styles.choiceText,
                    role === entry.value && styles.choiceTextActive,
                  ]}>
                  {entry.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Цех</Text>
          <View style={styles.choiceRow}>
            {DEPARTMENTS.map((entry) => (
              <TouchableOpacity
                key={entry.value}
                onPress={() => setDepartment(entry.value)}
                style={[
                  styles.choiceChip,
                  department === entry.value && styles.choiceChipActive,
                ]}>
                <Text
                  style={[
                    styles.choiceText,
                    department === entry.value && styles.choiceTextActive,
                  ]}>
                  {entry.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.actions}>
            <PrimaryButton label="Сохранить сотрудника" onPress={handleAdd} />
          </View>
        </Card>

        <Card>
          <SectionTitle>Список сотрудников</SectionTitle>
          <View style={styles.actions}>
            <SecondaryButton
              label={deleteMode ? 'Отмена удаления' : 'Удалить сотрудников'}
              onPress={() => {
                setDeleteMode((prev) => !prev);
                setSelected([]);
              }}
            />
            {deleteMode && (
              <PrimaryButton label="Подтвердить удаление" onPress={handleDelete} />
            )}
          </View>
        </Card>

        {users.map((user) => (
          <Card key={user.id}>
            <View style={styles.userRow}>
              <Text style={styles.userName}>{user.name}</Text>
              {deleteMode ? (
                <TouchableOpacity onPress={() => toggleSelect(user.id)}>
                  <Text style={styles.checkboxText}>
                    {selected.includes(user.id) ? '[x]' : '[ ]'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Link href={`/users/${user.id}`} style={styles.link}>
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
  actions: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  choiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  choiceChip: {
    borderWidth: 1,
    borderColor: '#dcd4c4',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  choiceChipActive: {
    backgroundColor: '#24324a',
    borderColor: '#24324a',
  },
  choiceText: {
    color: '#3c3227',
  },
  choiceTextActive: {
    color: '#ffffff',
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userName: {
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
