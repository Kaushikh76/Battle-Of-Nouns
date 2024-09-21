import axios from 'axios';

const API_ENDPOINT = '/api/ipfs/QmekcCiGCXDo2zXnRgoAKAXqNhBtrdZE5CH9BBwcZB4Ybw';

export async function getAIDecision(gameState) {
  try {
    const prompt = `
You are an AI playing the Battle of Nouns game. Your goal is to win by accumulating 100 nouns before your opponent. Here are the key rules and information:

1. The game is played on a ${gameState.grid.length}x${gameState.grid.length} grid.
2. You control the ${gameState.botTribe} tribe.
3. You have ${gameState.botNouns} nouns.
4. YOU CAN ONLY MOVE ONE TILE AT A TIME
5. Actions you can take:
   - MOVE: Move a character to an adjacent tile.
   - CAPTURE: Capture an uncaptured or enemy house.
   - HARVEST: Convert a flower to a garden (1 noun/turn) or a tree to a sawmill (2 nouns/turn).
6. Each turn, you get 2 nouns plus 2 for each captured house, 1 for each garden, and 2 for each sawmill.
7. Characters: Defender (HP: 20, Damage: 3), Warrior (HP: 12, Damage: 6), Bomber (HP: 6, Damage: 10).
8. You can only Capture the house if you are on top of the house tile.
9. You can only harvest if you are on top of the til. 

Current game state:
${JSON.stringify(gameState, null, 2)}

Analyze the game state and choose the best action. Consider the following:
- Prioritize capturing houses and resources (trees/flowers) to increase noun production.
- Protect your captured houses and resources.
- Create new characters when you have excess nouns and available captured houses.
- Move towards uncaptured houses or enemy territory.
- Attack enemy characters when advantageous.

Provide your decision in this format:
ACTION: [MOVE]
FROM: [row,col] (only for MOVE action)
TO: [row,col]
REASON: [Brief explanation of your decision]

Example:
ACTION: MOVE
FROM: 3,4
TO: 3,5
REASON: Moving closer to an uncaptured house at 3,6 to prepare for capture on the next turn. This will increase our noun production.
`;

    const response = await axios.post(API_ENDPOINT, {
      chatQuery: prompt
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('API Response:', response.data); // Debug log

    // Ensure we're returning a string
    if (typeof response.data === 'string') {
      return response.data;
    } else if (typeof response.data === 'object' && response.data.message) {
      return response.data.message;
    } else {
      console.error('Unexpected API response format:', response.data);
      return null;
    }
  } catch (error) {
    console.error('Error calling AI API:', error);
    return null;
  }
}