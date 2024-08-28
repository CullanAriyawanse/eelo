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
      "JoinTime": { S: new Date().toISOString() },
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
}

export default DynamoDBService;
