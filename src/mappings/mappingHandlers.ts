import {SubstrateExtrinsic,SubstrateEvent,SubstrateBlock} from "@subql/types";
import {Account, Transfer, XToken} from "../types";
import {Balance} from "@polkadot/types/interfaces";
import {Codec, AnyJson} from "@polkadot/types-codec/types"
import { typesBundlePre900 } from "moonbeam-types-bundle"
import { Int } from "@polkadot/types-codec";

async function ensureXToken(recordId: string): Promise<XToken> {
  let entity = await XToken.get(recordId);
  if (!entity) {
    const meta = (await api.query.assets.metadata(BigInt(recordId))).toHuman()
    // this is another interesting data that might want to be added in the future
    // const asset = await api.query.assets.asset(BigInt(recordId))
    entity = XToken.create({
      id: recordId,
      name: meta.name.toString(),
      symbol: meta.symbol.toString(),
      decimals: Number(meta.decimals.toString()),
    });
    await entity.save();
  }
  return entity;
}

async function ensureAccount(recordId: string): Promise<Account> {
  recordId = recordId.toLowerCase();
  let entity = await Account.get(recordId);
  if (!entity) {
    entity = new Account(recordId);
    await entity.save();
  }
  return entity;
}

export async function handleDeposit(event: SubstrateEvent): Promise<void> {
  if (event.block.specVersion == 1401) {
    // eval string from toString() is used because toArray, toHuman and toJSON method are not working right
    const eventData = eval(event.event.data.toString())
    const blockNumber = event.block.block.header.number.toNumber()
    const index = event.idx
    const [accountId, multiAssets, multiAsset, multiLocation] = eventData
    const {id: {concrete: xcm}, fun: {fungible: amount}} = multiAsset as {id: {concrete: string}; fun: {fungible: bigint}}
    const tokenId = (await api.query.assetManager.assetTypeId({xcm: xcm})).toString()
    const token = await ensureXToken(tokenId)
    const account = await ensureAccount(accountId)
    const transfer = Transfer.create({
      id: `${blockNumber}-${index}`,
      blockNumber: blockNumber,
      extrinsicIndex: event.extrinsic?.idx,
      eventIndex: index,
      multiLocation: String(multiLocation),
      toId: account.id,
      tokenId: token.id,
      value: amount
    })
    await transfer.save();
  }
}

export async function handleXToken(event: SubstrateEvent): Promise<void> {
  // handleSpecVersion
  if (event.block.specVersion >= 1401) {
    
  }
}

export async function handleTransfer(event: SubstrateEvent): Promise<void> {
  // handleSpecVersion
}
