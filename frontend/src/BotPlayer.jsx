import React, { useEffect } from 'react';
import { getAIDecision } from './openaiApi';

const BotPlayer = ({ gameState, onAction }) => {
  useEffect(() => {
    if (gameState.currentTurn === 'bot') {
      makeBotDecision();
    }
  }, [gameState]);

  const makeBotDecision = async () => {
    const decision = await getAIDecision(gameState);
    if (decision) {
      const action = parseDecision(decision);
      onAction(action);
    }
  };

  const parseDecision = (decision) => {
    const lines = decision.split('\n');
    const actionLine = lines.find(line => line.startsWith('ACTION:'));
    const fromLine = lines.find(line => line.startsWith('FROM:'));
    const toLine = lines.find(line => line.startsWith('TO:'));
    const reasonLine = lines.find(line => line.startsWith('REASON:'));

    if (!actionLine || !toLine) {
      console.error('Invalid AI decision format');
      return null;
    }

    const action = actionLine.split(':')[1].trim();
    const to = toLine.split(':')[1].trim().split(',').map(Number);
    const from = fromLine ? fromLine.split(':')[1].trim().split(',').map(Number) : null;
    const reason = reasonLine ? reasonLine.split(':')[1].trim() : '';

    return {
      type: action.toLowerCase(),
      from: from ? { row: from[0], col: from[1] } : null,
      to: { row: to[0], col: to[1] },
      reason
    };
  };

  return null; // This component doesn't render anything
};

export default BotPlayer;