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
import { CreateLobbyRequest } from './util/types';
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


// Route to add user to users table

// Route to add user to lobbies table 

// Route to invite user to lobby (Only admin)

// Route to update points in table 

// Route to leave lobby 

// Route to kick from lobby (Only admin)

// Route to delete lobby (Only admin)

// Route to add admin perms to users
  

export default app
