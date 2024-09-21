import axios from 'axios';

const API_ENDPOINT = 'https://wapo-testnet.phala.network/ipfs/QmXLZMrYaQopHKwdhF6nMSiAFydkg3V6caPxhpC9fh3hcD';

export async function getAIDecision(gameState) {
  try {
    const prompt = `
You are an AI playing the Battle of Nouns game. The game state is as follows:
${JSON.stringify(gameState, null, 2)}

Based on this game state, decide on the best action to take. Your response should be in the following format:
ACTION: [MOVE/HARVEST/CAPTURE/SPAWN]
FROM: [row,col] (only for MOVE action)
TO: [row,col] (for MOVE action) or [row,col] (for other actions)
REASON: [Brief explanation of your decision]

Example:
ACTION: MOVE
FROM: 3,4
TO: 3,5
REASON: Moving closer to uncaptured house to prepare for capture on next turn.
    `;

    const response = await axios.post(API_ENDPOINT, {
      chatQuery: prompt
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error calling AI API:', error);
    return null;
  }
}