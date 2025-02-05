use cosmwasm_schema::{cw_serde, QueryResponses};

#[cw_serde]
pub struct InstantiateMsg {
    pub name: String,
    pub symbol: String,
    pub admin: String,
}

#[cw_serde]
pub struct BatchMintMsg {
    pub collection_addr: String,
    pub token_ids: Vec<String>,
    pub owner: String,
}

#[cw_serde]
pub struct SingleTransfer {
    pub collection_addr: String,
    pub token_id: String,
    pub recipient: String,
}

#[cw_serde]
pub struct BatchTransferMsg {
    pub transfers: Vec<SingleTransfer>,
}

#[cw_serde]
pub enum ExecuteMsg {
    CreateCollection { name: String, symbol: String },
    BatchMint(BatchMintMsg),
    BatchTransfer(BatchTransferMsg),
}

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    #[returns(CollectionsResponse)]
    Collections {},
    #[returns(TokensResponse)]
    CollectionTokens { collection_addr: String },
}

#[cw_serde]
pub struct CollectionsResponse {
    pub collections: Vec<CollectionInfo>,
}

#[cw_serde]
pub struct CollectionInfo {
    pub address: String,
    pub name: String,
    pub symbol: String,
}

#[cw_serde]
pub struct TokensResponse {
    pub tokens: Vec<TokenInfo>,
}

#[cw_serde]
pub struct TokenInfo {
    pub token_id: String,
    pub owner: String,
}