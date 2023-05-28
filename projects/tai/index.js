const sdk = require("@defillama/sdk");
const BigNumber = require("bignumber.js");

const COIN_JOINS = [
  {
    name: "ETH-A",
    address: "0xF6c35af06eD2D97f62b31D7030370F8AE33bD3b1",
  },
  {
    name: "ETH-B",
    address: "0xa822e24f944127f445d8aD30aDCDDD721a5616e9",
  },
  {
    name: "ETH-C",
    address: "0x793A0de4db6F96Cf30d371ef28278496B66223f8",
  },
  {
    name: "WSTETH-A",
    address: "0x5D527C9641EfFeb3802f2FfAFdd15a1B95E41C8c",
  },
  {
    name: "WSTETH-B",
    address: "0x9E240dAf92dD0edF903def1fF1dD036CA447aaf7",
  },
  {
    name: "RETH-A",
    address: "0xF4E8267F05cf1EaD340AC7f2bfF343528526f16B",
  },
  {
    name: "RETH-B",
    address: "0x7daeDd26e1202897C9C6BF3967fB5aE45616aEf5",
  },
  {
    name: "RAI-A",
    address: "0x67b97De3F10AD081fBDDf36099699D5AB488828e",
  },
  {
    name: "CBETH-A",
    address: "0x10FF8D4376798f920FAe147f109157Fa6B9A985B",
  },
  {
    name: "CBETH-B",
    address: "0xB4941D2a62421AdC6cE939cB466F884535bFBfF9",
  }
]

const getCoinJoinsData = async (block) => {
  const { output: collaterals } = await sdk.api.abi.multiCall({
    block, 
    abi: "function collateral() view returns (address)",
    calls: COIN_JOINS.map(cj => ({ target: cj.address })),
  });

  const { output: contractEnabled } = await sdk.api.abi.multiCall({
    block, 
    abi: "function contractEnabled() view returns (bool)",
    calls: COIN_JOINS.map(cj => ({ target: cj.address })),
  });

  return COIN_JOINS.map(cj => {
    const collateral = collaterals.find(el => el.input.target === cj.address);
    const enabled = contractEnabled.find(el => el.input.target === cj.address);

    return {
      ...cj,
      collateral: collateral.output,
      enabled: enabled.output,
    };
  });
}

async function tvl(timestamp, block) {
  const coinJoins = await getCoinJoinsData(block);

  const { output: balances } = await sdk.api.abi.multiCall({
    block, 
    abi: 'erc20:balanceOf',
    calls: coinJoins.map(c => ({ target: c.collateral, params: [c.address] })),
  });

  let tvlResult = {};
  balances.forEach(el => {
    const erc20Token = el.input.target;

    const balance = new BigNumber(tvlResult?.[erc20Token] || 0);

    tvlResult[erc20Token] = balance.plus(new BigNumber(el.output));
  });

  return tvlResult;
}

module.exports = {
  start: 1683944280,
  timetravel: true,
  methodology: 'Counts ERC20 deposited for each collateral type',
  ethereum: { tvl },
};
