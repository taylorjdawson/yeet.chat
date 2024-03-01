import { UUID } from "node:crypto"
import { TurnkeyClient } from "@turnkey/http"
import { EIP1193Provider, ProviderRpcError, RpcRequestError } from "viem"
import { getHttpRpcClient } from "viem/utils"

// function createProviderRpcError(code, message) {
//   return new ProviderRpcError(new Error(message), {
//     code: code,
//     shortMessage: message,
//   })
// }

// throw new ProviderRpcError(
//     new Error("Token type ERC721 not supported."),
//     {
//       code: -32602, // Assuming -32602 is an appropriate code for your use case
//       shortMessage: "Token type ERC721 not supported.",
//     }
//   )

// export const provider =  createEIP1193Provider(window.ethereum)

export const createEIP1193Provider = (
  rpcUrl: string,
  // Partial user
  user: { wallet: UUID; orgId: UUID },
  turnkeyClient: TurnkeyClient
) => {
  let id = 0
  return {
    on: (message, listener) => {},
    removeListener: () => null,
    request: async ({ method, params }) => {
      switch (method) {
        /**
         * Returns a list of addresses owned by the client.
         * @Questions:
         *  - Need to determine if we should list all addresses from all wallets of the user?
         *  - When connecting a 'wallet' and using this provider, should we only return the
         *  addresses of the connected wallet? Or should we return all addresses of the user?
         * Assuming the above for now we could iterate over all
         * the wallets and return all the addresses associated with the user's account
         * /public/v1/query/list_wallet_accounts
         * /public/v1/query/list_wallets
         * @returns {Promise<Address[]>} An array of addresses owned by the client.
         */
        case "eth_accounts":
          // Logic to handle eth_accounts
          return ["0x0fB69..."] // Placeholder return

        /**
         * Requests that the user provide an Ethereum address to be identified by.
         * This method is specified by [EIP-1102](https://eips.ethereum.org/EIPS/eip-1102)
         * @returns {Promise<Address[]>} An array of addresses after user authorization.
         */
        case "eth_requestAccounts":
          // Logic to handle eth_requestAccounts
          return ["0x...", "0x..."] // Placeholder return

        case "eth_sendTransaction":
          // Logic to handle eth_sendTransaction
          return "0x..." // Placeholder return

        case "eth_sendRawTransaction":
          // Logic to handle eth_sendRawTransaction
          return "0x..." // Placeholder return

        case "eth_sign":
          // Logic to handle eth_sign
          return "0x..." // Placeholder return

        case "eth_signTransaction":
          // Logic to handle eth_signTransaction
          return "0x..." // Placeholder return

        case "eth_signTypedData_v4":
          // Logic to handle eth_signTypedData_v4
          return "0x..." // Placeholder return

        case "eth_syncing":
          // Logic to handle eth_syncing
          return false // Placeholder return

        case "personal_sign":
          // Logic to handle personal_sign
          return "0x..." // Placeholder return

        case "wallet_addEthereumChain":
          // Logic to handle wallet_addEthereumChain
          return null // Placeholder return

        case "wallet_getPermissions":
          // Logic to handle wallet_getPermissions
          return [] // Placeholder return

        case "wallet_requestPermissions":
          // Logic to handle wallet_requestPermissions
          return [] // Placeholder return

        case "wallet_switchEthereumChain":
          // Logic to handle wallet_switchEthereumChain
          return null // Placeholder return

        case "wallet_watchAsset":
          // Logic to handle wallet_watchAsset
          return true // Placeholder return

        default:
          const rpcClient = getHttpRpcClient(rpcUrl)

          const { error, result } = await rpcClient.request({
            body: {
              method,
              params,
              id: id++,
            },
          })
          if (error)
            throw new RpcRequestError({
              body: { method, params },
              error,
              url: rpcUrl,
            })
          return result
      }
    },
  } satisfies EIP1193Provider
}
