import { config } from '../config/config.js';
import { getSystemPrompt, getCompareSystemPrompt, stylingPrompt, accuracyGuidelines } from '../prompts/prompts.js';

/**
 * Make a request to the OpenAI-compatible API
 * @param {Object} payload - The request payload
 * @returns {Promise<Response>} The API response
 */
async function makeApiRequest(payload) {
  const response = await fetch(config.api.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.api.apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorData.error ? errorData.error.message : 'Unknown error'}`);
  }

  return response;
}

/**
 * Analyze a single insurance policy
 * @param {string} fileContent - The policy content to analyze
 * @param {string} language - The target language for analysis
 * @returns {Promise<Response>} The streaming API response
 */
export async function analyzePolicyWithAI(fileContent, language) {
  const systemPrompt = getSystemPrompt(language);
  
  const payload = {
    model: config.api.modelId,
    temperature: config.ai.analyzeTemperature,
    messages: [
      {
        role: "user",
        content: `${accuracyGuidelines} \n ${stylingPrompt} \n ${systemPrompt}\ n Please analyze this insurance policy content:\n\n${fileContent}`
      }
    ],
    stream: true,
  };

  return await makeApiRequest(payload);
}

/**
 * Compare multiple insurance policies
 * @param {Array} policyContents - Array of policy objects with name and content
 * @param {string} language - The target language for comparison
 * @returns {Promise<Response>} The streaming API response
 */
export async function comparePoliciesWithAI(policyContents, language) {
  const compareSystemPrompt = getCompareSystemPrompt(language);
  
  // Format policies for comparison
  const formattedPolicies = policyContents.map((policy, index) =>
    `### Policy ${index + 1}: ${policy.name}\n\n${policy.content}\n\n---\n\n`
  ).join('');

  const payload = {
    model: config.api.modelId,
    temperature: config.ai.compareTemperature,
    messages: [
      {
        role: "user",
        content: `${accuracyGuidelines} \n ${stylingPrompt} \n - Split the comparison with tables, we want to comparison to be explicitly shown \n -${compareSystemPrompt}\n\nPlease compare these insurance policies:\n\n${formattedPolicies}`
      }
    ],
    stream: true,
  };

  return await makeApiRequest(payload);
}