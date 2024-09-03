import cors from 'cors';
import express, { Request, Response } from 'express';
import { DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { ServerlessAdapter } from '@h4ad/serverless-adapter';
import { ApiGatewayV2Adapter } from '@h4ad/serverless-adapter/lib/adapters/aws';
import { ExpressFramework } from '@h4ad/serverless-adapter/lib/frameworks/express';
import { DefaultHandler } from '@h4ad/serverless-adapter/lib/handlers/default';
import { PromiseResolver } from '@h4ad/serverless-adapter/lib/resolvers/promise';
import DynamoDBService from './dynamoDBService';
import validateEnv from './util/validateEnv';
import { CreateLobbyRequest, CreateUserRequest } from './util/types';
import { BadRequestError } from './util/exceptions';

const PORT = 8000;
const app = express();

app.use(cors());
app.use(express.json());

export const handler = ServerlessAdapter.new(app)
  .setFramework(new ExpressFramework())
  .setHandler(new DefaultHandler())
  .setResolver(new PromiseResolver())
  .addAdapter(new ApiGatewayV2Adapter())
  .build();
  

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`App listening on port: ${PORT}`);
  });
}

const dbConfig: DynamoDBClientConfig = {
  endpoint: validateEnv.DYNAMODB_ENDPOINT,
  region: validateEnv.AWS_REGION,
};

const dbService = new DynamoDBService(dbConfig);

app.get('/', (req: Request, res: Response) => {
  return res.status(200).json({ message: 'API Lambda function' });
});

// Route to create lobby 
app.post('/api/lobby/create-lobby', async (req: Request, res: Response) => {
  try {
    const createLobbyRequest = req.body as CreateLobbyRequest;
    const response = await dbService.createLobby(
      createLobbyRequest.lobbyName,
      createLobbyRequest.userId
    );

    return res.status(200).json({ message: response });

  } catch (err) {
    if (err instanceof BadRequestError) {
      return res.status(400).send({ message: err.message });
    } else {
      return res.status(500).json({ message: `Server error: ${err}` });
    }
  }
})

// Get lobby information
app.get('/api/log_management/lobby-info', async (req: Request, res: Response) => {
  try {
    const lobbyId = req.body.lobbyId;
    const response = await dbService.getLobbyInfo(lobbyId);

    return res.status(200).json(response);
  } catch (err) {
    if (err instanceof BadRequestError) {
      return res.status(400).json({ message: err.message });
    } else {
      return res.status(500).json({ message: `Server error: ${err}` });
    }
  }
});


// Add user to users table
app.post('/api/lobby/create-user', async (req: Request, res: Response) => {
  try {
    const createUserRequest = req.body as CreateUserRequest;
    const response = await dbService.createUser(
      createUserRequest.userId,
      createUserRequest.username
    );

    return res.status(200).json({ message: response });

  } catch (err) {
    if (err instanceof BadRequestError) {
      return res.status(400).send({ message: err.message });
    } else {
      return res.status(500).json({ message: `Server error: ${err}` });
    }
  }
})

// Add user to lobbies table 
app.patch('/api/lobby/add-user-to-lobby', async (req: Request, res: Response) => {
  try {
    const userId = req.body.userId;
    const lobbyId = req.body.lobbyId;
    const response = await dbService.addUserToLobby(
      userId,
      lobbyId,
    );

    return res.status(200).json({ message: response });

  } catch (err) {
    if (err instanceof BadRequestError) {
      return res.status(400).send({ message: err.message });
    } else {
      return res.status(500).json({ message: `Server error: ${err}` });
    }
  }
})

// Invite user to lobby (Only admimn/owner)

// Update points in table 

// Leave lobby 

// Kick from lobby (Only admimn/owner)

// Delete lobby (Only admimn/owner)

// Add admin perms to users

// Increase/decrease points to multiple users 
  

export default app
