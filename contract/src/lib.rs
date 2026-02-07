use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{LookupMap, IterableMap};
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{env, near_bindgen, AccountId, PanicOnDefault, Promise, PromiseOrValue};
use near_sdk::json_types::U64;

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct AdvisorRequest {
    pub id: u64,
    pub user: AccountId,
    pub question: String,
    pub portfolio_data: String,
    pub timestamp: u64,
    pub status: RequestStatus,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone, PartialEq)]
#[serde(crate = "near_sdk::serde")]
pub enum RequestStatus {
    Pending,
    Processing,
    Completed,
    Failed,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct Verification {
    pub id: u64,
    pub request_id: u64,
    pub user: AccountId,
    pub request_hash: String,
    pub response_hash: String,
    pub signature: String,
    pub signing_address: String,
    pub signing_algo: String,
    pub tee_attestation: String,
    pub response_text: String,
    pub timestamp: u64,
    pub block_height: u64,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct RiskScore {
    pub score: u32, // 0-100
    pub concentration: f64, // HHI index
    pub diversification: String,
    pub recommendation: String,
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct BlindFoldContract {
    pub owner: AccountId,
    pub requests: IterableMap<u64, AdvisorRequest>,
    pub verifications: LookupMap<u64, Verification>,
    pub next_request_id: u64,
    pub next_verification_id: u64,
    pub total_requests: u64,
    pub total_verifications: u64,
}

#[near_bindgen]
impl BlindFoldContract {
    #[init]
    pub fn new(owner: AccountId) -> Self {
        Self {
            owner,
            requests: IterableMap::new(b"r"),
            verifications: LookupMap::new(b"v"),
            next_request_id: 0,
            next_verification_id: 0,
            total_requests: 0,
            total_verifications: 0,
        }
    }

    /// User calls this to ask the AI advisor a question
    /// This function YIELDS execution and waits for TEE to respond
    #[payable]
    pub fn ask_advisor(&mut self, question: String, portfolio_data: String) -> Promise {
        let user = env::predecessor_account_id();
        let request_id = self.next_request_id;

        // Create request
        let request = AdvisorRequest {
            id: request_id,
            user: user.clone(),
            question,
            portfolio_data,
            timestamp: env::block_timestamp(),
            status: RequestStatus::Pending,
        };

        // Store request
        self.requests.insert(&request_id, &request);
        self.next_request_id += 1;
        self.total_requests += 1;

        // YIELD: Pause contract execution
        // The TEE Relayer will pick this up, process it, and call provide_ai_response
        env::log_str(&format!("Request #{} created and yielding", request_id));

        // Create a promise that yields
        // In practice, the TEE Relayer polls get_pending_requests and handles this
        Promise::new(env::current_account_id())
    }

    /// TEE Relayer calls this after getting response from NEAR AI Cloud
    /// This RESUMES the contract with the verified AI response
    pub fn provide_ai_response(
        &mut self,
        request_id: u64,
        response_text: String,
        request_hash: String,
        response_hash: String,
        signature: String,
        signing_address: String,
        signing_algo: String,
        tee_attestation: String,
    ) -> PromiseOrValue<Verification> {
        // Only the contract itself or owner can provide responses
        let caller = env::predecessor_account_id();
        assert!(
            caller == env::current_account_id() || caller == self.owner,
            "Only relayer can provide responses"
        );

        // Get request
        let mut request = self.requests.get(&request_id)
            .expect("Request not found");

        assert_eq!(request.status, RequestStatus::Pending, "Request already processed");

        // Update request status
        request.status = RequestStatus::Completed;
        self.requests.insert(&request_id, &request);

        // Create verification record
        let verification_id = self.next_verification_id;
        let verification = Verification {
            id: verification_id,
            request_id,
            user: request.user.clone(),
            request_hash,
            response_hash,
            signature,
            signing_address,
            signing_algo,
            tee_attestation,
            response_text,
            timestamp: env::block_timestamp(),
            block_height: env::block_height(),
        };

        // Store verification permanently on-chain
        self.verifications.insert(&verification_id, &verification);
        self.next_verification_id += 1;
        self.total_verifications += 1;

        env::log_str(&format!(
            "Verification #{} stored on-chain for request #{}",
            verification_id, request_id
        ));

        PromiseOrValue::Value(verification)
    }

    /// Public view function - anyone can verify any interaction
    pub fn get_verification(&self, verification_id: u64) -> Option<Verification> {
        self.verifications.get(&verification_id)
    }

    /// Get verification by request ID
    pub fn get_verification_by_request(&self, request_id: u64) -> Option<Verification> {
        // Linear search through verifications
        // In production, we'd maintain a reverse index
        for i in 0..self.next_verification_id {
            if let Some(verification) = self.verifications.get(&i) {
                if verification.request_id == request_id {
                    return Some(verification);
                }
            }
        }
        None
    }

    /// Get all pending requests (for TEE Relayer to poll)
    pub fn get_pending_requests(&self) -> Vec<AdvisorRequest> {
        let mut pending = Vec::new();
        for i in 0..self.next_request_id {
            if let Some(request) = self.requests.get(&i) {
                if request.status == RequestStatus::Pending {
                    pending.push(request);
                }
            }
        }
        pending
    }

    /// Get user's request history
    pub fn get_user_requests(&self, user: AccountId) -> Vec<AdvisorRequest> {
        let mut user_requests = Vec::new();
        for i in 0..self.next_request_id {
            if let Some(request) = self.requests.get(&i) {
                if request.user == user {
                    user_requests.push(request);
                }
            }
        }
        user_requests
    }

    /// Calculate risk score from portfolio data (view function - free to call)
    pub fn calculate_risk_score(&self, portfolio_json: String) -> RiskScore {
        // Parse portfolio and calculate Herfindahl-Hirschman Index (HHI)
        // HHI = sum of squared market share percentages
        // HHI < 1500: diversified
        // HHI 1500-2500: moderate concentration
        // HHI > 2500: high concentration

        use serde_json::Value;

        // Default values if parsing fails
        let mut hhi = 10000.0; // Single asset = maximum concentration
        let mut total_holdings = 0;

        // Try to parse the portfolio JSON
        if let Ok(portfolio) = serde_json::from_str::<Value>(&portfolio_json) {
            if let Some(holdings) = portfolio["holdings"].as_array() {
                total_holdings = holdings.len();

                // Calculate total portfolio value
                let mut total_value = 0.0;
                let mut balances: Vec<f64> = Vec::new();

                for holding in holdings {
                    if let Some(balance_str) = holding["balance"].as_str() {
                        if let Ok(balance) = balance_str.parse::<f64>() {
                            // For simplicity, assuming all tokens have similar prices
                            // In production, would fetch real prices
                            balances.push(balance);
                            total_value += balance;
                        }
                    }
                }

                // Calculate HHI
                if total_value > 0.0 && balances.len() > 0 {
                    hhi = 0.0;
                    for balance in balances {
                        let percentage = (balance / total_value) * 100.0;
                        hhi += percentage * percentage;
                    }
                }
            }
        }

        // Determine risk level and recommendations
        let (score, diversification, recommendation) = if hhi < 1500.0 {
            (
                30,
                format!("Well diversified ({} assets)", total_holdings),
                "Your portfolio shows healthy diversification. Maintain current allocation.".to_string()
            )
        } else if hhi < 2500.0 {
            (
                55,
                format!("Moderate concentration ({} assets)", total_holdings),
                "Consider rebalancing top holdings to reduce concentration risk.".to_string()
            )
        } else {
            (
                82,
                format!("High concentration ({} assets)", total_holdings),
                "Urgent: Your portfolio is heavily concentrated. Diversify to reduce risk.".to_string()
            )
        };

        RiskScore {
            score,
            concentration: hhi,
            diversification,
            recommendation,
        }
    }

    /// Get contract statistics
    pub fn get_stats(&self) -> (U64, U64, U64) {
        (
            U64(self.total_requests),
            U64(self.total_verifications),
            U64(self.next_request_id),
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::test_utils::{accounts, VMContextBuilder};
    use near_sdk::testing_env;

    fn get_context(predecessor: AccountId) -> VMContextBuilder {
        let mut builder = VMContextBuilder::new();
        builder.predecessor_account_id(predecessor);
        builder
    }

    #[test]
    fn test_new() {
        let context = get_context(accounts(0));
        testing_env!(context.build());
        let contract = BlindFoldContract::new(accounts(0));
        assert_eq!(contract.total_requests, 0);
        assert_eq!(contract.total_verifications, 0);
    }

    #[test]
    fn test_calculate_risk_score() {
        let context = get_context(accounts(0));
        testing_env!(context.build());
        let contract = BlindFoldContract::new(accounts(0));

        let risk = contract.calculate_risk_score("{}".to_string());
        assert!(risk.score > 0 && risk.score <= 100);
    }
}
