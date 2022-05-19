import {SubstrateEvent} from "@subql/types";
import {Account, Balance, Transfer, XToken} from "../types";

const ADMIN_ADDRESS = "0x6D6f646c617373746d6E67720000000000000000".toLowerCase()
const NULL_ADDRESS = "0x0000000000000000000000000000000000000000"
const XTOKEN_ADDRESS = "0x0000000000000000000000000000000000000804"

async function ensureXToken(recordId: string): Promise<XToken> {
  let entity = await XToken.get(recordId);
  if (!entity) {
    const meta = (await api.query.assets.metadata(BigInt(recordId))).toHuman()
    entity = XToken.create({
      id: recordId,
      address: "0x" + "f".repeat(42 - recordId.length) + recordId.slice(2),
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

async function updateBalance(token: string, account: string, value: bigint): Promise<void> {
  const recordId = `${token}-${account}`
  let entity = await Balance.get(recordId);
  if (!entity) {
    entity = Balance.create({
      id: recordId,
      tokenId: token,
      accountId: account,
      transferValue: BigInt(0),
      apiValue: BigInt(0),
    })
  }
  entity.transferValue += value
  const apiResult:any = (await api.query.assets.account(token, account)).toJSON()
  entity.apiValue = BigInt(apiResult ? apiResult.balance : 0)
}

async function initFunction(): Promise<void> {
  await ensureAccount(NULL_ADDRESS)
}

export async function handleMint(event: SubstrateEvent): Promise<void> {
  const [assetId, accountId, balance] = event.event.data.toJSON() as [string, string, string]
  const to = await ensureAccount(accountId)
  const token = await ensureXToken(assetId)
  const value = BigInt(balance)
  const blockNumber = event.block.block.header.number.toNumber()

  // There should be a better to initialize
  if (blockNumber == 1295444) {
    await initFunction()
  }
  
  const index = event.idx
  const transfer = Transfer.create({
    id: `${blockNumber}-${index}`,
    blockNumber: blockNumber,
    extrinsicIndex: event.extrinsic?.idx,
    eventIndex: index,
    timestamp: event.block.timestamp,
    fromId: NULL_ADDRESS,
    toId: to.id,
    tokenId: token.id,
    value: value
  })
  await transfer.save();
  await updateBalance(token.id, to.id, value)
}

export async function handleBurn(event: SubstrateEvent): Promise<void> {
  const [assetId, accountId, balance] = event.event.data.toJSON() as [string, string, string]
  const from = await ensureAccount(accountId)
  const token = await ensureXToken(assetId)
  const value = BigInt(balance)
  const blockNumber = event.block.block.header.number.toNumber()
  const index = event.idx
  const transfer = Transfer.create({
    id: `${blockNumber}-${index}`,
    blockNumber: blockNumber,
    extrinsicIndex: event.extrinsic?.idx,
    eventIndex: index,
    timestamp: event.block.timestamp,
    fromId: from.id,
    toId: NULL_ADDRESS,
    tokenId: token.id,
    value: value
  })
  await transfer.save();
  await updateBalance(token.id, from.id, -value)
}

export async function handleTransfer(event: SubstrateEvent): Promise<void> {
  const [assetId, fromId, toId, balance] = event.event.data.toJSON() as [string, string, string, string]
  const from = await ensureAccount(fromId)
  const to = await ensureAccount(toId)
  const token = await ensureXToken(assetId)
  const value = BigInt(balance)
  const blockNumber = event.block.block.header.number.toNumber()
  const index = event.idx
  const transfer = Transfer.create({
    id: `${blockNumber}-${index}`,
    blockNumber: blockNumber,
    extrinsicIndex: event.extrinsic?.idx,
    eventIndex: index,
    timestamp: event.block.timestamp,
    fromId: from.id,
    toId: to.id,
    tokenId: token.id,
    value: value
  })
  await transfer.save();
  await updateBalance(token.id, from.id, -value)
  await updateBalance(token.id, to.id, value)
}
