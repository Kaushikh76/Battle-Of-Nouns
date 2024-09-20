import React, { useState } from 'react';
import IsometricGrid from './IsometricGrid';

const tribes = ['Marines', 'Ninjas', 'Rangers'];
const characters = ['Defender', 'Warrior', 'Sponge'];

const characterImages = {
  Marines: [
    'src/assets/marines-defender.png',
    'src/assets/marines-warrior.png',
    'src/assets/marines-sponge.png',
  ],
  Ninjas: [
    'src/assets/ninjas-defender.png',
    'src/assets/ninjas-warrior.png',
    'src/assets/ninjas-sponge.png',
  ],
  Rangers: [
    'src/assets/rangers-defender.png',
    'src/assets/rangers-warrior.png',
    'src/assets/rangers-sponge.png',
  ],
};

export default function LandingPage() {
  const [showPlayOptions, setShowPlayOptions] = useState(false);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [isJoiningGame, setIsJoiningGame] = useState(false);
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [showTribePicker, setShowTribePicker] = useState(false);
  const [selectedTribe, setSelectedTribe] = useState(0);
  const [error, setError] = useState('');
  const [gameStarted, setGameStarted] = useState(false);

  const handleCreateSubmit = () => {
    if (username.trim()) {
      setShowTribePicker(true);
      setIsCreatingGame(false);
      setError('');
    } else {
      setError('Please enter a username.');
    }
  };

  const handleJoinSubmit = () => {
    if (username.trim() && roomCode.trim()) {
      console.log(`Joining game as ${username} with room code ${roomCode}`);
      setIsJoiningGame(false);
      setUsername('');
      setRoomCode('');
      setError('');
    } else {
      setError('Please enter both username and room code.');
    }
  };

  const handleConfirmSelection = () => {
    console.log(`Starting game with ${tribes[selectedTribe]} tribe`);
    setGameStarted(true);
    setError('');
  };

  

  return (
    <div className="min-h-screen bg-custom-bg flex items-center justify-center p-4">
      {!gameStarted ? (
        <div className="w-full max-w-4xl bg-flex-bg bg-center rounded-lg shadow-xl overflow-hidden min-h-[600px] min-w-[700px]">
          <div className="p-20 space-y-7">
            <div className="bg-opacity-70 text-xl text-brown-300 p-2 flex justify-center space-x-4 rounded-full">
              <button className="hover:underline">Home</button>
              <button className="hover:underline">Leader Board</button>
              <button className="hover:underline">Rules</button>
            </div>
            
            {showTribePicker ? (
              renderTribePicker()
            ) : (
              <div className="flex">
                <div className="w-1/2 space-y-7 pl-20 flex flex-col justify-center">
                  <div className="rounded-lg overflow-hidden">
                    <img src='src/assets/Flower_tile_01.png' alt="Flower tile" />
                  </div>
                </div>
                <div className="w-1/2 space-y-7 pl-4 flex flex-col justify-between">
                  <h1 className="text-6xl text-green-900 mb-4">Battle of Nouns</h1>
  
                  {!isCreatingGame && !isJoiningGame && (
                    <>
                      {!showPlayOptions ? (
                        <div className="space-y-5">
                          <button
                            className="w-[270px] h-[40px] text-amber-100 text-xl bg-button-bg shadow-md"
                            onClick={() => setShowPlayOptions(true)}
                          >
                            Connect Wallet
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-5">
                          <button
                            className="w-[270px] h-[40px] text-amber-100 text-xl bg-button-bg shadow-md"
                            onClick={() => setIsCreatingGame(true)}
                          >
                            Create Game
                          </button>
                          <button
                            className="w-[270px] h-[40px] text-amber-100 text-xl bg-button-bg shadow-md"
                            onClick={() => setIsJoiningGame(true)}
                          >
                            Join Game
                          </button>
                          <button
                            className="w-[270px] h-[40px] text-amber-100 text-xl bg-button-bg shadow-md"
                            onClick={() => setShowPlayOptions(false)}
                          >
                            Quit
                          </button>
                        </div>
                      )}
                    </>
                  )}
  
                  {isCreatingGame && (
                    <div>
                      <input
                        type="text"
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="bg-form-bg text-white bg-cover p-2 w-[270px] h-[40px] mb-4"
                      />
                      <button
                        className="w-60 bg-button-bg bg-cover text-white rounded-md py-2 px-4"
                        onClick={handleCreateSubmit}
                      >
                        Create Game
                      </button>
                      <br />
                      <button
                        className="w-20 bg-button-bg bg-cover text-white mt-2"
                        onClick={() => {
                          setIsCreatingGame(false);
                          setError('');
                        }}
                      >
                        Cancel
                      </button>
                      {error && <p className="text-red-500 mt-2">{error}</p>}
                    </div>
                  )}
  
                  {isJoiningGame && (
                    <div>
                      <input
                        type="text"
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="border border-gray-300 p-2 rounded-lg w-full mb-4"
                      />
                      <input
                        type="text"
                        placeholder="Enter room code"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value)}
                        className="border border-gray-300 p-2 rounded-lg w-full mb-4"
                      />
                      <button
                        className="w-72 bg-cover bg-button-bg text-white rounded-md py-2 px-4"
                        onClick={handleJoinSubmit}
                      >
                        Join Game
                      </button>
                      <button
                        className="w-20 bg-button-bg bg-cover text-white mt-2"
                        onClick={() => {
                          setIsJoiningGame(false);
                          setError('');
                        }}
                      >
                        Cancel
                      </button>
                      {error && <p className="text-red-500 mt-2">{error}</p>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full h-[900px] bg-center rounded-lg shadow-xl overflow-hidden">
          <div className="flex-grow overflow-hidden">
            <IsometricGrid 
              username={username}
              tribe={tribes[selectedTribe]}
              characterIndex={Math.floor(Math.random() * 3)} // Randomly select a character
            />
          </div>
        </div>  
      )}
    </div>
  );
} 