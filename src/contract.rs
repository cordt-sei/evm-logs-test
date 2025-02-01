#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;
use cosmwasm_std::{to_json_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult};
use cw2::set_contract_version;

use crate::error::ContractError;
use crate::msg::{BatchSendMsg, ExecuteMsg, InstantiateMsg, OwnerOfResponse, QueryMsg};
use crate::state::{TokenInfo, MINTER, NAME, SYMBOL, TOKEN_INFO};

const CONTRACT_NAME: &str = "crates.io:evm-logs-test";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;

    NAME.save(deps.storage, &msg.name)?;
    SYMBOL.save(deps.storage, &msg.symbol)?;
    MINTER.save(deps.storage, &deps.api.addr_validate(&msg.minter)?)?;

    Ok(Response::new()
        .add_attribute("method", "instantiate")
        .add_attribute("owner", info.sender))
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::Mint { token_id, owner } => execute_mint(deps, info, token_id, owner),
        ExecuteMsg::BatchSend(msg) => execute_batch_send(deps, info, msg),
    }
}

pub fn execute_mint(
    deps: DepsMut,
    info: MessageInfo,
    token_id: String,
    owner: String,
) -> Result<Response, ContractError> {
    let minter = MINTER.load(deps.storage)?;
    if info.sender != minter {
        return Err(ContractError::Unauthorized {});
    }

    // Create token
    let token = TokenInfo {
        owner: deps.api.addr_validate(&owner)?,
    };
    TOKEN_INFO.save(deps.storage, &token_id, &token)?;

    Ok(Response::new()
        .add_attribute("action", "mint")
        .add_attribute("token_id", token_id)
        .add_attribute("owner", owner))
}

pub fn execute_batch_send(
    deps: DepsMut,
    info: MessageInfo,
    msg: BatchSendMsg,
) -> Result<Response, ContractError> {
    // Validate ownership for all tokens
    for send in &msg.sends {
        let token = TOKEN_INFO.load(deps.storage, &send.token_id)?;
        if token.owner != info.sender {
            return Err(ContractError::Unauthorized {});
        }
    }

    // Perform transfers
    for send in msg.sends {
        let mut token = TOKEN_INFO.load(deps.storage, &send.token_id)?;
        token.owner = deps.api.addr_validate(&send.recipient)?;
        TOKEN_INFO.save(deps.storage, &send.token_id, &token)?;
    }

    Ok(Response::new()
        .add_attribute("action", "batch_send")
        .add_attribute("sender", info.sender))
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::OwnerOf { token_id } => to_json_binary(&query_owner_of(deps, token_id)?),
    }
}

fn query_owner_of(deps: Deps, token_id: String) -> StdResult<OwnerOfResponse> {
    let token = TOKEN_INFO.load(deps.storage, &token_id)?;
    Ok(OwnerOfResponse {
        owner: token.owner.to_string(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use cosmwasm_std::testing::{mock_dependencies, mock_env, mock_info};
    use cosmwasm_std::{from_json, Addr};

    #[test]
    fn proper_initialization() {
        let mut deps = mock_dependencies();
        let info = mock_info("creator", &[]);
        let msg = InstantiateMsg {
            name: "Test".to_string(),
            symbol: "TST".to_string(),
            minter: "minter".to_string(),
        };
        let res = instantiate(deps.as_mut(), mock_env(), info, msg).unwrap();
        assert_eq!(0, res.messages.len());
    }

    #[test]
    fn test_batch_send() {
        let mut deps = mock_dependencies();
        
        // Instantiate
        let info = mock_info("creator", &[]);
        let msg = InstantiateMsg {
            name: "Test".to_string(),
            symbol: "TST".to_string(),
            minter: "creator".to_string(),
        };
        instantiate(deps.as_mut(), mock_env(), info.clone(), msg).unwrap();

        // Mint tokens
        let token_ids = vec!["1", "2", "3"];
        for token_id in &token_ids {
            let mint_msg = ExecuteMsg::Mint {
                token_id: token_id.to_string(),
                owner: "owner".to_string(),
            };
            execute(deps.as_mut(), mock_env(), info.clone(), mint_msg).unwrap();
        }

        // Batch send
        let sends = token_ids
            .into_iter()
            .map(|id| SingleSend {
                token_id: id.to_string(),
                recipient: "recipient".to_string(),
            })
            .collect();

        let msg = ExecuteMsg::BatchSend(BatchSendMsg { sends });
        let info = mock_info("owner", &[]);
        let res = execute(deps.as_mut(), mock_env(), info, msg).unwrap();
        assert_eq!(2, res.attributes.len());
    }
}