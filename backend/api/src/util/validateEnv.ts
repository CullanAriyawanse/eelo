import { config } from 'dotenv';
import { cleanEnv, str } from 'envalid';

config({ path: '.env' }); // Read in environment variables from `.env` if it exists

const validateEnv = cleanEnv(process.env, {
  // aws environment variables
  DYNAMODB_ENDPOINT: str({ default: 'http://localstack:4566' }),
  AWS_REGION: str({ default: 'ap-southeast-2' }),
  TABLE_NAME: str({ default: 'log-management-database' }),
});

export default validateEnv;
