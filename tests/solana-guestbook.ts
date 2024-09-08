import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaGuestbook } from "../target/types/solana_guestbook";
import { expect } from "chai";

describe("solana-guestbook", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SolanaGuestbook as Program<SolanaGuestbook>;

  it("Initializes the guestbook", async () => {
    const guestbook = anchor.web3.Keypair.generate();

    const tx = await program.methods
      .initialize()
      .accounts({
        guestbook: guestbook.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any) // Type assertion
      .signers([guestbook])
      .rpc();

    console.log("Your transaction signature", tx);

    const account = await program.account.guestbook.fetch(guestbook.publicKey);
    expect(account.messageCount.toNumber()).to.equal(0);
  });

  it("Adds a message to the guestbook", async () => {
    const guestbook = anchor.web3.Keypair.generate();

    // Initialize the guestbook
    await program.methods
      .initialize()
      .accounts({
        guestbook: guestbook.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any) // Type assertion
      .signers([guestbook])
      .rpc();

    // Add a message
    const title = "Hello, Solana!";
    const content = "This is a test message on the Solana blockchain.";

    const [messagePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("message"),
        guestbook.publicKey.toBuffer(),
        new anchor.BN(0).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    const tx = await program.methods
      .addMessage(title, content)
      .accounts({
        guestbook: guestbook.publicKey,
        message: messagePda,
        author: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any) // Type assertion
      .rpc();

    console.log("Your transaction signature", tx);

    // Fetch the guestbook account and verify the message count
    const guestbookAccount = await program.account.guestbook.fetch(
      guestbook.publicKey
    );
    expect(guestbookAccount.messageCount.toNumber()).to.equal(1);

    // Fetch the message account and verify its contents
    const messageAccount = await program.account.message.fetch(messagePda);
    expect(messageAccount.author.toString()).to.equal(
      provider.wallet.publicKey.toString()
    );
    expect(messageAccount.title).to.equal(title);
    expect(messageAccount.content).to.equal(content);
    expect(messageAccount.timestamp.toNumber()).to.be.greaterThan(0);
  });
});
