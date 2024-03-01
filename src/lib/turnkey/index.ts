export { createServerClient, createAPIKeyStamper } from "./server"
export {
  registerPassKey,
  createBrowserClient,
  createWebauthnStamper,
} from "./browser"

const ETHEREUM_WALLET_DEFAULT_PATH = "m/44'/60'/0'/0/0"
const DEFAULT_WALLET_NAME = "Default Wallet"
const DEFAULT_USER_NAME = "Satoshi"

