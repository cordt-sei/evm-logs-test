use cosmwasm_schema::cw_serde;
use cosmwasm_std::Addr;
use cw_storage_plus::{Item, Map};

pub const TOKEN_INFO: Map<&str, TokenInfo> = Map::new("token_info");
pub const MINTER: Item<Addr> = Item::new("minter");
pub const NAME: Item<String> = Item::new("name");
pub const SYMBOL: Item<String> = Item::new("symbol");

#[cw_serde]
pub struct TokenInfo {
    pub owner: Addr,
}