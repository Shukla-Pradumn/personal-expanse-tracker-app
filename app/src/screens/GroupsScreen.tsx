import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AppFooter from '../components/AppFooter';
import { Colors } from '../theme/colors';
import { createGroup, getGroups, joinGroup } from '../services/groupService';
import type { GroupItem } from '../types/models';

export default function GroupsScreen({ navigation }: { navigation: any }) {
  const [groups, setGroups] = React.useState<GroupItem[]>([]);
  const [groupName, setGroupName] = React.useState('');
  const [joiningGroupId, setJoiningGroupId] = React.useState('');

  const loadGroups = React.useCallback(async () => {
    const items = await getGroups().catch(() => []);
    setGroups(items);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadGroups();
    }, [loadGroups]),
  );

  const onCreate = async () => {
    const trimmed = groupName.trim();
    if (!trimmed) {
      Alert.alert('Missing group name', 'Please enter a group name.');
      return;
    }
    await createGroup(trimmed);
    setGroupName('');
    loadGroups();
  };

  const onJoin = async () => {
    const id = joiningGroupId.trim();
    if (!id) {
      Alert.alert('Missing group id', 'Please enter group ID to join.');
      return;
    }
    await joinGroup(id);
    setJoiningGroupId('');
    loadGroups();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Dashboard')}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Groups</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>CREATE GROUP</Text>
        <TextInput
          value={groupName}
          onChangeText={setGroupName}
          placeholder="Trip to Goa"
          placeholderTextColor="#666"
          style={styles.input}
        />
        <TouchableOpacity style={styles.primaryBtn} onPress={onCreate}>
          <Text style={styles.primaryText}>CREATE</Text>
        </TouchableOpacity>

        <Text style={styles.label}>JOIN GROUP (BY ID)</Text>
        <TextInput
          value={joiningGroupId}
          onChangeText={setJoiningGroupId}
          placeholder="grp_..."
          placeholderTextColor="#666"
          style={styles.input}
        />
        <TouchableOpacity style={styles.secondaryBtn} onPress={onJoin}>
          <Text style={styles.secondaryText}>JOIN</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>My Groups</Text>
      <View style={styles.listWrap}>
        {groups.length ? (
          groups.map(group => (
            <TouchableOpacity
              key={group.groupId}
              style={styles.groupCard}
              onPress={() => navigation.navigate('GroupDetails', { group })}
            >
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.groupMeta}>{group.groupId}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>No groups yet.</Text>
        )}
      </View>
      <AppFooter />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 16 },
  header: { paddingTop: 10, marginBottom: 16 },
  back: { color: Colors.gold, fontSize: 14, fontWeight: '700', marginBottom: 12 },
  title: { color: '#FFF', fontSize: 30, fontWeight: '700' },
  card: {
    backgroundColor: Colors.card,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  label: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 8,
    marginBottom: 8,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    backgroundColor: Colors.footer,
    color: Colors.textPrimary,
    paddingHorizontal: 12,
  },
  primaryBtn: {
    marginTop: 10,
    height: 42,
    borderRadius: 10,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: '#111', fontWeight: '800', letterSpacing: 1.2 },
  secondaryBtn: {
    marginTop: 10,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.footer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { color: Colors.gold, fontWeight: '800', letterSpacing: 1.2 },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: '700', marginVertical: 10 },
  listWrap: { gap: 8, paddingBottom: 110 },
  groupCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.card,
    padding: 12,
  },
  groupName: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  groupMeta: { color: '#777', marginTop: 6, fontSize: 12 },
  emptyText: { color: '#777' },
});
