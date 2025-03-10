use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use pyth_sdk_solana::{load_price_feed_from_account_info, Price, PriceFeed};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod solana_sports_betting {
    use super::*;

    pub fn initialize_betting_pool(
        ctx: Context<InitializeBettingPool>,
        event_id: String,
        home_team: String,
        away_team: String,
        start_time: i64,
        home_odds: u64,
        away_odds: u64,
        draw_odds: Option<u64>,
        accepted_tokens: Vec<AcceptedToken>,
    ) -> Result<()> {
        let betting_pool = &mut ctx.accounts.betting_pool;
        betting_pool.authority = ctx.accounts.authority.key();
        betting_pool.event_id = event_id;
        betting_pool.home_team = home_team;
        betting_pool.away_team = away_team;
        betting_pool.start_time = start_time;
        betting_pool.home_odds = home_odds;
        betting_pool.away_odds = away_odds;
        betting_pool.draw_odds = draw_odds;
        betting_pool.total_pool = 0;
        betting_pool.is_settled = false;
        betting_pool.winner = None;
        betting_pool.accepted_tokens = accepted_tokens;
        betting_pool.oracle_price_feed = ctx.accounts.oracle_price_feed.key();
        Ok(())
    }

    pub fn place_bet(
        ctx: Context<PlaceBet>,
        amount: u64,
        bet_type: BetType,
        token_index: u8,
    ) -> Result<()> {
        let betting_pool = &mut ctx.accounts.betting_pool;
        let clock = Clock::get()?;

        require!(
            clock.unix_timestamp < betting_pool.start_time,
            BettingError::EventAlreadyStarted
        );

        require!(!betting_pool.is_settled, BettingError::EventAlreadySettled);
        
        // Verify token is accepted
        require!(
            (token_index as usize) < betting_pool.accepted_tokens.len(),
            BettingError::InvalidToken
        );
        
        let token_info = &betting_pool.accepted_tokens[token_index as usize];
        require!(
            token_info.mint == ctx.accounts.bet_token_mint.key(),
            BettingError::InvalidToken
        );

        // Get token price from Pyth
        let price_feed: PriceFeed = load_price_feed_from_account_info(&ctx.accounts.oracle_price_feed)?;
        let current_price: Price = price_feed.get_current_price()
            .ok_or(BettingError::InvalidOracleData)?;
        
        // Calculate bet amount in USD
        let usd_amount = (amount as i64)
            .checked_mul(current_price.price)
            .ok_or(BettingError::CalculationError)?
            .checked_div(10_i64.pow(current_price.expo.unsigned_abs()))
            .ok_or(BettingError::CalculationError)?;

        // Transfer tokens from bettor to pool
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.bettor_token_account.to_account_info(),
                to: ctx.accounts.pool_token_account.to_account_info(),
                authority: ctx.accounts.bettor.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, amount)?;

        // Record the bet
        let bet = &mut ctx.accounts.bet;
        bet.bettor = ctx.accounts.bettor.key();
        bet.amount = amount;
        bet.usd_amount = usd_amount as u64;
        bet.bet_type = bet_type;
        bet.claimed = false;
        bet.token_index = token_index;

        betting_pool.total_pool = betting_pool.total_pool
            .checked_add(usd_amount as u64)
            .ok_or(BettingError::CalculationError)?;

        Ok(())
    }

    pub fn settle_event(
        ctx: Context<SettleEvent>,
    ) -> Result<()> {
        let betting_pool = &mut ctx.accounts.betting_pool;
        require!(!betting_pool.is_settled, BettingError::EventAlreadySettled);
        
        // Only authority can settle the event
        require!(
            betting_pool.authority == ctx.accounts.authority.key(),
            BettingError::Unauthorized
        );

        // Get event outcome from Pyth
        let price_feed: PriceFeed = load_price_feed_from_account_info(&ctx.accounts.oracle_price_feed)?;
        let outcome = price_feed.get_current_price()
            .ok_or(BettingError::InvalidOracleData)?;
        
        // Determine winner based on oracle data
        let winner = match outcome.price {
            p if p > 0 => BetType::Home,
            p if p < 0 => BetType::Away,
            _ => BetType::Draw,
        };

        betting_pool.is_settled = true;
        betting_pool.winner = Some(winner);

        Ok(())
    }

    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        let betting_pool = &ctx.accounts.betting_pool;
        let bet = &mut ctx.accounts.bet;

        require!(betting_pool.is_settled, BettingError::EventNotSettled);
        require!(!bet.claimed, BettingError::AlreadyClaimed);

        if let Some(winner) = betting_pool.winner {
            if winner == bet.bet_type {
                let odds = match bet.bet_type {
                    BetType::Home => betting_pool.home_odds,
                    BetType::Away => betting_pool.away_odds,
                    BetType::Draw => betting_pool.draw_odds.unwrap_or(0),
                };

                let token_info = &betting_pool.accepted_tokens[bet.token_index as usize];
                
                // Get current token price from Pyth
                let price_feed: PriceFeed = load_price_feed_from_account_info(&ctx.accounts.oracle_price_feed)?;
                let current_price: Price = price_feed.get_current_price()
                    .ok_or(BettingError::InvalidOracleData)?;

                // Calculate winnings in token amount
                let usd_winnings = bet.usd_amount
                    .checked_mul(odds)
                    .ok_or(BettingError::CalculationError)?
                    .checked_div(100)
                    .ok_or(BettingError::CalculationError)?;

                let token_winnings = (usd_winnings as i64)
                    .checked_mul(10_i64.pow(current_price.expo.unsigned_abs()))
                    .ok_or(BettingError::CalculationError)?
                    .checked_div(current_price.price)
                    .ok_or(BettingError::CalculationError)? as u64;

                let transfer_ctx = CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.pool_token_account.to_account_info(),
                        to: ctx.accounts.winner_token_account.to_account_info(),
                        authority: ctx.accounts.betting_pool.to_account_info(),
                    },
                );
                token::transfer(transfer_ctx, token_winnings)?;

                bet.claimed = true;
            }
        }

        Ok(())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum BetType {
    Home,
    Away,
    Draw,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct AcceptedToken {
    pub mint: Pubkey,
    pub decimals: u8,
}

#[account]
pub struct BettingPool {
    pub authority: Pubkey,
    pub event_id: String,
    pub home_team: String,
    pub away_team: String,
    pub start_time: i64,
    pub home_odds: u64,
    pub away_odds: u64,
    pub draw_odds: Option<u64>,
    pub total_pool: u64,
    pub is_settled: bool,
    pub winner: Option<BetType>,
    pub accepted_tokens: Vec<AcceptedToken>,
    pub oracle_price_feed: Pubkey,
}

#[account]
pub struct Bet {
    pub bettor: Pubkey,
    pub amount: u64,
    pub usd_amount: u64,
    pub bet_type: BetType,
    pub claimed: bool,
    pub token_index: u8,
}

#[derive(Accounts)]
pub struct InitializeBettingPool<'info> {
    #[account(init, payer = authority, space = 8 + 32 + 32 + 32 + 32 + 8 + 8 + 8 + 8 + 1 + 1 + 256 + 32)]
    pub betting_pool: Account<'info, BettingPool>,
    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK: Oracle price feed account
    pub oracle_price_feed: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub betting_pool: Account<'info, BettingPool>,
    #[account(init, payer = bettor, space = 8 + 32 + 8 + 8 + 1 + 1 + 1)]
    pub bet: Account<'info, Bet>,
    #[account(mut)]
    pub bettor: Signer<'info>,
    pub bet_token_mint: Account<'info, token::Mint>,
    #[account(mut)]
    pub bettor_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub pool_token_account: Account<'info, TokenAccount>,
    /// CHECK: Oracle price feed account
    pub oracle_price_feed: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SettleEvent<'info> {
    #[account(mut)]
    pub betting_pool: Account<'info, BettingPool>,
    pub authority: Signer<'info>,
    /// CHECK: Oracle price feed account
    pub oracle_price_feed: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(mut)]
    pub betting_pool: Account<'info, BettingPool>,
    #[account(mut)]
    pub bet: Account<'info, Bet>,
    #[account(mut)]
    pub pool_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub winner_token_account: Account<'info, TokenAccount>,
    /// CHECK: Oracle price feed account
    pub oracle_price_feed: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
}

#[error_code]
pub enum BettingError {
    #[msg("Event has already started")]
    EventAlreadyStarted,
    #[msg("Event has already been settled")]
    EventAlreadySettled,
    #[msg("Event has not been settled yet")]
    EventNotSettled,
    #[msg("Winnings have already been claimed")]
    AlreadyClaimed,
    #[msg("Unauthorized to perform this action")]
    Unauthorized,
    #[msg("Calculation error")]
    CalculationError,
    #[msg("Invalid token")]
    InvalidToken,
    #[msg("Invalid oracle data")]
    InvalidOracleData,
}