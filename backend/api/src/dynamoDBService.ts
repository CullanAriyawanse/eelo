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


  /**
   * HELPER FUNCTIONS
   */
  
  /**
   * Get user role in a lobby
   * 
   * @param {string} userId
   * @param {string} lobbyId
   * @returns {Promise<string|null>} The role of the user or null if the user is not found.
   */
  public getUserRoleInLobby = async (userId: string, lobbyId: string): Promise<string|null> => {
    const getLobbyCommand = new GetItemCommand({
      TableName: validateEnv.LOBBY_TABLE_NAME, 
      Key: {
        'LobbyId': { S: `LOBBY#${lobbyId}` }
      },
      ProjectionExpression: "#users",
      ExpressionAttributeNames: {
        "#users": "Users" 
      }
    });

    try {
      const result = await this.client.send(getLobbyCommand);
      const users = result.Item?.Users?.L || [];

      for (const user of users) {
        if (user.M?.userId?.S === userId) {
          return user.M.role?.S || null; // return the role if found
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
        },
        ProjectionExpression: "#users",
        ExpressionAttributeNames: {
          "#users": "Users" 
        }
      });
  
      const lobbyData = await this.client.send(getLobbyCommand);
      const usersList = lobbyData.Item?.Users?.L || [];
      const userIndex = usersList.findIndex(u => u.M?.userId?.S === `${userId}`);
  
      if (userIndex === -1) {
        throw new Error("User not found in lobby");
      }
  
      // Update the lobby to remove the user
      const updateLobbyCommand = new UpdateItemCommand({
        TableName: validateEnv.LOBBY_TABLE_NAME,
        Key: {
          LobbyId: { S: `LOBBY#${lobbyId}` },
        },
        UpdateExpression: `REMOVE #users[${userIndex}]`, 
        ExpressionAttributeNames: {
          "#users": "Users" 
        },
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

  public addLobbyIdToLobbies = async (userId: string, lobbyId: string): Promise<string> => {
    try {
      // Adding lobby ID to the user's list of lobbies
      const userUpdateCommand = new UpdateItemCommand({
        TableName: validateEnv.USER_TABLE_NAME,
        Key: {
          UserId: { S: `USER#${userId}` }
        },
        UpdateExpression: "SET Lobbies = list_append(if_not_exists(Lobbies, :empty_list), :lobbyId)",
        ExpressionAttributeValues: {
          ":empty_list": { L: [] },
          ":lobbyId": { L: [{ S: `LOBBY#${lobbyId}` }] }
        },
        ReturnValues: "UPDATED_NEW"
      });

      await this.client.send(userUpdateCommand);
      console.log(`Added lobby Id to ${userId}'s lobbies list`);
      return `Added lobby Id to ${userId}'s lobbies list`;
    } catch (err) {
      console.log(`Error adding lobby id to ${userId}'s lobbies list: ${err}`);
      throw new DataServiceError(`Error adding lobby id to ${userId}'s lobbies list: ${err}`);
    }
  }

  public removeFriendInvite = async (senderUserId: string, receiverUserId: string): Promise<string> => {
    try {
     const getUserCommand = new GetItemCommand({
       TableName: validateEnv.USER_TABLE_NAME,
       Key: {
         UserId: { S: `USER#${receiverUserId}` }
       },
       ProjectionExpression: "FriendsInvites"
     });
 
     const userData = await this.client.send(getUserCommand);
     const invitesList = userData.Item?.FriendsInvites?.L ?? [];
     const inviteIndex = invitesList.findIndex(invite => invite?.S === `${senderUserId}`);
 
     if (inviteIndex === -1) {
       throw new Error("Friend invite not found in user's invites");
     }
 
     // Update the user to remove the friend from their invites list
     const updateUserCommand = new UpdateItemCommand({
       TableName: validateEnv.USER_TABLE_NAME,
       Key: {
         UserId: { S: `USER#${receiverUserId}` },
       },
       UpdateExpression: `REMOVE FriendsInvites[${inviteIndex}]`,
       ReturnValues: "UPDATED_NEW"
     });
 
      await this.client.send(updateUserCommand);
      console.log(`Successfully removed friend invite from ${senderUserId} to ${receiverUserId}`);
      return `Successfully removed friend invite from ${senderUserId} to ${receiverUserId}`;
    } catch (err) {
      console.log(`Error removing friend invite from ${senderUserId} to ${receiverUserId}: ${err}`);
      throw new Error(`Error removing friend invite from ${senderUserId} to ${receiverUserId}: ${err}`);
    }
  }

  /**
   * NON-HELPER FUNCTIONS
   */

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
        Friends: { L: [] },
        FriendsInvites: { L: [] }
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
      "userId": { S: userId },
      "points": { N: "800" },
      "role": { S: "player" },
      "joinDate": { S: new Date().toISOString() },
      "gamesParticipated": { N: "0" }
    };

    // Add user object to users column in lobby 
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
    await this.client.send(lobbyUpdateCommand)
    const addLobbyResponse = await this.addLobbyIdToLobbies(userId, lobbyId);
    console.log(addLobbyResponse);

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

    // TODO: Check user is not already invited

    // TODO: Check user doesn't already exist in lobby 
  
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
   * Remove lobby invite
   * 
   * @param {string} userId
   * @param {string} lobbyId 
   * @returns {Promise<string>}
   */
  public removeLobbyInvite = async (
    userId: string, 
    lobbyId: string
  ): Promise<string> => {
    try {
      // Fetch the user to get the current list of lobby invites
      const getUserCommand = new GetItemCommand({
        TableName: validateEnv.USER_TABLE_NAME,
        Key: {
          UserId: { S: `USER#${userId}` }
        },
        ProjectionExpression: "LobbyInvites"
      });

      const userData = await this.client.send(getUserCommand);
      const invitesList = userData.Item?.LobbyInvites?.L ?? [];
      const inviteIndex = invitesList.findIndex(invite => invite?.S === `LOBBY#${lobbyId}`);

      if (inviteIndex === -1) {
        throw new Error("Lobby invite not found in user's invites");
      }

      // Update the user to remove the lobby from their invites list
      const updateUserCommand = new UpdateItemCommand({
        TableName: validateEnv.USER_TABLE_NAME,
        Key: {
          UserId: { S: `USER#${userId}` },
        },
        UpdateExpression: `REMOVE LobbyInvites[${inviteIndex}]`,
        ReturnValues: "UPDATED_NEW"
      });

      await this.client.send(updateUserCommand);
      console.log('Removed lobby id from invites list');
      return 'Removed lobby id from invites list';
    } catch (err) {
      console.log(`Error removing lobby id from invites list: ${err}`);
      throw new DataServiceError(`Error removing lobby id from invites list: ${err}`);
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
        if (adminRole !== "admin" && adminRole !== "owner") {
          console.log(`Role is ${adminRole}`);
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

  // TODO: LobbyId should be added to lobbies list in users table when user creates lobby
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
      "userId": { S: userId },
      "points": { N: "800" },
      "role": { S: "owner" },
      "joinDate": { S: new Date().toISOString() },
      "gamesParticipated": { N: "0" }
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

      // Add lobby ID to the user's list of lobbies
      const addLobbyResponse = await this.addLobbyIdToLobbies(userId, lobbyId);
      console.log(addLobbyResponse);

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
        ':lobbyIdPrefix': { S: `LOBBY#${lobbyId}` },
      },
    });

    try {
      const res = await this.client.send(command);
      const lobbyUserInfos: LobbyUserInfo[] = [];

      if (res.Items != undefined) {
        res.Items.forEach((record: any) => {
            // Get user name from users table given userId
            const username = 'Bob'

            const item = {
              'username': username,
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

  /**
   * Send friend invite 
   * 
   * @param {string} senderUserId
   * @param {string} receiverUserId
   * @returns 
   */
  public sendFriendInvite = async (senderUserId: string, receiverUserId: string): Promise<string> => {
    try {
      // Adding sender user id to FriendsInvites list
      const userUpdateCommand = new UpdateItemCommand({
        TableName: validateEnv.USER_TABLE_NAME,
        Key: {
          UserId: { S: `USER#${receiverUserId}` }
        },
        UpdateExpression: "SET FriendsInvites = list_append(if_not_exists(FriendsInvites, :empty_list), :senderUserId)",
        ExpressionAttributeValues: {
          ":empty_list": { L: [] },
          ":senderUserId": { L: [{ S: `${senderUserId}` }] }
        },
        ReturnValues: "UPDATED_NEW"
      });

      await this.client.send(userUpdateCommand);
      console.log(`Sent friend invite from user ${senderUserId} to user ${receiverUserId}`);
      return `Sent friend invite from user ${senderUserId} to user ${receiverUserId}`;
    } catch (err) {
      console.log(`Error sending friend invite from user ${senderUserId} to user ${receiverUserId}: ${err}`);
      throw new DataServiceError(`Error sending friend invite from user ${senderUserId} to user ${receiverUserId}: ${err}`);
    }
  }

  /**
   * Accept friend invite 
   * 
   * @param {string} senderUserId
   * @param {string} receiverUserId
   * @returns 
   */
  public acceptFriendInvite = async (senderUserId: string, receiverUserId: string): Promise<string> => {
    try {
      // Adding sender user id to Friends list of receving user 
      const addSenderIdToFriends = new UpdateItemCommand({
        TableName: validateEnv.USER_TABLE_NAME,
        Key: {
          UserId: { S: `USER#${receiverUserId}` }
        },
        UpdateExpression: "SET Friends = list_append(if_not_exists(Friends, :empty_list), :senderUserId)",
        ExpressionAttributeValues: {
          ":empty_list": { L: [] },
          ":senderUserId": { L: [{ S: `${senderUserId}` }] }
        },
        ReturnValues: "UPDATED_NEW"
      });

      // Adding receover user id to Friends list of sending user 
      const addReceiverIdToFriends = new UpdateItemCommand({
        TableName: validateEnv.USER_TABLE_NAME,
        Key: {
          UserId: { S: `USER#${senderUserId}` }
        },
        UpdateExpression: "SET Friends = list_append(if_not_exists(Friends, :empty_list), :receiverUserId)",
        ExpressionAttributeValues: {
          ":empty_list": { L: [] },
          ":receiverUserId": { L: [{ S: `${receiverUserId}` }] }
        },
        ReturnValues: "UPDATED_NEW"
      });

      await Promise.all([
        this.client.send(addSenderIdToFriends),
        this.client.send(addReceiverIdToFriends),
        this.removeFriendInvite(senderUserId, receiverUserId)
      ]);

      console.log(`Accepted invite from user ${senderUserId} to user ${receiverUserId}`);
      return `Accepted invite from user ${senderUserId} to user ${receiverUserId}`;
    } catch (err) {
      console.log(`Error accepting invite from user ${senderUserId} to user ${receiverUserId}: ${err}`);
      throw new DataServiceError(`Error accepting invite from user ${senderUserId} to user ${receiverUserId}: ${err}`);
    }
  }

  /**
   * Remove friend
   * 
   * @param {string} senderUserId
   * @param {string} receiverUserId
   * @returns 
   */
  public removeFriend = async (senderUserId: string, receiverUserId: string): Promise<string> => {
    try {
      // Remove sender user from receiver user friends
      const getReceiverUserCommand = new GetItemCommand({
        TableName: validateEnv.USER_TABLE_NAME,
        Key: {
          UserId: { S: `USER#${receiverUserId}` }
        },
        ProjectionExpression: "Friends"
      });
  
      const receiverUserData = await this.client.send(getReceiverUserCommand);
      const receiverFriendsList = receiverUserData.Item?.Friends?.L ?? [];
      const receiverFriendIndex = receiverFriendsList.findIndex(friend => friend?.S === `${senderUserId}`);
  
      if (receiverFriendIndex === -1) {
        throw new Error("Sender friend not found in receiver user's friends list");
      }
  
      const updateReceiverUserCommand = new UpdateItemCommand({
        TableName: validateEnv.USER_TABLE_NAME,
        Key: {
          UserId: { S: `USER#${receiverUserId}` },
        },
        UpdateExpression: `REMOVE Friends[${receiverFriendIndex}]`,
        ReturnValues: "UPDATED_NEW"
      });

      // Remove receiver user from sender user friends
      const getSenderUserCommand = new GetItemCommand({
        TableName: validateEnv.USER_TABLE_NAME,
        Key: {
          UserId: { S: `USER#${senderUserId}` }
        },
        ProjectionExpression: "Friends"
      });
  
      const senderUserData = await this.client.send(getSenderUserCommand);
      const senderFriendsList = senderUserData.Item?.Friends?.L ?? [];
      const senderFriendIndex = senderFriendsList.findIndex(friend => friend?.S === `${receiverUserId}`);
  
      if (senderFriendIndex === -1) {
        throw new Error("Friend not found in user's friends list");
      }
  
      // Update the user to remove the friend from their invites list
      const updateSenderUserCommand = new UpdateItemCommand({
        TableName: validateEnv.USER_TABLE_NAME,
        Key: {
          UserId: { S: `USER#${senderUserId}` },
        },
        UpdateExpression: `REMOVE Friends[${senderFriendIndex}]`,
        ReturnValues: "UPDATED_NEW"
      });

      await Promise.all([
        this.client.send(updateReceiverUserCommand),
        this.client.send(updateSenderUserCommand),
      ]);
       console.log(`Successfully removed friend from ${senderUserId} to ${receiverUserId}`);
       return `Successfully removed friend from ${senderUserId} to ${receiverUserId}`;
     } catch (err) {
       console.log(`Error removing friend from ${senderUserId} to ${receiverUserId}: ${err}`);
       throw new Error(`Error removing friend from ${senderUserId} to ${receiverUserId}: ${err}`);
     }
  };

}

export default DynamoDBService;
