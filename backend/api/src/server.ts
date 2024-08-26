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

app.get('/', (req: Request, res: Response) => {
  return res.status(200).json({ message: 'log-management lambda function' });
});
  

export default app
