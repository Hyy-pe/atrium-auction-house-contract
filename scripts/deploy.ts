// @ts-ignore
import { ethers } from "hardhat";
import fs from "fs-extra";
import { AuctionHouse } from "../typechain";

async function main() {
  const args = require("minimist")(process.argv.slice(2));

  if (!args.chainId) {
    throw new Error("--chainId chain ID is required");
  }
  await require("dotenv").config();
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.RPC_ENDPOINT
  );
  const wallet = new ethers.Wallet(`0x${process.env.PRIVATE_KEY}`, provider);
  const addressPath = `${process.cwd()}/addresses/${args.chainId}.json`;

  // @ts-ignore
  const addressBook = JSON.parse(await fs.readFileSync(addressPath));

  if (!addressBook.weth) {
    throw new Error("Missing WETH address in address book.");
  }
  if (!addressBook.media) {
    throw new Error("Missing Media address in protocol address book.");
  }
  if (addressBook.auctionHouse) {
    throw new Error(
      "auctionHouse already in address book, it must be moved before deploying."
    );
  }

  // We get the contract to deploy
  const AuctionHouse = (await ethers.getContractFactory(
    "AuctionHouse",
    wallet
  )) as AuctionHouse;

  console.log(
    `Deploying Auction House from deployment address ${wallet.address}...`
  );
  const impl = await AuctionHouse.deploy(
    addressBook.media,
    addressBook.weth
  );
  console.log(
    `Auction House deploying to ${impl.address}. Awaiting confirmation...`
  );
  await impl.deployed();
  addressBook.auctionHouse = impl.address;
  await fs.writeFile(addressPath, JSON.stringify(addressBook, null, 2));

  console.log("Auction House contracts deployed 📿");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
