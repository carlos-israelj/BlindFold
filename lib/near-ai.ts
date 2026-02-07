import OpenAI from 'openai';
import { NEAR_AI_BASE_URL, DEFAULT_MODEL } from './constants';

export function createNearAIClient() {
  return new OpenAI({
    baseURL: NEAR_AI_BASE_URL,
    apiKey: process.env.NEAR_AI_API_KEY || '',
  });
}

export const nearAIClient = createNearAIClient();

export { DEFAULT_MODEL };
