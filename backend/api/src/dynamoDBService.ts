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

    const lobbyId = uuidv4();
    const userMap: Record<string, AttributeValue> = {
      "UserId": { S: userId },
      "Points": { N: "800" },
      "Role": { S: "admin" },
      "JoinDate": { S: new Date().toISOString() },
      "GamesParticipated": { N: "0" }
    };

    const command = new PutItemCommand({
      TableName: validateEnv.LOBBY_TABLE_NAME,
      Item: {
        LobbyId: { S: `LOBBY#${lobbyId}` },
        LobbyName: { S: lobbyName },
        Users: { M: userMap },
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

  public getLobbyInfo = async (lobbyId: string): Promise<LobbyUserInfo[]> => {
    const command = new ScanCommand({
      TableName: validateEnv.LOBBY_TABLE_NAME,
      FilterExpression: '#pk = :lobbyIdPrefix',
      ExpressionAttributeNames: {
        '#pk': 'LobbyId',
      },
      ExpressionAttributeValues: {
        ':trackDayPrefix': { S: `TRACK#${lobbyId}` },
      },
    });

    try {
      const res = await this.client.send(command);
      const lobbyUserInfos: LobbyUserInfo[] = [];

        // Get user name from users table given userId
        const userName = 'Bob'

        if (res.Items != undefined) {
          res.Items.forEach((record: any) => {
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
        }
        return lobbyUserInfos;
    } catch (err) {
      throw new DataServiceError(`Error getting track days: ${err}`);
    }
  };
}

export default DynamoDBService;
