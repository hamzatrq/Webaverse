require("dotenv").config({ path: "../.env" });
const { expect } = require("chai");
const crypto = require("crypto");
const ethers = require("ethers");
const HDWallet = require("truffle-hdwallet-provider");
var env = process.env.NODE_ENV || "testnet";
const config = require("../config")[env];

const developmentMnemonic = require("../config");
const { LazyMinter } = require("../src/lib");

const WebaverseContract = artifacts.require("Webaverse");
const ERC721Mock = artifacts.require("ERC721Mock");
var Webaverse;

contract("Webaverse", async function () {
    let str = JSON.stringify(config.priv_keys);
    str = str.substring(1, str.length - 1);
    let privKeys = str.split(",");
    // intialize wallets
    const provider = new ethers.providers.InfuraProvider("rinkeby", config.infura_key);
    const signer = new ethers.Wallet(privKeys[0], provider);
    const claimer = new ethers.Wallet(privKeys[1], provider);
    const externalSigner = new ethers.Wallet(privKeys[2], provider);
    console.log(signer.address);
    beforeEach(async function () {
        Webaverse = await WebaverseContract.new();
        await Webaverse.mint(signer.address, 1, "abcdef");
        await Webaverse.mint(signer.address, 2, "xyzder");
        await Webaverse.mint(signer.address, 3, "qwerty");
        var ERC721 = await ERC721Mock.new("ExternalContract", "test");
        await ERC721.mint(externalSigner.address, 1);
        await ERC721.mint(externalSigner.address, 2);
        await ERC721.mint(externalSigner.address, 3);
    });

    describe("Claim", async function () {
        context("With valid signature, valid nonce, valid expiry", async function () {
            it("Should redeem an NFT from a signed voucher", async function () {
                console.log(signer.address);
                const lazyMinter = new LazyMinter({
                    contract: Webaverse,
                    signer: signer,
                });
                var validTokenIds = [1, 2, 3];
                var nonce = crypto.randomBytes(32).readUIntBE(0, 6); //ethers.BigNumber.from(ethers.utils.randomBytes(32));
                console.log(nonce);
                var expiry = Math.round(+new Date() / 1000 + 50);
                console.log(expiry);
                const voucher = await lazyMinter.createVoucher(validTokenIds[0], nonce, expiry);
                console.log(voucher);
                //check if event transfer is emitted
                const { logs } = await Webaverse.claim(claimer.address, voucher);
                console.log(logs);
                expect(logs.length).to.be.equal(2);
                expect(logs[1].event).to.be.equal("Transfer");
                expect(logs[1].args.from).to.be.equal(signer.address);
                expect(logs[1].args.to).to.be.equal(claimer.address);
                expect(logs[1].args.tokenId.toNumber()).to.be.equal(validTokenIds[0]);

                // await expect(Webaverse.claim(claimer.address, voucher))
                //     .to.emit(Webaverse, "Transfer")
                //     .withArgs(signer.address, claimer.address, voucher.tokenId);
            });
        });
        // it("Should redeem an NFT from a signed voucher", async function () {
        //     const lazyMinter = new LazyMinter({ Webaverse, signer: signer });
        //     let tokenId = 1;
        //     let nonce = crypto.randomBytes(32).readUIntBE(0, 6);
        //     let expiry = Math.round(+new Date() / 1000 + 1000);
        //     const voucher = await lazyMinter.createVoucher();

        //     await expect(redeemerContract.redeem(redeemer.address, voucher))
        //         .to.emit(contract, "Transfer") // transfer from null address to minter
        //         .withArgs(
        //             "0x0000000000000000000000000000000000000000",
        //             minter.address,
        //             voucher.tokenId
        //         )
        //         .and.to.emit(contract, "Transfer") // transfer from minter to redeemer
        //         .withArgs(minter.address, redeemer.address, voucher.tokenId);
        // });

        // it("Should fail to redeem an NFT that's already been claimed", async function () {
        //     const { contract, redeemerContract, redeemer, minter } = await deploy();

        //     const lazyMinter = new LazyMinter({ contract, signer: minter });
        //     const voucher = await lazyMinter.createVoucher(
        //         1,
        //         "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"
        //     );

        //     await expect(redeemerContract.redeem(redeemer.address, voucher))
        //         .to.emit(contract, "Transfer") // transfer from null address to minter
        //         .withArgs(
        //             "0x0000000000000000000000000000000000000000",
        //             minter.address,
        //             voucher.tokenId
        //         )
        //         .and.to.emit(contract, "Transfer") // transfer from minter to redeemer
        //         .withArgs(minter.address, redeemer.address, voucher.tokenId);

        //     await expect(redeemerContract.redeem(redeemer.address, voucher)).to.be.revertedWith(
        //         "ERC721: token already minted"
        //     );
        // });

        // it("Should fail to redeem an NFT voucher that's signed by an unauthorized account", async function () {
        //     const { contract, redeemerContract, redeemer, minter } = await deploy();

        //     const signers = await ethers.getSigners();
        //     const rando = signers[signers.length - 1];

        //     const lazyMinter = new LazyMinter({ contract, signer: rando });
        //     const voucher = await lazyMinter.createVoucher(
        //         1,
        //         "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"
        //     );

        //     await expect(redeemerContract.redeem(redeemer.address, voucher)).to.be.revertedWith(
        //         "Signature invalid or unauthorized"
        //     );
        // });

        // it("Should fail to redeem an NFT voucher that's been modified", async function () {
        //     const { contract, redeemerContract, redeemer, minter } = await deploy();

        //     const signers = await ethers.getSigners();
        //     const rando = signers[signers.length - 1];

        //     const lazyMinter = new LazyMinter({ contract, signer: rando });
        //     const voucher = await lazyMinter.createVoucher(
        //         1,
        //         "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"
        //     );
        //     voucher.tokenId = 2;
        //     await expect(redeemerContract.redeem(redeemer.address, voucher)).to.be.revertedWith(
        //         "Signature invalid or unauthorized"
        //     );
        // });

        // it("Should fail to redeem an NFT voucher with an invalid signature", async function () {
        //     const { contract, redeemerContract, redeemer, minter } = await deploy();

        //     const signers = await ethers.getSigners();
        //     const rando = signers[signers.length - 1];

        //     const lazyMinter = new LazyMinter({ contract, signer: rando });
        //     const voucher = await lazyMinter.createVoucher(
        //         1,
        //         "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"
        //     );

        //     const dummyData = ethers.utils.randomBytes(128);
        //     voucher.signature = await minter.signMessage(dummyData);

        //     await expect(redeemerContract.redeem(redeemer.address, voucher)).to.be.revertedWith(
        //         "Signature invalid or unauthorized"
        //     );
        // });

        // it("Should redeem if payment is >= minPrice", async function () {
        //     const { contract, redeemerContract, redeemer, minter } = await deploy();

        //     const lazyMinter = new LazyMinter({ contract, signer: minter });
        //     const minPrice = ethers.constants.WeiPerEther; // charge 1 Eth
        //     const voucher = await lazyMinter.createVoucher(
        //         1,
        //         "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
        //         minPrice
        //     );

        //     await expect(redeemerContract.redeem(redeemer.address, voucher, { value: minPrice }))
        //         .to.emit(contract, "Transfer") // transfer from null address to minter
        //         .withArgs(
        //             "0x0000000000000000000000000000000000000000",
        //             minter.address,
        //             voucher.tokenId
        //         )
        //         .and.to.emit(contract, "Transfer") // transfer from minter to redeemer
        //         .withArgs(minter.address, redeemer.address, voucher.tokenId);
        // });

        // it("Should fail to redeem if payment is < minPrice", async function () {
        //     const { contract, redeemerContract, redeemer, minter } = await deploy();

        //     const lazyMinter = new LazyMinter({ contract, signer: minter });
        //     const minPrice = ethers.constants.WeiPerEther; // charge 1 Eth
        //     const voucher = await lazyMinter.createVoucher(
        //         1,
        //         "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
        //         minPrice
        //     );

        //     const payment = minPrice.sub(10000);
        //     await expect(
        //         redeemerContract.redeem(redeemer.address, voucher, { value: payment })
        //     ).to.be.revertedWith("Insufficient funds to redeem");
        // });

        // it("Should make payments available to minter for withdrawal", async function () {
        //     const { contract, redeemerContract, redeemer, minter } = await deploy();

        //     const lazyMinter = new LazyMinter({ contract, signer: minter });
        //     const minPrice = ethers.constants.WeiPerEther; // charge 1 Eth
        //     const voucher = await lazyMinter.createVoucher(
        //         1,
        //         "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
        //         minPrice
        //     );

        //     // the payment should be sent from the redeemer's account to the contract address
        //     await expect(
        //         await redeemerContract.redeem(redeemer.address, voucher, { value: minPrice })
        //     ).to.changeEtherBalances([redeemer, contract], [minPrice.mul(-1), minPrice]);

        //     // minter should have funds available to withdraw
        //     expect(await contract.availableToWithdraw()).to.equal(minPrice);

        //     // withdrawal should increase minter's balance
        //     await expect(await contract.withdraw()).to.changeEtherBalance(minter, minPrice);

        //     // minter should now have zero available
        //     expect(await contract.availableToWithdraw()).to.equal(0);
        // });
    });
});

// async function deploy() {
//   const [minter, redeemer, _] = await ethers.getSigners();

//   let factory = await ethers.getContractFactory("LazyNFT", minter);
//   const contract = await factory.deploy(minter.address);

//   // the redeemerContract is an instance of the contract that's wired up to the redeemer's signing key
//   const redeemerFactory = factory.connect(redeemer);
//   const redeemerContract = redeemerFactory.attach(contract.address);

//   return {
//     minter,
//     redeemer,
//     contract,
//     redeemerContract,
//   };
// }
