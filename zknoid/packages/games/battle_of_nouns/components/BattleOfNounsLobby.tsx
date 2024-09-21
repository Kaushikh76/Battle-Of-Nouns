import GamePage from '@/components/framework/GamePage';
import { battleOfNounsConifg } from '@/games/battle_of_nouns/config';
import BattleOfNounsCoverSVG from '@/games/battle_of_nouns/assets/game-cover.svg';
import BattleOfNounsCoverMobileSVG from '@/games/battle_of_nouns/assets/game-cover-mobile.svg';
import { useContext, useState } from 'react';
import ZkNoidGameContext from '@/lib/contexts/ZkNoidGameContext';
import { ClientAppChain, ProtoUInt64 } from 'zknoid-chain-dev';
import { useNetworkStore } from '@/lib/stores/network';
import LobbyPage from '@/components/framework/Lobby/LobbyPage';

export default function BattleOfNounsLobby({
  params,
}: {
  params: { lobbyId: string };
}) {
  const networkStore = useNetworkStore();

  const { client } = useContext(ZkNoidGameContext);

  if (!client) {
    throw Error('Context app chain client is not set');
  }

  const client_ = client as ClientAppChain<
    typeof battleOfNounsConifg.runtimeModules,
    any,
    any,
    any
  >;

  return (
    <GamePage
      gameConfig={battleOfNounsConifg}
      image={BattleOfNounsCoverSVG}
      mobileImage={BattleOfNounsCoverMobileSVG}
      defaultPage={'Lobby list'}
    >
      <LobbyPage
        lobbyId={params.lobbyId}
        query={
          networkStore.protokitClientStarted
            ? client_.query.runtime.BattleOfNounsLogic
            : undefined
        }
        contractName={'BattleOfNounsLogic'}
        config={battleOfNounsConifg}
      />
    </GamePage>
  );
}
