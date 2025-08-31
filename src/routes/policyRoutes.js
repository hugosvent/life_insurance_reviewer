import express from 'express';
import { upload } from '../middleware/middleware.js';
import { analyzePolicyWithAI, comparePoliciesWithAI } from '../services/aiService.js';
import { config } from '../config/config.js';

const router = express.Router();

/**
 * Set up streaming response headers
 * @param {Response} res - Express response object
 */
function setupStreamingHeaders(res) {
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
}

/**
 * Stream API response to client
 * @param {Stream} stream - OpenAI stream
 * @param {Response} res - Express response object
 */
async function streamResponse(stream, res) {
  try {
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(content);
      }
    }
  } catch (error) {
    console.error('Error streaming response:', error);
    res.write('\n\nError occurred while streaming response.');
  }

  res.end();
}

/**
 * POST /api/analyze-policy
 * Analyze a single insurance policy
 */
router.post('/analyze-policy', upload.single('file'), async (req, res) => {
  try {
    const { language = 'en', text } = req.body;

    // Get file content from either uploaded file or text parameter
    let fileContent;
    if (req.file) {
      fileContent = req.file.buffer.toString('utf-8');
    } else if (text) {
      fileContent = text;
    } else {
      return res.status(400).json({ error: 'No file or text content provided' });
    }

    // Normalize whitespace
    fileContent = fileContent
      .replace(/\s+/g, ' ')
      .trim();

    // Get AI analysis
    const apiResponse = await analyzePolicyWithAI(fileContent, language);
    
    // Set up streaming response
    setupStreamingHeaders(res);
    
    // Stream the response back to client
    await streamResponse(apiResponse, res);

  } catch (error) {
    console.error('Error processing policy analysis request:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/compare-policy
 * Compare multiple insurance policies
 */
router.post('/compare-policy', upload.array('files', config.upload.maxPoliciesComparison), async (req, res) => {
  try {
    const { language = 'en', policies } = req.body;

    // Get policy contents from either uploaded files or policies parameter
    let policyContents = [];

    if (req.files && req.files.length > 0) {
      // Handle uploaded files
      policyContents = req.files.map((file, index) => ({
        name: file.originalname || `Policy ${index + 1}`,
        content: file.buffer.toString('utf-8').replace(/\s+/g, ' ').trim()
      }));
    } else if (policies && Array.isArray(policies)) {
      // Handle policies from request body
      policyContents = policies;
    } else {
      return res.status(400).json({ error: 'No policy files or content provided' });
    }

    // Validate policy count
    if (policyContents.length < 2) {
      return res.status(400).json({ error: 'At least 2 policies are required for comparison' });
    }

    if (policyContents.length > config.upload.maxPoliciesComparison) {
      return res.status(400).json({ 
        error: `Maximum ${config.upload.maxPoliciesComparison} policies can be compared at once` 
      });
    }

    // Get AI comparison
    const apiResponse = await comparePoliciesWithAI(policyContents, language);
    
    // Set up streaming response
    setupStreamingHeaders(res);
    
    // Stream the response back to client
    await streamResponse(apiResponse, res);

  } catch (error) {
    console.error('Error processing policy comparison request:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;