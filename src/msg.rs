use cosmwasm_schema::{cw_serde, QueryResponses};

#[cw_serde]
pub struct InstantiateMsg {
    pub name: String,
    pub symbol: String,
    pub minter: String,
}

#[cw_serde]
pub struct SingleSend {
    pub token_id: String,
    pub recipient: String,
}

#[cw_serde]
pub struct BatchSendMsg {
    pub sends: Vec<SingleSend>,
}

#[cw_serde]
pub enum ExecuteMsg {
    BatchSend(BatchSendMsg),
    Mint { token_id: String, owner: String },
}

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    #[returns(OwnerOfResponse)]
    OwnerOf { token_id: String },
}

#[cw_serde]
pub struct OwnerOfResponse {
    pub owner: String,
}