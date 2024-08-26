#!/bin/bash

aws configure set aws_access_key_id test --profile test
aws configure set aws_secret_access_key test --profile test
aws configure set region ap-southeast-2 --profile test
aws configure set cli_pager true --profile test

AWS_OPTIONS="--profile test --endpoint-url http://localhost:4566"
AWS_ACCOUND_ID="000000000000"

aws dynamodb create-table \
    --table-name users-database \
    --attribute-definitions \
        AttributeName=UserId,AttributeType=S \
    --key-schema \
        AttributeName=UserId,KeyType=HASH \
    --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 \
    $AWS_OPTIONS

aws dynamodb create-table \
    --table-name lobbies-database \
    --attribute-definitions \
        AttributeName=UserId,AttributeType=S \
    --key-schema \
        AttributeName=UserId,KeyType=HASH \
    --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 \
    $AWS_OPTIONS

awslocal cognito-idp create-user-pool --pool-name test