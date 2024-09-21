import React, { useState, useEffect, useCallback, useRef } from 'react';
import BotPlayer from './BotPlayer';

const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) { 
    return <h1>Something went wrong.</h1>;
  }

  return (
    <React.Fragment>
      {React.Children.map(children, child => 
        React.cloneElement(child, {
          onError: (error, errorInfo) => {
            console.error("Caught error:", error, errorInfo);
            setHasError(true);
          }
        })
      )}
    </React.Fragment>
  );
};

const IsometricGrid = ({ username, tribe, characterIndex }) => {
  console.log('Rendering IsometricGrid', { username, tribe, characterIndex });

  const gridSize = 10;
  const fogRadius = 2;

  const [grid, setGrid] = useState([]);
  const [fogGrid, setFogGrid] = useState([]); 
  const [nouns, setNouns] = useState(2);
  const [turn, setTurn] = useState(1);
  const [canAct, setCanAct] = useState(true);
  const [tileSize, setTileSize] = useState({ width: 64, height: 32 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedTile, setSelectedTile] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState(null);
  const [currentTurn, setCurrentTurn] = useState('player');
  const [botCharacters, setBotCharacters] = useState([]);
  const [botTribe, setBotTribe] = useState(tribe === 'Marines' ? 'Ninjas' : 'Marines');
  const [botNouns, setBotNouns] = useState(2);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [actionsLeft, setActionsLeft] = useState(0);

  const gameAreaRef = useRef(null);
  const gridContainerRef = useRef(null);

  const tileImages = {
    empty: 'src/assets/Grass_tile_01.png',
    tree: 'src/assets/tree_finallll.png',
    flower: 'src/assets/Flower_tile_01.png',
    garden: 'src/assets/garden_finallll copy.png', // Add a garden image
    sawmill: 'src/assets/sawmill_finallll copy 2.png', // Add a sawmill image
    marines_house: 'src/assets/maraine_house_finalll copy.png',
    rangers_house: 'src/assets/ranger_house_finalll copy 2.png',
    marines_house_disabled: 'src/assets/disabled_house_finalll.png',
    rangers_house_disabled: 'src/assets/disabled_house_finalll.png',
    ninjas_house_disabled: 'src/assets/disabled_house_finalll.png',
    ninjas_house: 'src/assets/ninja_house_finalll copy 3.png',
    marines_captured_house: 'src/assets/maraine_house_finalll copy.png',
    ninjas_captured_house: 'src/assets/ninja_house_finalll copy 3.png',
    rangers_captured_house: 'src/assets/ranger_house_finalll copy 2.png',
    base: 'src/assets/Grass_tile_01.png',
    fog: 'src/assets/fog.png',
  };

  const characterImages = {
    Marines: [
      'src/assets/marines_defender_left_.png',
      'src/assets/marine_warrior_left.png',
      'src/assets/marine_bomber_left.png',

    ],
    Ninjas: [
      'src/assets/ninja_defender_left.png',
      'src/assets/ninja_bomber_left.png',
      'src/assets/ninja_attacker_left.png',
    ],
    Rangers: [
      'src/assets/rangers_defender_left.png',
      'src/assets/ranger_bomber_left.png',
      'src/assets/ranger_warrior_left.png',
    ],
  };

  const characterStats = {
    Defender: { hp: 20, damage: 3 },
    Warrior: { hp: 12, damage: 6 },
    Bomber: { hp: 6, damage: 10 },
  };

  const getInitialHp = useCallback((charIndex) => {
    const characterType = ['Defender', 'Warrior', 'Bomber'][charIndex];
    return characterStats[characterType].hp;
  }, []);

  const initializeGrid = useCallback(() => {
    console.log('Initializing grid');
    const newGrid = Array(gridSize).fill().map(() => Array(gridSize).fill('empty'));
    const newFogGrid = Array(gridSize).fill().map(() => Array(gridSize).fill(true));
    
    for (let i = 0; i < gridSize * gridSize / 5; i++) {
      const row = Math.floor(Math.random() * gridSize);
      const col = Math.floor(Math.random() * gridSize);
      newGrid[row][col] = ['tree', 'flower', `${tribe.toLowerCase()}_house`][Math.floor(Math.random() * 3)];
    }
    
    const usedCorners = [];
    
    const initialPosition = getRandomCornerPosition(usedCorners);
    usedCorners.push(initialPosition);
    newGrid[initialPosition.row][initialPosition.col] = `${tribe.toLowerCase()}_captured_house`;
    
    updateVisibility(newFogGrid, initialPosition);
    
    const botInitialPosition = getRandomCornerPosition(usedCorners);
    usedCorners.push(botInitialPosition);
    newGrid[botInitialPosition.row][botInitialPosition.col] = `${botTribe.toLowerCase()}_captured_house`;

    setGrid(newGrid);
    setFogGrid(newFogGrid);

    const initialCharacter = {
      id: 0,
      position: initialPosition,
      tribe,
      characterIndex,
      hp: getInitialHp(characterIndex),
      hasActed: false
    };
    setCharacters([initialCharacter]);
    setSelectedCharacterId(0);

    const botInitialCharacter = {
      id: 0,
      position: botInitialPosition,
      tribe: botTribe,
      characterIndex: Math.floor(Math.random() * 3),
      hp: getInitialHp(Math.floor(Math.random() * 3)),
      hasActed: false
    };
    setBotCharacters([botInitialCharacter]);

    console.log('Grid initialized:', newGrid);
    console.log('Initial character:', initialCharacter);
    console.log('Bot initial character:', botInitialCharacter);
  }, [gridSize, tribe, characterIndex, getInitialHp, botTribe]);

  const getRandomCornerPosition = (usedCorners) => {
    const corners = [
      { row: 0, col: 0 },
      { row: 0, col: gridSize - 1 },
      { row: gridSize - 1, col: 0 },
      { row: gridSize - 1, col: gridSize - 1 },
    ];
    const availableCorners = corners.filter(corner => 
      !usedCorners.some(usedCorner => 
        usedCorner.row === corner.row && usedCorner.col === corner.col
      )
    );
    return availableCorners[Math.floor(Math.random() * availableCorners.length)];
  };

  const isValidMove = useCallback((rowIndex, colIndex, characterPosition) => {
    const distance = Math.abs(characterPosition.row - rowIndex) + Math.abs(characterPosition.col - colIndex);
    return distance === 1 && canAct;
  }, [canAct]);

  const updateVisibility = (fogGrid, position) => {
    for (let rowOffset = -fogRadius; rowOffset <= fogRadius; rowOffset++) {
      for (let colOffset = -fogRadius; colOffset <= fogRadius; colOffset++) {
        const newRow = position.row + rowOffset;
        const newCol = position.col + colOffset;
        if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize) {
          fogGrid[newRow][newCol] = false;
        }
      }
    }
  };

  const handleResize = useCallback(() => {
    if (gameAreaRef.current) {
      const gameArea = gameAreaRef.current;
      const maxWidth = gameArea.offsetWidth;
      const maxHeight = gameArea.offsetHeight;

      const tileWidth = Math.floor(maxWidth / (gridSize + 1));
      const tileHeight = Math.floor(tileWidth / 2);

      setTileSize({ width: tileWidth, height: tileHeight });
    }
  }, [gridSize]);

  const checkGameEnd = useCallback(() => {
    if (nouns >= 100) {
      setGameOver(true);
      setWinner(tribe);
    } else if (botNouns >= 100) {
      setGameOver(true);
      setWinner(botTribe);
    }
  }, [nouns, botNouns, tribe, botTribe]);

  const endTurn = useCallback(() => {
    setNouns(prevNouns => {
      let newNouns = prevNouns + 2;
      grid.forEach(row => row.forEach(tile => {
        if (tile === `${tribe.toLowerCase()}_captured_house`) newNouns += 2;
        if (tile === 'garden') newNouns += 1;
        if (tile === 'sawmill') newNouns += 2;
      }));
      return newNouns;
    });
  
    setBotNouns(prevNouns => {
      let newNouns = prevNouns + 2;
      grid.forEach(row => row.forEach(tile => {
        if (tile === `${botTribe.toLowerCase()}_captured_house`) newNouns += 2;
      }));
      return newNouns;
    });
  
    setTurn(prev => prev + 1);
    setCanAct(false);
    setCurrentTurn('bot');
    setCharacters(prevCharacters => prevCharacters.map(char => ({ ...char, hasActed: false })));
    checkGameEnd();
  }, [grid, checkGameEnd, tribe, botTribe]);

  const moveCharacter = useCallback((rowIndex, colIndex) => {
    setCharacters(prevCharacters => 
      prevCharacters.map(char => 
        char.id === selectedCharacterId 
          ? { ...char, position: { row: rowIndex, col: colIndex }, hasActed: true } 
          : char
      )
    );
    
    setFogGrid(prevFogGrid => {
      const newFogGrid = [...prevFogGrid];
      updateVisibility(newFogGrid, { row: rowIndex, col: colIndex });
      return newFogGrid;
    });
    
    setActionsLeft(prevActions => prevActions - 1);
  }, [selectedCharacterId]);

  const attack = useCallback((attacker, target) => {
    const attackerType = ['Defender', 'Warrior', 'Bomber'][attacker.characterIndex];
    const damage = characterStats[attackerType].damage;
  
    if (target.tribe === tribe) {
      setCharacters(prevCharacters =>
        prevCharacters.map(char =>
          char.id === target.id
            ? { ...char, hp: Math.max(0, char.hp - damage) }
            : char
        ).filter(char => char.hp > 0)
      );
    } else {
      setBotCharacters(prevBotCharacters =>
        prevBotCharacters.map(char =>
          char.position.row === target.position.row && char.position.col === target.position.col
            ? { ...char, hp: Math.max(0, char.hp - damage) }
            : char
        ).filter(char => char.hp > 0)
      );
    }
  
    setCharacters(prevCharacters =>
      prevCharacters.map(char =>
        char.id === attacker.id
          ? { ...char, hasActed: true }
          : char
      )
    );
  
    setActionsLeft(prevActions => prevActions - 1);
    checkGameEnd();
  }, [characterStats, tribe, checkGameEnd]);

  const isEnemy = useCallback((rowIndex, colIndex) => {
    const targetCharacter = characters.find(char => char.position.row === rowIndex && char.position.col === colIndex);
    const targetBotCharacter = botCharacters.find(char => char.position.row === rowIndex && char.position.col === colIndex);
    return (targetCharacter && targetCharacter.tribe !== tribe) || targetBotCharacter;
  }, [characters, botCharacters, tribe]);

  const performAction = useCallback((rowIndex, colIndex) => {
    if (!canAct) return;

    const activeCharacter = characters.find(char => char.id === selectedCharacterId);
    if (!activeCharacter || activeCharacter.position.row !== rowIndex || activeCharacter.position.col !== colIndex) return;

    const tileType = grid[rowIndex][colIndex];
    setGrid(prevGrid => {
      const newGrid = [...prevGrid];
      if (tileType === `${tribe.toLowerCase()}_house` || 
          tileType === `${botTribe.toLowerCase()}_house` || 
          tileType === `${botTribe.toLowerCase()}_captured_house`) {
        newGrid[rowIndex][colIndex] = `${tribe.toLowerCase()}_captured_house`;
      }
      return newGrid;
    });

    setCharacters(prevCharacters =>
      prevCharacters.map(char =>
        char.id === activeCharacter.id
          ? { ...char, hasActed: true }
          : char
      )
    );

    setActionsLeft(prevActions => prevActions - 1);
  }, [canAct, characters, grid, selectedCharacterId, tribe, botTribe]);

  const spawnCharacter = useCallback((rowIndex, colIndex) => {
    if (nouns < 3) return;

    const tileType = grid[rowIndex][colIndex];
    if (tileType !== `${tribe.toLowerCase()}_captured_house`) return;

    const newCharacterIndex = Math.floor(Math.random() * 3);
    const newCharacter = {
      id: characters.length,
      position: { row: rowIndex, col: colIndex },
      tribe,
      characterIndex: newCharacterIndex,
      hp: getInitialHp(newCharacterIndex),
      hasActed: true
    };

    setCharacters(prev => [...prev, newCharacter]);
    setNouns(prev => prev - 3);
    setActionsLeft(prevActions => prevActions - 1);

    console.log('New character spawned:', newCharacter);
  }, [nouns, characters, tribe, getInitialHp, grid]);

  const handleBotAction = useCallback((action) => {
    if (!action) return;

    switch (action.type) {
      case 'move':
        moveBotCharacter(action.from, action.to);
        break;
      case 'capture':
        captureBotHouse(action.to.row, action.to.col);
        break;
      case 'spawn':
        spawnBotCharacter(action.to.row, action.to.col);
        break;
    }

    console.log('Bot action:', action.reason);
    setCurrentTurn('player');
    resetPlayerActions();
  }, []);

  const moveBotCharacter = useCallback((from, to) => {
    setBotCharacters(prev => prev.map(char => 
      char.position.row === from.row && char.position.col === from.col
        ? { ...char, position: to, hasActed: true }
        : char
    ));

    setFogGrid(prevFogGrid => {
      const newFogGrid = [...prevFogGrid];
      updateVisibility(newFogGrid, to);
      return newFogGrid;
    });
  }, []);

  const captureBotHouse = useCallback((row, col) => {
    setGrid(prevGrid => {
      const newGrid = [...prevGrid];
      if (newGrid[row][col] === `${tribe.toLowerCase()}_house` || 
          newGrid[row][col] === `${tribe.toLowerCase()}_captured_house` ||
          newGrid[row][col] === `${botTribe.toLowerCase()}_house`) {
        newGrid[row][col] = `${botTribe.toLowerCase()}_captured_house`;
      }
      return newGrid;
    });
  }, [tribe, botTribe]);

  const spawnBotCharacter = useCallback((row, col) => {
    if (botNouns < 3) return;

    const tileType = grid[row][col];
    if (tileType !== `${botTribe.toLowerCase()}_captured_house`) return;

    const newCharacterIndex = Math.floor(Math.random() * 3);
    const newCharacter = {
      id: botCharacters.length,
      position: { row, col },
      tribe: botTribe,
      characterIndex: newCharacterIndex,
      hp: getInitialHp(newCharacterIndex),
      hasActed: true
    };

    setBotCharacters(prev => [...prev, newCharacter]);
    setBotNouns(prev => prev - 3);
  }, [botNouns, botCharacters, botTribe, getInitialHp, grid]);

  const resetPlayerActions = useCallback(() => {
    setActionsLeft(characters.length);
    setCharacters(prevCharacters => prevCharacters.map(char => ({ ...char, hasActed: false })));
    setCanAct(true);
  }, [characters]);

  const handleTileClick = useCallback((rowIndex, colIndex) => {
    console.log('Tile clicked:', rowIndex, colIndex);

    if (fogGrid[rowIndex][colIndex]) {
      return;
    }

    const tile = grid[rowIndex][colIndex];
    setSelectedTile({ type: tile, row: rowIndex, col: colIndex });

    const clickedCharacter = characters.find(char => char.position.row === rowIndex && char.position.col === colIndex);
    if (clickedCharacter) {
      setSelectedCharacterId(clickedCharacter.id);
    } else {
      setSelectedCharacterId(null);
    }

    const activeCharacter = characters.find(char => char.id === selectedCharacterId);
    if (activeCharacter && !activeCharacter.hasActed && isValidMove(rowIndex, colIndex, activeCharacter.position)) {
      if (isEnemy(rowIndex, colIndex)) {
        const targetCharacter = characters.find(char => char.position.row === rowIndex && char.position.col === colIndex);
        const targetBotCharacter = botCharacters.find(char => char.position.row === rowIndex && char.position.col === colIndex);
        attack(activeCharacter, targetCharacter || targetBotCharacter);
      } else {
        moveCharacter(rowIndex, colIndex);
      }
    } else if (activeCharacter && rowIndex === activeCharacter.position.row && colIndex === activeCharacter.position.col && canAct && !activeCharacter.hasActed) {
      performAction(rowIndex, colIndex);
    }
  }, [fogGrid, grid, characters, botCharacters, selectedCharacterId, canAct, moveCharacter, performAction, isValidMove, isEnemy, attack]);

  const renderGrid = useCallback(() => {
    console.log('Rendering grid');
    if (!grid || !tileSize || !zoom) {
      console.error('Grid, tileSize, or zoom is undefined', { grid, tileSize, zoom });
      return null;
    }
  
    const gridWidthPx = gridSize * tileSize.width * zoom;
    const gridHeightPx = (gridSize * tileSize.height * zoom) / 2 + tileSize.height * zoom;
  
    return (
      <div 
        ref={gridContainerRef}
        className="relative cursor-move w-full h-full"
        style={{
          transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
          transformOrigin: 'center',
        }}
        onMouseDown={(e) => {
          setIsDragging(true);
          setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }}
        onMouseMove={(e) => {
          if (isDragging) {
            setPan({
              x: e.clientX - dragStart.x,
              y: e.clientY - dragStart.y
            });
          }
        }}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
      >
        {grid.map((row, rowIndex) => (
          row.map((tile, colIndex) => {
            const character = characters.find(char => char.position && char.position.row === rowIndex && char.position.col === colIndex);
            const botCharacter = botCharacters.find(char => char.position && char.position.row === rowIndex && char.position.col === colIndex);
            const isVisible = fogGrid && !fogGrid[rowIndex][colIndex];
            const selectedCharacter = characters.find(char => char.id === selectedCharacterId);
            const isAvailableMove = selectedCharacterId !== null && selectedCharacter && isValidMove(rowIndex, colIndex, selectedCharacter.position);
            const isEnemyTile = isEnemy(rowIndex, colIndex);

            // Determine the correct tile image
            let tileImage = tileImages[tile] || tileImages.empty;
            if (tile.includes('_house') && !tile.includes('captured')) {
              tileImage = tileImages[`${tile.split('_')[0]}_house_disabled`]; // Use the disabled house image
            }

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                style={{
                  position: 'absolute',
                  width: tileSize.width,
                  height: tileSize.height,
                  left: `${(colIndex - rowIndex) * tileSize.width / 2 + gridWidthPx / 2 - tileSize.width / 2}px`,
                  top: `${(colIndex + rowIndex) * tileSize.height / 2}px`,
                  zIndex: rowIndex + colIndex,
                }}
                className={`cursor-pointer ${isAvailableMove ? (isEnemyTile ? 'hover:brightness-125 border-2 border-red-500' : 'hover:brightness-125') : ''}`}
                onClick={() => handleTileClick(rowIndex, colIndex)}
              >
                <div className="w-full h-full relative">
                  <img
                    src={tileImage}
                    alt={tile}
                    className={`absolute object-contain object-center transition-all duration-300 ${isAvailableMove ? 'brightness-110' : ''}`}
                    onError={(e) => { e.target.onerror = null; e.target.src = tileImages.empty; }}
                  />
                  {(character || botCharacter) && (
                    <div className="absolute w-full h-full">
                      <img 
                        src={characterImages[(character || botCharacter).tribe][(character || botCharacter).characterIndex] || tileImages.empty}
                        alt={`${(character || botCharacter).tribe} character`}
                        className="w-full h-full object-contain object-center"
                        onError={(e) => { e.target.onerror = null; e.target.src = tileImages.empty; }}
                      />
                    </div>
                  )}
                  {!isVisible && (
                    <img
                      src={tileImages.fog || tileImages.empty}
                      alt="fog"
                      className="absolute object-contain object-center"
                      style={{ zIndex: 999 }}
                      onError={(e) => { e.target.onerror = null; e.target.src = tileImages.empty; }}
                    />
                  )}
                </div>
              </div>
            );
          })
        ))}
      </div>
    );
  }, [grid, fogGrid, characters, botCharacters, tileSize, zoom, pan, isDragging, dragStart, selectedCharacterId, handleTileClick, isValidMove, isEnemy, characterImages, tileImages]);


  const renderTileInfo = useCallback(() => {
    if (!selectedTile) return null;

    const { type, row, col } = selectedTile;
    const character = characters.find(char => char.position.row === row && char.position.col === col);

    if (character) {
      return renderCharacterInfo(character);
    }

    switch (type) {
      case `${tribe.toLowerCase()}_house`:
      case `${botTribe.toLowerCase()}_house`:
      case `${tribe.toLowerCase()}_captured_house`:
      case `${botTribe.toLowerCase()}_captured_house`:
        return (
          <div className="space-y-2">
            <p className="font-bold">{type.includes('captured') ? 'Captured House' : 'Uncaptured House'}</p>
            <p>Owner: {type.includes('captured') ? (type.includes(tribe.toLowerCase()) ? username : 'Bot') : 'None'}</p>
            <p>Capture this house to gain 2 nouns each turn.</p>
            {canAct && nouns >= 3 && type === `${tribe.toLowerCase()}_captured_house` && (
              <button
                onClick={() => spawnCharacter(row, col)}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded w-full"
              >
                Summon Character (3 nouns)
              </button>
            )}
          </div>
        );
      case 'tree':
      case 'flower':
      case 'garden':
      case 'sawmill':
        return (
          <div className="space-y-2">
            <p className="font-bold">{type.charAt(0).toUpperCase() + type.slice(1)}</p>
            <p>{type === 'tree' ? 'A tree.' : type === 'flower' ? 'A flower.' : type === 'garden' ? 'A garden producing 1 noun per turn.' : 'A sawmill producing 2 nouns per turn.'}</p>
          </div>
        );
      default:
        return null;
    }
  }, [selectedTile, characters, username, canAct, nouns, spawnCharacter, tribe, botTribe]);

  const renderCharacterInfo = useCallback((character) => {
    const characterType = ['Defender', 'Warrior', 'Bomber'][character.characterIndex];
    const stats = characterStats[characterType];
    const tileType = grid[character.position.row][character.position.col];
    const canCapture = tileType.includes('house') && tileType !== `${tribe.toLowerCase()}_captured_house`;
    const canHarvest = tileType === 'flower' || tileType === 'tree';
  
    return (
      <div className="space-y-2">
        <p className="font-bold text-lg">{username}'s {characterType}</p>
        <p>Tribe: {tribe}</p>
        <p>Health: {character.hp}/{stats.hp}</p>
        <p>Damage: {stats.damage}</p>
        <p>Nouns: {nouns}</p>
        <p>Has Acted: {character.hasActed ? 'Yes' : 'No'}</p>
        {canCapture && (
          <button 
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mb-2"
            onClick={() => performAction(character.position.row, character.position.col)}
            disabled={!canAct || character.hasActed}
          >
            Capture House
          </button>
        )}
        {canHarvest && (
          <button 
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded mb-2"
            onClick={() => harvestResource(character.position.row, character.position.col)}
            disabled={!canAct || character.hasActed}
          >
            Harvest {tileType === 'flower' ? 'Flower' : 'Tree'}
          </button>
        )}
        <button 
          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
          onClick={endTurn}
          disabled={actionsLeft > 0}
        >
          End Turn ({actionsLeft})
        </button>
      </div>
    );
  }, [username, tribe, nouns, characterStats, endTurn, actionsLeft, canAct, grid, performAction]);

  const harvestResource = useCallback((row, col) => {
    setGrid(prevGrid => {
      const newGrid = [...prevGrid];
      if (newGrid[row][col] === 'flower') {
        newGrid[row][col] = 'garden';
      } else if (newGrid[row][col] === 'tree') {
        newGrid[row][col] = 'sawmill';
      }
      return newGrid;
    });

    setNouns(prevNouns => prevNouns + 2);
    setCharacters(prevCharacters =>
      prevCharacters.map(char =>
        char.position.row === row && char.position.col === col
          ? { ...char, hasActed: true }
          : char
      )
    );
    setActionsLeft(prevActions => prevActions - 1);
  }, []);

  const handleZoom = useCallback((newZoom) => {
    setZoom(Math.max(0.5, Math.min(2, newZoom)));
  }, []);

  useEffect(() => {
    console.log('Initial useEffect running');
    initializeGrid();
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [initializeGrid, handleResize]);

  return (
    <ErrorBoundary>
      <div className="w-full h-full bg-beige rounded-lg overflow-hidden shadow-lg">
        {gameOver ? (
          <div className="p-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Game Over</h2>
            <p className="text-xl">{winner} wins!</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <div className="bg-blue-200 rounded-lg shadow-md overflow-hidden">
              <div className="bg-gray-100 p-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Battle Of Nouns</h2>
                <h2 className="text-2xl font-bold text-gray-800">Nouns: {nouns}</h2>
                <div className="flex items-center space-x-4">
                  <button onClick={() => handleZoom(zoom - 0.1)} className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-lg">-</button>
                  <span className="text-lg font-semibold">{Math.round(zoom * 100)}%</span>
                  <button onClick={() => handleZoom(zoom + 0.1)} className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-lg">+</button>
                </div>
              </div>
              <div ref={gameAreaRef} className="h-[60vh] overflow-auto relative">
                {renderGrid()}
              </div>
            </div>
            
            <div className="bg-green-100 h-[200px] rounded-lg p-4 shadow-md overflow-hidden">
              <h2 className="text-2xl font-bold text-center text-green-800 mb-2">
                {selectedTile ? 
                  (selectedTile.type === 'empty' ? `${tribe} Character` : 
                    `${selectedTile.type.charAt(0).toUpperCase() + selectedTile.type.slice(1)}`) : 
                  `${tribe} Character`}
              </h2>
              <div className="flex h-[calc(100%-2rem)] overflow-hidden">
                <div className="w-1/2 h-full flex items-center justify-center overflow-hidden">
                  <img
                    src={selectedTile ? tileImages[selectedTile.type] : characterImages[tribe][characterIndex]}
                    alt={selectedTile ? selectedTile.type : `${tribe} Character`}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => { e.target.onerror = null; e.target.src = tileImages.empty; }}
                  />
                </div>
                <div className="w-1/2 pl-4 overflow-y-auto">
                  <div className="h-full">
                    {renderTileInfo()}
                  </div>
                </div>
              </div>
            </div>
            
            <button 
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300"
              onClick={endTurn}
              disabled={!canAct}
            >
              End Turn
            </button>
          </div>
        )}
        <BotPlayer
          gameState={{
            grid,
            characters,
            botCharacters,
            currentTurn,
            botNouns,
            botTribe,
          }}
          onAction={handleBotAction}
        />
        <div className="mt-4 text-center text-xl font-bold">
          {currentTurn === 'player' ? "Your Turn" : "Bot's Turn"}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default IsometricGrid;