import { PublicKey } from "o1js";
import { useContext, useEffect } from "react";
import { useProtokitChainStore } from "@zknoid/sdk/lib/stores/protokitChain";
import { useNetworkStore } from "@zknoid/sdk/lib/stores/network";
import ZkNoidGameContext from "@zknoid/sdk/lib/contexts/ZkNoidGameContext";
import { battleOfNounsConifg } from "../config";
import { type ClientAppChain } from "zknoid-chain-dev";
import {
  MatchQueueState,
  matchQueueInitializer,
} from "@zknoid/sdk/lib/stores/matchQueue";
import { create } from "zustand";

export const useBattleOfNounsMatchQueueStore = create<
  MatchQueueState,
  [["zustand/immer", never]]
>(matchQueueInitializer);

export const useObserveBattleOfNounsMatchQueue = () => {
  const chain = useProtokitChainStore();
  const network = useNetworkStore();
  const matchQueue = useBattleOfNounsMatchQueueStore();
  const { client } = useContext(ZkNoidGameContext);

  const client_ = client as ClientAppChain<
    typeof battleOfNounsConifg.runtimeModules,
    any,
    any,
    any
  >;

  useEffect(() => {
    if (
      !network.walletConnected ||
      !network.address ||
      !chain.block?.height ||
      !network.protokitClientStarted
    ) {
      return;
    }

    if (!client) {
      throw Error("Context app chain client is not set");
    }

    matchQueue.loadMatchQueue(
      client_.query.runtime.BattleOfNounsLogic as any,
      chain.block?.height
    );
    matchQueue.loadActiveGame(
      client_.query.runtime.BattleOfNounsLogic as any,
      chain.block?.height,
      PublicKey.fromBase58(network.address!)
    );
  }, [
    chain.block?.height,
    network.walletConnected,
    network.address,
    network.protokitClientStarted,
  ]);
};
