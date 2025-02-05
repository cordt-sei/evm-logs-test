#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;
use cosmwasm_std::{to_json_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult, WasmMsg, SubMsg, Reply, Empty};
use cw2::set_contract_version;
use cw721_base::msg::{ExecuteMsg as Cw721ExecuteMsg, QueryMsg as Cw721QueryMsg};
use cw721::OwnerOfResponse;

use crate::error::ContractError;
use crate::msg::{ExecuteMsg, InstantiateMsg, QueryMsg, CollectionsResponse, CollectionInfo, TokensResponse, BatchMintMsg, BatchTransferMsg};
use crate::state::{ADMIN, COLLECTIONS, PENDING_COLLECTION, CollectionData, PendingCollection};

const CONTRACT_NAME: &str = "crates.io:cw721-factory";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");
const CW721_CODE_ID: u64 = 1; // Replace with actual code ID in production
const INSTANTIATE_REPLY_ID: u64 = 1;

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
    let admin = deps.api.addr_validate(&msg.admin)?;
    ADMIN.save(deps.storage, &admin)?;

    Ok(Response::new()
        .add_attribute("method", "instantiate")
        .add_attribute("admin", admin))
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::CreateCollection { name, symbol } => {
            execute_create_collection(deps, env, info, name, symbol)
        }
        ExecuteMsg::BatchMint(msg) => execute_batch_mint(deps, env, info, msg),
        ExecuteMsg::BatchTransfer(msg) => execute_batch_transfer(deps, env, info, msg),
    }
}

pub fn execute_create_collection(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    name: String,
    symbol: String,
) -> Result<Response, ContractError> {
    let admin = ADMIN.load(deps.storage)?;
    if info.sender != admin {
        return Err(ContractError::Unauthorized {});
    }

    // Save pending collection info for the reply handler
    PENDING_COLLECTION.save(deps.storage, &PendingCollection {
        name: name.clone(),
        symbol: symbol.clone(),
    })?;

    // Prepare instantiate message for new CW721 contract
    let instantiate_msg = cw721_base::InstantiateMsg {
        name: name.clone(),
        symbol: symbol.clone(),
        minter: info.sender.to_string(),
    };

    let instantiate = WasmMsg::Instantiate {
        admin: Some(info.sender.to_string()),
        code_id: CW721_CODE_ID,
        msg: to_json_binary(&instantiate_msg)?,
        funds: vec![],
        label: format!("CW721 Collection - {}", name),
    };

    Ok(Response::new()
        .add_submessage(SubMsg::reply_on_success(instantiate, INSTANTIATE_REPLY_ID))
        .add_attribute("action", "create_collection")
        .add_attribute("name", name)
        .add_attribute("symbol", symbol))
}

pub fn execute_batch_mint(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: BatchMintMsg,
) -> Result<Response, ContractError> {
    let collection = COLLECTIONS.load(deps.storage, &msg.collection_addr)?;
    let admin = ADMIN.load(deps.storage)?;
    if info.sender != admin {
        return Err(ContractError::Unauthorized {});
    }

    let mut messages: Vec<SubMsg> = vec![];
    for token_id in msg.token_ids {
        let mint_msg: Cw721ExecuteMsg<Empty, Empty> = Cw721ExecuteMsg::Mint {
            token_id,
            owner: msg.owner.clone(),
            token_uri: None,
            extension: Empty {},
        };

        messages.push(SubMsg::new(WasmMsg::Execute {
            contract_addr: collection.address.to_string(),
            msg: to_json_binary(&mint_msg)?,
            funds: vec![],
        }));
    }

    Ok(Response::new()
        .add_submessages(messages)
        .add_attribute("action", "batch_mint")
        .add_attribute("collection", msg.collection_addr)
        .add_attribute("recipient", msg.owner))
}

