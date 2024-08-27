import {
  DeleteItemCommand,
  DynamoDBClient,
  DynamoDBClientConfig,
  ListTablesCommand,
  PutItemCommand,
  QueryCommand,
  ScanCommand,
  UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';
import validateEnv from './util/validateEnv';

class DynamoDBService {
  client: DynamoDBClient;

  constructor(config: DynamoDBClientConfig) {
    this.client = new DynamoDBClient(config);
  }

  public convertSessionIdToName = (sessionName: string): string => {
    return sessionName.replace(/\s/g, '_').toUpperCase();
  }
}

export default DynamoDBService;
