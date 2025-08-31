import OpenAI from 'openai';
import { config } from '../config/config.js';
import { getSystemPrompt, getCompareSystemPrompt, stylingPrompt, accuracyGuidelines } from '../prompts/prompts.js';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.api.apiKey,
  baseURL: config.api.apiUrl
});

/**
 * Analyze a single insurance policy
 * @param {string} fileContent - The policy content to analyze
 * @param {string} language - The target language for analysis
 * @returns {Promise<Stream>} OpenAI stream
 */
export async function analyzePolicyWithAI(fileContent, language) {
  const systemPrompt = getSystemPrompt(language);
  
  const stream = await openai.chat.completions.create({
    model: config.api.modelId,
    temperature: config.ai.analyzeTemperature,
    messages: [
      {
        role: "user",
        content: `${accuracyGuidelines} \n ${stylingPrompt} \n ${systemPrompt}\n Please analyze this insurance policy content:\n\n${fileContent}`
      }
    ],
    stream: true,
  });

  return stream;
}

/**
 * Compare multiple insurance policies
 * @param {Array} policyContents - Array of policy objects with name and content
 * @param {string} language - The target language for comparison
 * @returns {Promise<Stream>} OpenAI stream
 */
export async function comparePoliciesWithAI(policyContents, language) {
  const compareSystemPrompt = getCompareSystemPrompt(language);
  
  // Format policies for comparison
  const formattedPolicies = policyContents.map((policy, index) =>
    `### Policy ${index + 1}: ${policy.name}\n\n${policy.content}\n\n---\n\n`
  ).join('');

  const stream = await openai.chat.completions.create({
    model: config.api.modelId,
    temperature: config.ai.compareTemperature,
    messages: [
      {
        role: "user",
        content: `${accuracyGuidelines} \n ${stylingPrompt} \n - Split the comparison with tables, we want to comparison to be explicitly shown \n -${compareSystemPrompt}\n\nPlease compare these insurance policies:\n\n${formattedPolicies}`
      }
    ],
    stream: true,
  });

  return stream;
}