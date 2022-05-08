import {SubstrateExtrinsic,SubstrateEvent,SubstrateBlock} from "@subql/types";
import {Event} from "../types";
import {Balance} from "@polkadot/types/interfaces";



export async function handleEvent(event: SubstrateEvent): Promise<void> {
    const blockNumber = event.block.block.header.number.toNumber()
    const index = Number(event.event.index)
    const record = Event.create({
        id: `${blockNumber}-${index}`,
        index: index,
        blockNumber: blockNumber,
        extrinsicIndex: event.extrinsic.idx,
        section: event.event.section,
        method: event.event.method,
        data: event.event.data.toString(),
        hash: event.event.hash.toString(),
        meta: event.event.meta.toString()
    })
    await record.save();
}


// export async function handleBlock(block: SubstrateBlock): Promise<void> {
//     //Create a new starterEntity with ID using block hash
//     let record = new StarterEntity(block.block.header.hash.toString());
//     //Record block number
//     record.field1 = block.block.header.number.toNumber();
//     await record.save();
// }

// export async function handleCall(extrinsic: SubstrateExtrinsic): Promise<void> {
//     const record = await StarterEntity.get(extrinsic.block.block.header.hash.toString());
//     //Date type timestamp
//     record.field4 = extrinsic.block.timestamp;
//     //Boolean tyep
//     record.field5 = true;
//     await record.save();
// }


