import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { Card, YStack, Text as TText, XStack } from 'tamagui';

const USER_ID = '1';

interface LobbyInfo {
  lobbyName: string;
  numberOfUsers: number;
}

export default function Home() {
  const [lobbies, setLobbies] = useState<LobbyInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLobbies = async () => {
      try {
        const lobbiesResponse = await fetch(
          `http://localhost:8000/api/user/all-lobbies?userId=${USER_ID}`
        );
        const lobbiesData = await lobbiesResponse.json();
        const lobbyIds: string[] = lobbiesData.lobbies;

        const lobbyInfoPromises = lobbyIds.map(async (lobbyId) => {
          console.log(`LOBBY ID IS ${lobbyId}`);
          const lobbyInfoResponse = await fetch(
            `http://localhost:8000/api/lobby/lobby-info?=${lobbyId}`,
          );
          const lobbyInfo = await lobbyInfoResponse.json();

          return {
            lobbyName: lobbyInfo.lobbyName || 'Unknown Lobby',
            numberOfUsers: lobbyInfo.length || 0,
          };
        });

        const lobbyInfos = await Promise.all(lobbyInfoPromises);
        setLobbies(lobbyInfos);
      } catch (error) {
        console.error('Error fetching lobbies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLobbies();
  }, []);

  const renderLobby = ({ item }: { item: LobbyInfo }) => (
    <Card elevate size="$4" borderRadius="$4" backgroundColor="#D3D3D3" marginVertical="$2">
      <XStack justifyContent="space-between" alignItems="center" padding="$3">
        <TText fontWeight="700" fontSize="$5">
          {item.lobbyName}
        </TText>
        <XStack alignItems="center" gap="$1">
          <TText fontWeight="700" fontSize="$5">
            {item.numberOfUsers}
          </TText>
          <TText fontSize="$5">👤</TText>
        </XStack>
      </XStack>
    </Card>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Home' }} />
      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color="black" />
        ) : (
          <FlatList
            data={lobbies}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderLobby}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
});
