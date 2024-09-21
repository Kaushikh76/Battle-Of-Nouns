import { battleOfNounsConifg } from "../config";
import BattleOfNounsCoverSVG from "../assets/game-cover.svg";
import BattleOfNounsCoverMobileSVG from "../assets/game-cover-mobile.svg";
import { useContext } from "react";
import ZkNoidGameContext from "@zknoid/sdk/lib/contexts/ZkNoidGameContext";
import { ClientAppChain } from "zknoid-chain-dev";
import { useNetworkStore } from "@zknoid/sdk/lib/stores/network";
import LobbyPage from "@zknoid/sdk/components/framework/Lobby/LobbyPage";
import GamePage from "@zknoid/sdk/components/framework/GamePage";

export default function BattleOfNounsLobby({
  params,
}: {
  params: { lobbyId: string };
}) {
  const networkStore = useNetworkStore();

  const { client } = useContext(ZkNoidGameContext);

  if (!client) {
    throw Error("Context app chain client is not set");
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
      gameTitleImage={BattleOfNounsCoverSVG}
    >
      <LobbyPage
        lobbyId={params.lobbyId}
        query={
          networkStore.protokitClientStarted
            ? (client_.query.runtime.BattleOfNounsLogic as any)
            : undefined
        }
        contractName={"BattleOfNounsLogic"}
        config={battleOfNounsConifg}
      />
    </GamePage>
  );
}
