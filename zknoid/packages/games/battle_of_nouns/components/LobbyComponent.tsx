// import Button from "@/components/shared/Button";
// import ZkNoidGameContext from "@/lib/contexts/ZkNoidGameContext";
// import { ZkNoidGameConfig } from "@/lib/createConfig";
// import { useAlreadyInLobbyModalStore } from "@/lib/stores/alreadyInLobbyModalStore";
// import { useLobbiesStore, useObserveLobbiesStore } from "@/lib/stores/lobbiesStore";
// import { useNetworkStore } from "@/lib/stores/network";
// import { usePvpLobbyStorage } from "@/lib/stores/pvpLobbyStore";
// import { useSessionKeyStore } from "@/lib/stores/sessionKeyStorage";
// import { ILobby } from "@/lib/types";
// import { api } from "@/trpc/react";
// import { RuntimeModulesRecord } from "@proto-kit/module";
// import { ModuleQuery } from "@proto-kit/sequencer";
// import { Bool, CircuitString, Field, PublicKey, UInt64 } from "o1js";
// import { useContext, useEffect, useRef, useState } from "react";
// import { MatchMaker, ProtoUInt64 } from "zknoid-chain-dev";
// import { useStore } from "zustand";

// export default function LobbyComponent<RuntimeModules extends RuntimeModulesRecord>({
//     lobbyId,
//     query,
//     contractName,
//     config,
//     rewardCoeff,
//   }: {
//     lobbyId: string;
//     query: ModuleQuery<MatchMaker> | undefined;
//     contractName: string;
//     config: ZkNoidGameConfig<RuntimeModules>;
//     rewardCoeff?: number;
//   }){

//     const params = {
//         lobbyId,
//         query,
//         contractName,
//         config,
//       };
//     const [createOrJoinLobby, setCreateOrJoinLobby] = useState<any>(null);
//     const [roomCode, setRoomCode] = useState<string>("");
//       const lobbiesStore=useLobbiesStore()
//       const pvpLobbyStorage=usePvpLobbyStorage()
//       const alreadyInLobbyModalStore=useAlreadyInLobbyModalStore()
//   const networkStore = useNetworkStore();
//   const [currentLobby, setCurrentLobby] = useState<ILobby | undefined>(
//     undefined
//   );
//   const [isCreationMode, setIsCreationMode] = useState<boolean>(false);
//   const [isLobbyNotFoundModalOpen, setIsLobbyNotFoundModalOpen] =
//     useState<boolean>(false);
//   const progress = api.progress.setSolvedQuests.useMutation();

//   const { client } = useContext(ZkNoidGameContext);

//   const sessionPrivateKey = useStore(useSessionKeyStore, (state) =>
//     state.getSessionKey()
//   );
//   if (!client) {
//     throw Error('Context app chain client is not set');
//   }

//   useObserveLobbiesStore(params.query, rewardCoeff);

//   const searchedLobby = useRef(false);
//   const waitNewLobby = useRef(false);
//   useEffect(() => {
//     const lobby = lobbiesStore.lobbies.find(
//       (lobby) => lobby.id === pvpLobbyStorage.lastLobbyId
//     );
//     setCurrentLobby(lobby);
//   }, [lobbiesStore.lobbies, params.lobbyId, pvpLobbyStorage.lastLobbyId]);
//   useEffect(() => {
//     if (
//       (waitNewLobby.current || !pvpLobbyStorage.lastLobbyId) &&
//       lobbiesStore.currentLobby?.id
//     ) {
//       pvpLobbyStorage.setLastLobbyId(lobbiesStore.currentLobby.id);
//       waitNewLobby.current = false;
//     }
//   }, [lobbiesStore.currentLobby?.id]);

//   const createNewLobby = async (
//     name: string,
//     participationFee: number,
//     privateLobby: boolean,
//     accessKey: number
//   ) => {
//     const lobbyManager = await client.runtime.resolve(params.contractName);

