use cosmwasm_schema::cw_serde;
use cosmwasm_std::Addr;
use cw_storage_plus::{Item, Map};

pub const ADMIN: Item<Addr> = Item::new("admin");
pub const CW721_CODE_ID: Item<u64> = Item::new("cw721_code_id");
pub const COLLECTIONS: Map<&str, CollectionData> = Map::new("collections");
pub const PENDING_COLLECTION: Item<PendingCollection> = Item::new("pending_collection");

#[cw_serde]
pub struct CollectionData {
    pub address: Addr,
    pub name: String,
    pub symbol: String,
}

#[cw_serde]
pub struct PendingCollection {
    pub name: String,
    pub symbol: String,
}