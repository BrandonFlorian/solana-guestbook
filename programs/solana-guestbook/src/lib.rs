use anchor_lang::prelude::*;

declare_id!("8w4Vd8KuZjpq45YYU2GAHcqVUXUyNVahGQne5t3M1yk6");

#[program]
pub mod solana_guestbook {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let guestbook = &mut ctx.accounts.guestbook;
        guestbook.message_count = 0;
        Ok(())
    }

    pub fn add_message(ctx: Context<AddMessage>, title: String, content: String) -> Result<()> {
        let guestbook = &mut ctx.accounts.guestbook;
        let message = &mut ctx.accounts.message;

        message.author = *ctx.accounts.author.key;
        message.title = title;
        message.content = content;
        message.timestamp = Clock::get()?.unix_timestamp;

        guestbook.message_count += 1;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + 8)]
    pub guestbook: Account<'info, Guestbook>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddMessage<'info> {
    #[account(mut)]
    pub guestbook: Account<'info, Guestbook>,
    #[account(
        init,
        payer = author,
        space = 8 + 32 + 64 + 1024 + 8,
        seeds = [b"message", guestbook.key().as_ref(), &guestbook.message_count.to_le_bytes()],
        bump
    )]
    pub message: Account<'info, Message>,
    #[account(mut)]
    pub author: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Guestbook {
    pub message_count: u64,
}

#[account]
pub struct Message {
    pub author: Pubkey,
    pub title: String,
    pub content: String,
    pub timestamp: i64,
}