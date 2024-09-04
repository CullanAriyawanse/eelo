import {
  DeleteItemCommand,
  DynamoDBClient,
  DynamoDBClientConfig,
  ListTablesCommand,
  PutItemCommand,
  QueryCommand,
  ScanCommand,
  UpdateItemCommand,
  AttributeValue,
  GetItemCommand
} from '@aws-sdk/client-dynamodb';
import validateEnv from './util/validateEnv';
import { v4 as uuidv4 } from 'uuid';
import { AlreadyExistsError, DataServiceError, InvalidParamError, InvalidRole } from './util/exceptions';
import { CreateLobbyRequest, LobbyUserInfo } from './util/types';

class DynamoDBService {
  client: DynamoDBClient;

  constructor(config: DynamoDBClientConfig) {
    this.client = new DynamoDBClient(config);
  }


  // HELPER FUNCTIONS
  
  /**
   * Get user role in a lobby
   * 
   * @param {string} userId
   * @param {string} lobbyId
   * @returns {Promise<string|null>} The role of the user or null if the user is not found.
   */
  public getUserRoleInLobby = async (userId: string, lobbyId: string): Promise<string|null> => {
    const getLobbyCommand = new GetItemCommand({
      TableName: validateEnv.LOBBY_TABLE_NAME, // replace with your table name
      Key: {
        'LobbyId': { S: `LOBBY#${lobbyId}` }
      },
      ProjectionExpression: "Users"
    });

    try {
      const result = await this.client.send(getLobbyCommand);
      const users = result.Item?.Users?.L || [];

      for (const user of users) {
        if (user.M?.UserId?.S === userId) {
          return user.M.Role?.S || null; // return the role if found
        }
      }

      return null; // return null if user is not found in the lobby
    } catch (error) {
      console.error(`Failed to get user role: ${error}`);
      throw new Error(`Failed to get user role: ${error}`);
    }
  }

  public removeUserFromLobby = async (userId: string, lobbyId: string): Promise<string> => {
    try {
      // Fetch the user to get the current list of lobbies
      const getUserCommand = new GetItemCommand({
        TableName: validateEnv.USER_TABLE_NAME,
        Key: {
          UserId: { S: `USER#${userId}` }
        }
      });
  
      const userData = await this.client.send(getUserCommand);
      const lobbiesList = userData.Item?.Lobbies?.L ?? [];
      const lobbyIndex = lobbiesList.findIndex(lobby => lobby?.S === `LOBBY#${lobbyId}`);
  
      if (lobbyIndex === -1) {
        throw new Error("Lobby not found in user's lobbies");
      }
  
      // Update the user to remove the lobby from their Lobbies list
      const updateUserCommand = new UpdateItemCommand({
        TableName: validateEnv.USER_TABLE_NAME,
        Key: {
          UserId: { S: `USER#${userId}` },
        },
        UpdateExpression: `REMOVE Lobbies[${lobbyIndex}]`,
        ReturnValues: "UPDATED_NEW"
      });
  
      // Fetch the lobby to get the current list of users
      const getLobbyCommand = new GetItemCommand({
        TableName: validateEnv.LOBBY_TABLE_NAME,
        Key: {
          LobbyId: { S: `LOBBY#${lobbyId}` }
        }
      });
  
      const lobbyData = await this.client.send(getLobbyCommand);
      const usersList = lobbyData.Item?.Users?.L ?? [];
      const userIndex = usersList.findIndex(u => u?.S === `USER#${userId}`);
  
      if (userIndex === -1) {
        throw new Error("User not found in lobby");
      }
  
      // Update the lobby to remove the user
      const updateLobbyCommand = new UpdateItemCommand({
        TableName: validateEnv.LOBBY_TABLE_NAME,
        Key: {
          LobbyId: { S: `LOBBY#${lobbyId}` },
        },
        UpdateExpression: `REMOVE Users[${userIndex}]`,
        ReturnValues: "UPDATED_NEW"
      });
  
      // Sending both updates to DynamoDB
      await this.client.send(updateLobbyCommand);
      await this.client.send(updateUserCommand);
      console.log('Successfully removed user from lobby and lobby from user\'s lobbies');
      return 'Successfully removed user from lobby and lobby from user\'s lobbies';
    } catch (err) {
      console.log(`Error: ${err}`);
      throw new Error(`Error removing user from lobby or lobby from user's lobbies: ${err}`);
    }
  };
  


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
  try {
    // Adding user details to the lobby
    const userMap: Record<string, AttributeValue> = {
      "UserId": { S: userId },
      "Points": { N: "800" },
      "Role": { S: "player" },
      "JoinDate": { S: new Date().toISOString() },
      "GamesParticipated": { N: "0" }
    };

    const lobbyUpdateCommand = new UpdateItemCommand({
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

    // Adding lobby ID to the user's list of lobbies
    const userUpdateCommand = new UpdateItemCommand({
      TableName: validateEnv.USER_TABLE_NAME,
      Key: {
        UserId: { S: userId }
      },
      UpdateExpression: "SET Lobbies = list_append(if_not_exists(Lobbies, :empty_list), :lobbyId)",
      ExpressionAttributeValues: {
        ":empty_list": { L: [] },
        ":lobbyId": { L: [{ S: `LOBBY#${lobbyId}` }] }
      },
      ReturnValues: "UPDATED_NEW"
    });

    // Executing both updates
    await Promise.all([
      this.client.send(lobbyUpdateCommand),
      this.client.send(userUpdateCommand)
    ]);

    console.log('User added to lobby and lobby added to user\'s lobbies');
    return 'User added to lobby and lobby added to user\'s lobbies';
  } catch (err) {
    console.log(`Error adding user to lobby and updating user's lobbies: ${err}`);
    throw new DataServiceError(`Error adding user to lobby and updating user's lobbies: ${err}`);
  }
};

  /**
   * Invite users to lobby
   * 
   * @param {string[]} userIds 
   * @param {string} lobbyId 
   * @returns
   */
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
   * User leaves lobby themselves
   * 
   * @param {string} userId 
   * @param {string} lobbyId 
   * @returns {Promise<string>}
   */
  public userLeaveLobby = async (
    userId: string, 
    lobbyId: string
  ): Promise<string> => {
    try {
      this.removeUserFromLobby(userId, lobbyId);
      console.log('User left the lobby');
      return 'User left the lobby';
    } catch (err) {
      console.log(`Error when user leaving lobby: ${err}`);
      throw new DataServiceError(`Error when user leaving lobby: ${err}`);
    }
  };

  /**
   * Admin kicks user from lobby
   * @param {string} adminId
   * @param {string} userId 
   * @param {string} lobbyId 
   * @returns {Promise<string>}
   */
    public kickUserFromLobby = async (
      adminId: string,
      userId: string, 
      lobbyId: string
    ): Promise<string> => {
      try {
        const adminRole = await this.getUserRoleInLobby(adminId, lobbyId);
        if (adminRole !== "admin" || "owner") {
          console.log('Non admin cannot kick user from lobby');
          throw new InvalidRole()
        }

        this.removeUserFromLobby(userId, lobbyId);
        console.log('User left the lobby');
        return 'User left the lobby';
      } catch (err) {
        console.log(`Error when user leaving lobby: ${err}`);
        throw new DataServiceError(`Error when user leaving lobby: ${err}`);
      }
    };

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
