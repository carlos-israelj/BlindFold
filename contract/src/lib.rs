use near_sdk::store::UnorderedMap;
use near_sdk::{env, near, require, AccountId, NearToken, PanicOnDefault};

#[near(serializers = [json, borsh])]
#[derive(Clone)]
pub struct AdvisorRequest {
    pub id: u64,
    pub user: AccountId,
    pub question: String,
    pub portfolio_data: String,
    pub timestamp: u64,
    pub status: RequestStatus,
}

#[near(serializers = [json, borsh])]
#[derive(Clone, PartialEq, Debug)]
pub enum RequestStatus {
    Pending,
    Processing,
    Completed,
    Failed,
}

#[near(serializers = [json, borsh])]
#[derive(Clone)]
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

#[near(serializers = [json, borsh])]
pub struct RiskScore {
    pub score: u32,
    pub concentration: f64,
    pub diversification: String,
    pub recommendation: String,
}

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct BlindFoldContract {
    pub owner: AccountId,
    pub requests: UnorderedMap<u64, AdvisorRequest>,
    pub verifications: UnorderedMap<u64, Verification>,
    pub next_request_id: u64,
    pub next_verification_id: u64,
    pub total_requests: u64,
    pub total_verifications: u64,
}

#[near]
impl BlindFoldContract {
    #[init]
    pub fn new(owner: AccountId) -> Self {
        Self {
            owner,
            requests: UnorderedMap::new(b"r"),
            verifications: UnorderedMap::new(b"v"),
            next_request_id: 0,
            next_verification_id: 0,
            total_requests: 0,
            total_verifications: 0,
        }
    }

    #[payable]
    pub fn ask_advisor(&mut self, question: String, portfolio_data: String) -> u64 {
        let user = env::predecessor_account_id();
        let deposit = env::attached_deposit();

        require!(
            deposit >= NearToken::from_millinear(10),
            "Minimum 0.01 NEAR deposit required"
        );

        let request_id = self.next_request_id;
        self.next_request_id += 1;

        let request = AdvisorRequest {
            id: request_id,
            user: user.clone(),
            question,
            portfolio_data,
            timestamp: env::block_timestamp(),
            status: RequestStatus::Pending,
        };

        self.requests.insert(request_id, request);
        self.total_requests += 1;

        env::log_str(&format!("Request #{} created by {}", request_id, user));
        request_id
    }

    pub fn mark_processing(&mut self, request_id: u64) {
        if let Some(request) = self.requests.get(&request_id) {
            require!(
                request.status == RequestStatus::Pending,
                "Request already processed"
            );

            let mut updated_request = request.clone();
            updated_request.status = RequestStatus::Processing;
            self.requests.insert(request_id, updated_request);

            env::log_str(&format!("Request #{} marked as processing", request_id));
        } else {
            env::panic_str("Request not found");
        }
    }

    #[payable]
    pub fn store_verification(
        &mut self,
        request_id: u64,
        request_hash: String,
        response_hash: String,
        signature: String,
        signing_address: String,
        signing_algo: String,
        tee_attestation: String,
        response_text: String,
    ) -> u64 {
        if let Some(request) = self.requests.get(&request_id) {
            require!(
                request.status == RequestStatus::Processing,
                "Request not in processing state"
            );

            let user = request.user.clone();
            let mut updated_request = request.clone();
            updated_request.status = RequestStatus::Completed;
            self.requests.insert(request_id, updated_request);

            let verification_id = self.next_verification_id;
            self.next_verification_id += 1;

            let verification = Verification {
                id: verification_id,
                request_id,
                user,
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

            self.verifications.insert(verification_id, verification);
            self.total_verifications += 1;

            env::log_str(&format!(
                "Verification #{} stored for request #{}",
                verification_id, request_id
            ));

            verification_id
        } else {
            env::panic_str("Request not found");
        }
    }

    pub fn calculate_risk_score(&self, _portfolio_json: String) -> RiskScore {
        let hhi: f64 = 2500.0;
        let score = ((10000.0 - hhi) / 100.0).min(100.0) as u32;

        let (diversification, recommendation) = if hhi < 1500.0 {
            ("Low", "Well diversified portfolio")
        } else if hhi < 2500.0 {
            ("Medium", "Consider further diversification")
        } else {
            ("High", "High concentration risk - diversify holdings")
        };

        RiskScore {
            score,
            concentration: hhi,
            diversification: diversification.to_string(),
            recommendation: recommendation.to_string(),
        }
    }

    pub fn get_request(&self, request_id: u64) -> Option<AdvisorRequest> {
        self.requests.get(&request_id).cloned()
    }

    pub fn get_verification(&self, verification_id: u64) -> Option<Verification> {
        self.verifications.get(&verification_id).cloned()
    }

    pub fn get_pending_requests(&self) -> Vec<AdvisorRequest> {
        self.requests
            .iter()
            .filter(|(_, r)| r.status == RequestStatus::Pending)
            .map(|(_, r)| r.clone())
            .collect()
    }

    pub fn get_user_requests(&self, user: AccountId) -> Vec<AdvisorRequest> {
        self.requests
            .iter()
            .filter(|(_, r)| r.user == user)
            .map(|(_, r)| r.clone())
            .collect()
    }

    pub fn get_user_verifications(&self, user: AccountId) -> Vec<Verification> {
        self.verifications
            .iter()
            .filter(|(_, v)| v.user == user)
            .map(|(_, v)| v.clone())
            .collect()
    }

    pub fn get_stats(&self) -> (u64, u64, u64, u64) {
        (
            self.total_requests,
            self.total_verifications,
            self.next_request_id,
            self.next_verification_id,
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new() {
        let owner: AccountId = "owner.near".parse().unwrap();
        let contract = BlindFoldContract::new(owner.clone());
        assert_eq!(contract.owner, owner);
        assert_eq!(contract.next_request_id, 0);
    }
}
