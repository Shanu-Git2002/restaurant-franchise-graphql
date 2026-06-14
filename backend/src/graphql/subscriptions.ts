import { PubSub } from 'graphql-subscriptions';

export const pubsub = new PubSub();

export const EVENTS = {
  OUTLET_STATUS_CHANGED: 'OUTLET_STATUS_CHANGED',
  NEW_REVIEW: 'NEW_REVIEW',
  REVIEW_RESPONSE_ADDED: 'REVIEW_RESPONSE_ADDED',
  DASHBOARD_UPDATED: 'DASHBOARD_UPDATED',
} as const;
