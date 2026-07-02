import boto3

from app.config import settings


def get_dynamodb_resource():
    return boto3.resource("dynamodb", region_name=settings.aws_region)


def get_users_table():
    dynamodb = get_dynamodb_resource()
    return dynamodb.Table(settings.dynamodb_users_table)


def get_monitors_table():
    dynamodb = get_dynamodb_resource()
    return dynamodb.Table(settings.dynamodb_monitors_table)


def get_checks_table():
    dynamodb = get_dynamodb_resource()
    return dynamodb.Table(settings.dynamodb_checks_table)


def get_incidents_table():
    dynamodb = get_dynamodb_resource()
    return dynamodb.Table(settings.dynamodb_incidents_table)
