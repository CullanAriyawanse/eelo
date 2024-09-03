import {
  DeleteItemCommand,
  DynamoDBClient,
  DynamoDBClientConfig,
  ListTablesCommand,
  PutItemCommand,
  QueryCommand,
  ScanCommand,
  UpdateItemCommand,
  AttributeValue
} from '@aws-sdk/client-dynamodb';
import validateEnv from './util/validateEnv';
import { v4 as uuidv4 } from 'uuid';
import { AlreadyExistsError, DataServiceError, InvalidParamError, InvalidSessionName, InvalidTrackDayDate } from './util/exceptions';
import { CreateLobbyRequest, LobbyUserInfo } from './util/types';

class DynamoDBService {
  client: DynamoDBClient;

  constructor(config: DynamoDBClientConfig) {
    this.client = new DynamoDBClient(config);
  }

  /**
   * Create user 
   * 
   * @param {string} userId 
   * @param {string} username 
   * @returns
   */
  public createUser = async (
    userId: string, 
    username: string
  ): Promise<string> => {
    const userMap: Record<string, AttributeValue> = {
      "userId": { S: userId },
      "username": { S: username },
      "lobbies": { L: [] },
      "lobbyInvites": { S: new Date().toISOString() },
      "GamesParticipated": { N: "0" }
    };

    const command = new PutItemCommand({
      TableName: validateEnv.USER_TABLE_NAME,
      Item: {
        UserId: { S: `USER#${userId}` },
        Username: { S: username },
        Lobbies: { L: [] },
        LobbyInvites: { L: [] },
        Friends: { L: [] }
      },
    });

    try {
      await this.client.send(command);
      console.log('User created');
      return 'User created';
    } catch (err) {
      console.log(`Error creating user: ${err}`);
      throw new DataServiceError(`Error creating user: ${err}`);
    }
  }

  /**
   * Add user to lobby 
   * 
   * @param {string} userId 
   * @param {string} lobbyId 
   * @returns
   */
  public addUserToLobby = async (
    userId: string, 
    lobbyId: string
  ): Promise<string> => {

    // TODO: Check user exists in users database

    const userMap: Record<string, AttributeValue> = {
      "UserId": { S: userId },
      "Points": { N: "800" },
      "Role": { S: "player" },
      "JoinDate": { S: new Date().toISOString() },
      "GamesParticipated": { N: "0" }
    };

    const command = new UpdateItemCommand({
      TableName: validateEnv.LOBBY_TABLE_NAME,
      Key: {
        LobbyId: { S: `LOBBY#${lobbyId}` },
      },
      UpdateExpression: "SET #users = list_append(#users, :newUser)",
      ExpressionAttributeNames: {
        "#users": "Users"
      },
      ExpressionAttributeValues: {
        ":newUser": { L: [{ M: userMap }] }
      },
      ReturnValues: "UPDATED_NEW"
    });

    // TODO: Remove invite from users lobby invites 

    try {
      await this.client.send(command);
      console.log('User added to lobby');
      return 'User added to lobby';
    } catch (err) {
      console.log(`Error adding user to lobby: ${err}`);
      throw new DataServiceError(`Error adding user to lobby: ${err}`);
    }
  }

  public inviteUsersToLobby = async (
    userIds: string[], 
    lobbyId: string
  ): Promise<string> => {
  
    // TODO: Check user exists in users database
  
    try {
      for (const userId of userIds) {
        const command = new UpdateItemCommand({
          TableName: validateEnv.USER_TABLE_NAME,
          Key: {
            UserId: { S: `USER#${userId}` },
          },
          UpdateExpression: "SET #lobbyInvites = list_append(if_not_exists(#lobbyInvites, :emptyList), :lobbyId)",
          ExpressionAttributeNames: {
            "#lobbyInvites": "LobbyInvites"
          },
          ExpressionAttributeValues: {
            ":lobbyId": { L: [{ S: `LOBBY#${lobbyId}` }] },
            ":emptyList": { L: [] }
          },
          ReturnValues: "UPDATED_NEW"
        });
  
        await this.client.send(command);
      }
      console.log('Users invited to lobby');
      return 'Users invited to lobby';
    } catch (err) {
      console.log(`Error inviting users to lobby: ${err}`);
      throw new DataServiceError(`Error inviting users to lobby: ${err}`);
    }
  }
  


  /**
   * Creates lobby
   * 
   * @param {string} lobbyName 
   * @param {string} userId 
   * @returns
   */
  public createLobby = async (
    lobbyName: string, 
    userId: string
  ): Promise<string> => {

    // TODO: Check user exists in users database

    const lobbyId = uuidv4();
    const userMap: Record<string, AttributeValue> = {
      "UserId": { S: userId },
      "Points": { N: "800" },
      "Role": { S: "owner" },
      "JoinDate": { S: new Date().toISOString() },
      "GamesParticipated": { N: "0" }
    };

    const command = new PutItemCommand({
      TableName: validateEnv.LOBBY_TABLE_NAME,
      Item: {
        LobbyId: { S: `LOBBY#${lobbyId}` },
        LobbyName: { S: lobbyName },
        Users: { L: [{ M: userMap }] },
        GamesPlayed: { N: "0" },
      },
    });

    try {
      await this.client.send(command);
      console.log('Lobby created');
      return 'Lobby created';
    } catch (err) {
      console.log(`Error creating lobby: ${err}`);
      throw new DataServiceError(`Error creating lobby: ${err}`);
    }
  }

  /**
   * Gets data from single lobby using lobbyId
   * 
   * @param {string} lobbyId
   * @returns {LobbyUserInfo[]} 
   */
  public getLobbyInfo = async (lobbyId: string): Promise<LobbyUserInfo[]> => {
    const command = new ScanCommand({
      TableName: validateEnv.LOBBY_TABLE_NAME,
      FilterExpression: '#pk = :lobbyIdPrefix',
      ExpressionAttributeNames: {
        '#pk': 'LobbyId',
      },
      ExpressionAttributeValues: {
        ':lobbyIdPrefix': { S: `TRACK#${lobbyId}` },
      },
    });

    try {
      const res = await this.client.send(command);
      const lobbyUserInfos: LobbyUserInfo[] = [];

      
      if (res.Items != undefined) {
        res.Items.forEach((record: any) => {
            // Get user name from users table given userId
            const userName = 'Bob'

            const item = {
              'userName': userName,
              'userId': record['userId']["S"],
              'points': record['points']["N"],
              'role': record['role']['S'],
              'joinDate': record['joinDate']['S'],
              'gamesParticipated': record['gamesParticipated']['N'],
            }
            lobbyUserInfos.push(item);
            console.log(lobbyUserInfos);
          });

          return lobbyUserInfos;
        } else {
          throw new DataServiceError(`Error getting lobby info`)
        }
    } catch (err) {
      throw new DataServiceError(`Error getting lobby info: ${err}`);
    }
  };
}

export default DynamoDBService;