//     const tx = await client.transaction(
//       PublicKey.fromBase58(networkStore.address!),
//       async () => {
//         lobbyManager.createLobby(
//           CircuitString.fromString(name),
//           ProtoUInt64.from(participationFee).mul(10 ** 9),
//           Bool(privateLobby),
//           sessionPrivateKey.toPublicKey(),
//           Field.from(accessKey)
//         );
//       }
//     );

//     await tx.sign();
//     await tx.send();

//     waitNewLobby.current = true;
//   };

//   const joinLobby = async (lobbyId: number) => {
//     if (lobbiesStore.currentLobby) {
//       alreadyInLobbyModalStore.setIsOpen(true);
//       throw new Error('Already in lobby');
//     }

//     const lobbyManager = await client.runtime.resolve(params.contractName);

//     const tx = await client.transaction(
//       PublicKey.fromBase58(networkStore.address!),
//       async () => {
//         lobbyManager.joinLobbyWithSessionKey(
//           UInt64.from(lobbyId),
//           sessionPrivateKey.toPublicKey()
//         );
//       }
//     );

//     await tx.sign();
//     await tx.send();
//   };

//   const ready = async () => {
//     const lobbyManager = await client.runtime.resolve(params.contractName);

//     const tx = await client.transaction(
//       PublicKey.fromBase58(networkStore.address!),
//       async () => {
//         lobbyManager.ready();
//       }
//     );

//     await tx.sign();
//     await tx.send();
//   };

//   const leaveLobby = async () => {
//     const lobbyManager = await client.runtime.resolve(params.contractName);

//     const tx = await client.transaction(
//       PublicKey.fromBase58(networkStore.address!),
//       async () => {
//         lobbyManager.leaveLobby();
//       }
//     );

//     await tx.sign();
//     await tx.send();

//     if (alreadyInLobbyModalStore.isOpen) alreadyInLobbyModalStore.close();
//   };

// //   const leaveMatchmaking = async (type: number) => {
// //     if (!networkStore.address) {
// //       return;
// //     }

// //     const lobbyManager = await client.runtime.resolve(params.contractName);

// //     const tx = await client.transaction(
// //       PublicKey.fromBase58(networkStore.address!),
// //       async () => {
// //         lobbyManager.leaveMatchmaking(UInt64.from(type));
// //       }
// //     );

// //     await tx.sign();
// //     await tx.send();
// //   };
//   const register = async (id: number) => {
//     if (!networkStore.walletConnected) await networkStore.connectWallet(false);
//     if (!networkStore.address) throw Error('Not connected');

//     const lobbyManager = await client.runtime.resolve(params.contractName);

//     const tx = await client.transaction(
//       PublicKey.fromBase58(networkStore.address!),
//       async () => {
//         lobbyManager.registerWithType(
//           sessionPrivateKey.toPublicKey(),
//           UInt64.from(id),
//           UInt64.zero
//         );
//       }
//     );

//     await tx.sign();
//     await tx.send();
//   };
//   const randomInt = () => {
//     let number = '';
//     for (let i = 0; i < 10; i++) {
//       number += Math.ceil(Math.random() * 10);
//     }
//     return Number(number);
//   };

//   const randomRoomCode = () => {
//     let code = '';
//     for (let i = 0; i < 4; i++) {
//       code += String.fromCharCode(65 + Math.floor(Math.random() * 26));
//     }
//     return code;
//   }

//   return createOrJoinLobby==null?<div><Button label="Create Lobby" onClick={()=>{
//           let accessKey = randomInt();
//           let genCode=randomRoomCode()
//           setRoomCode(genCode)
//           await createNewLobby(genCode, 0, false, accessKey);
//           setCreateOrJoinLobby(false)
//   }}></Button>
//   <Button label="Join Lobby" onClick={()=>{
//           setCreateOrJoinLobby(true)
//   }}></Button>
//   </div>:createOrJoinLobby==false?<div><p>Lobby: {roomCode}</p>

//   </div>
// }
