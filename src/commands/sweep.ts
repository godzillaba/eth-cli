import { Command } from '@commander-js/extra-typings'
import { BigNumber, providers, Wallet } from 'ethers'
import { formatEther } from 'ethers/lib/utils'
import { log } from '../utils/logger.ts'
import { assertDefined } from '../utils/misc.ts'

export function sweepCommand(program: Command) {
  program
    .command('sweep')
    .description('Sweep all ETH out of an account')
    .argument('<TO>', 'Recipient address')
    .option('-r, --rpc-url <RPC_URL>', 'RPC URL')
    .option(
      '-k, --key <KEY>',
      'Private key of the account to sweep. If not given, $PRIVATE_KEY will be used'
    )
    .action(async (to, options) => {
      const provider = new providers.JsonRpcProvider(
        assertDefined(options.rpcUrl, 'RPC URL is required')
      )
      const wallet = new Wallet(
        assertDefined(
          options.key || process.env.PRIVATE_KEY,
          'Private key is required'
        ),
        provider
      )

      const balance = await provider.getBalance(wallet.address)
      log.info(`Balance of ${wallet.address}: ${formatEther(balance)} ETH`)

      const gasLimit = await provider.estimateGas({ from: wallet.address, to })
      const baseFee = (await provider.getBlock('latest')).baseFeePerGas

      let feePerGas: BigNumber
      if (baseFee) {
        const tip = BigNumber.from(
          await provider.send('eth_maxPriorityFeePerGas', [])
        )
        // bid the worst-case next-block base fee plus tip. Priority fee is set
        // equal to the bid so the effective gas price is exactly the bid,
        // leaving the account at exactly zero. Chains that refund the excess
        // (e.g. Arbitrum) leave a little dust instead.
        feePerGas = baseFee.mul(9).div(8).add(tip)
      } else {
        feePerGas = await provider.getGasPrice()
      }

      const fee = feePerGas.mul(gasLimit)
      if (balance.lte(fee)) {
        log.error(`Balance cannot cover the ${formatEther(fee)} ETH fee`)
        process.exit(1)
      }

      const value = balance.sub(fee)
      const tx = await wallet.sendTransaction({
        to,
        value,
        gasLimit,
        ...(baseFee
          ? { maxFeePerGas: feePerGas, maxPriorityFeePerGas: feePerGas }
          : { gasPrice: feePerGas }),
      })
      log.info(`Sweeping ${formatEther(value)} ETH to ${to}: ${tx.hash}`)
      await tx.wait()

      const remaining = await provider.getBalance(wallet.address)
      if (remaining.isZero()) log.success('Swept, balance is now 0')
      else log.warning(`Swept, dust remaining: ${formatEther(remaining)} ETH`)
    })
}
