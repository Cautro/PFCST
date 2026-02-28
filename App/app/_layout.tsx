import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AppProvider } from '@/context/app-context';

export default function RootLayout() {
  return (
    <AppProvider>
      <Stack screenOptions={{ headerShown: true }}>
        <Stack.Screen name="index" options={{ title: 'Меню' }} />
        <Stack.Screen name="login" options={{ title: 'Вход/Авторизация' }} />
        <Stack.Screen name="orders/index" options={{ title: 'Заказы' }} />
        <Stack.Screen name="orders/[id]" options={{ title: 'Подробнее о заказе' }} />
        <Stack.Screen name="orders/edit" options={{ title: 'Добавление заказа' }} />
        <Stack.Screen name="in-progress/index" options={{ title: 'Заказы в процессе' }} />
        <Stack.Screen name="in-progress/[id]" options={{ title: 'Изготовление заказа' }} />
        <Stack.Screen name="paint/index" options={{ title: 'Покрас изделий' }} />
        <Stack.Screen name="paint/[id]" options={{ title: 'Покрас заказа' }} />
        <Stack.Screen name="completed/index" options={{ title: 'Выполненные заказы' }} />
        <Stack.Screen name="assortment/index" options={{ title: 'Ассортимент' }} />
        <Stack.Screen name="assortment/[id]" options={{ title: 'Подробнее об изделии' }} />
        <Stack.Screen name="assortment/edit" options={{ title: 'Добавление изделия' }} />
        <Stack.Screen name="users/index" options={{ title: 'Пользователи' }} />
        <Stack.Screen name="users/[id]" options={{ title: 'Подробнее о сотруднике' }} />
        <Stack.Screen name="profile" options={{ title: 'ФИО пользователя' }} />
      </Stack>
      <StatusBar style="dark" />
    </AppProvider>
  );
}