pub fn execute_batch_transfer(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: BatchTransferMsg,
) -> Result<Response, ContractError> {
    let mut messages: Vec<SubMsg> = vec![];
    
    // Verify ownership for all tokens before performing transfers
    for transfer in msg.transfers.iter() {
        let owner_msg: Cw721QueryMsg<Empty> = Cw721QueryMsg::OwnerOf { 
            token_id: transfer.token_id.clone(), 
            include_expired: None 
        };
        let owner_response: OwnerOfResponse = deps.querier.query_wasm_smart(
            &transfer.collection_addr,
            &owner_msg,
        )?;
        
        if owner_response.owner != info.sender.to_string() {
            return Err(ContractError::Unauthorized {});
        }
    }

    // Perform transfers
    for transfer in msg.transfers {
        let transfer_msg: Cw721ExecuteMsg<Empty, Empty> = Cw721ExecuteMsg::TransferNft {
            recipient: transfer.recipient,
            token_id: transfer.token_id,
        };

        messages.push(SubMsg::new(WasmMsg::Execute {
            contract_addr: transfer.collection_addr,
            msg: to_json_binary(&transfer_msg)?,
            funds: vec![],
        }));
    }

    Ok(Response::new()
        .add_submessages(messages)
        .add_attribute("action", "batch_transfer")
        .add_attribute("sender", info.sender))
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn reply(deps: DepsMut, _env: Env, msg: Reply) -> Result<Response, ContractError> {
    match msg.id {
        INSTANTIATE_REPLY_ID => handle_instantiate_reply(deps, msg),
        id => Err(ContractError::UnknownReplyId { id }),
    }
}

pub fn handle_instantiate_reply(deps: DepsMut, msg: Reply) -> Result<Response, ContractError> {
    let res = msg.result.unwrap();
    let events = res.events;
    let wasm_event = events
        .iter()
        .find(|e| e.ty == "instantiate")
        .ok_or(ContractError::NoWasmEvent {})?;
    
    let contract_addr = wasm_event
        .attributes
        .iter()
        .find(|attr| attr.key == "_contract_address")
        .ok_or(ContractError::NoContractAddress {})?
        .value
        .clone();

    // Get the saved pending collection info
    let pending = PENDING_COLLECTION.load(deps.storage)?;

    // Save the collection data
    let collection = CollectionData {
        address: deps.api.addr_validate(&contract_addr)?,
        name: pending.name,
        symbol: pending.symbol,
    };
    COLLECTIONS.save(deps.storage, &contract_addr, &collection)?;

    // Clean up
    PENDING_COLLECTION.remove(deps.storage);

    Ok(Response::new()
        .add_attribute("action", "instantiate_reply")
        .add_attribute("collection_address", contract_addr))
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::Collections {} => to_json_binary(&query_collections(deps)?),
        QueryMsg::CollectionTokens { collection_addr: _ } => {
            to_json_binary(&TokensResponse { tokens: vec![] })
        }
    }
}

fn query_collections(deps: Deps) -> StdResult<CollectionsResponse> {
    let collections: StdResult<Vec<CollectionInfo>> = COLLECTIONS
        .range(deps.storage, None, None, cosmwasm_std::Order::Ascending)
        .map(|item| {
            let (_, collection) = item?;
            Ok(CollectionInfo {
                address: collection.address.to_string(),
                name: collection.name,
                symbol: collection.symbol,
            })
        })
        .collect();

    Ok(CollectionsResponse {
        collections: collections?,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use cosmwasm_std::testing::{mock_dependencies, mock_env, mock_info};

    #[test]
    fn proper_initialization() {
        let mut deps = mock_dependencies();
        let info = mock_info("creator", &[]);
        let msg = InstantiateMsg {
            name: "Test Factory".to_string(),
            symbol: "TFAC".to_string(),
            admin: "admin".to_string(),
        };
        let res = instantiate(deps.as_mut(), mock_env(), info, msg).unwrap();
        assert_eq!(0, res.messages.len());
    }
}