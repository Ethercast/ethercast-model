import * as Joi from 'joi';
import BigNumber from 'bignumber.js';

export interface Log {
  logIndex: string;
  blockNumber: string;
  blockHash: string;
  transactionHash: string;
  transactionIndex: string;
  address: string;
  data: string;
  topics: string[];
  removed: boolean;
}

export interface DecodedLog extends Log {
  ethercast: {
    __ethercastEventName: string;
    [parameter: string]: string | number;
  }
}

export interface Transaction {
  hash: string;
  nonce: string;
  blockHash: string;
  blockNumber: string;
  transactionIndex: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  input: string;
}

export interface Block {
  hash: string;
  difficulty: string;
  extraData: string;
  gasLimit: string;
  gasUsed: string;
  logsBloom: string;
  miner: string;
  mixHash: string;
  nonce: string;
  number: string;
  parentHash: string;
  receiptsRoot: string;
  sha3Uncles: string;
  size: string;
  stateRoot: string;
  timestamp: string;
  totalDifficulty: string;
  transactionsRoot: string;
  uncles: string[];
}

export interface TransactionReceipt {
  transactionHash: string; // hex256
  transactionIndex: string; // hex
  blockNumber: string; // hex
  blockHash: string; // hex256
  cumulativeGasUsed: string; // hex
  gasUsed: string; // hex
  from: string; // hex
  to: string; // hex
  contractAddress: string | null; // address
  logs: Log[],
  logsBloom: string // hex
  status: '0x0' | '0x1'; // hex, 0x0 (FAILURE) or 0x1 (SUCCESS)
}

export interface BlockWithTransactionHashes extends Block {
  transactions: string[];
}

export interface BlockWithFullTransactions extends Block {
  transactions: Transaction[];
}

export interface LogFilter {
  topics?: (string | string[])[];
  fromBlock: string | BigNumber | number | 'latest' | 'earliest' | 'pending';
  toBlock: string | BigNumber | number | 'latest' | 'earliest' | 'pending';
  address?: string;
}

const hex = Joi.string().regex(/^0x[0-9A-Fa-f]*$/);
const hex256 = hex.length(66);
const hex160 = hex.length(42);
const hexUint = hex.max(66);

const address = hex160;
const topic = hex256;

export const JoiLog = Joi.object({
  logIndex: hexUint.required(),
  blockNumber: hexUint.required(),
  blockHash: hex256.required(),
  transactionHash: hex256.required(),
  transactionIndex: hexUint.required(),
  address: address.required(),
  data: hex.required(),
  topics: Joi.array().items(topic).min(1).max(4).required(),
  removed: Joi.boolean().required()
});

export const JoiBlock = Joi.object({
  hash: hex256.required(),
  difficulty: hex.required(),
  extraData: hex.required(),
  gasLimit: hex.required(),
  gasUsed: hex.required(),
  logsBloom: hex.required(),
  miner: address.required(),
  mixHash: hex.required(),
  nonce: hex.required(),
  number: hex.required(),
  parentHash: hex256.required(),
  receiptsRoot: hex.required(),
  sha3Uncles: hex256.required(),
  size: hex.required(),
  stateRoot: hex.required(),
  timestamp: hex.required(),
  totalDifficulty: hex.required(),
  transactionsRoot: hex256.required(),
  uncles: Joi.array().items(hex256).required()
});

export const JoiBlockWithTransactionHashes = JoiBlock.keys({
  transactions: Joi.array().items(hex256).required()
});

export const JoiTransaction = Joi.object({
  hash: hex256.required(),
  nonce: hex.required(),
  blockHash: hex256.required(),
  blockNumber: hex.required(),
  transactionIndex: hex.required(),
  from: address.required(),
  to: address.required(),
  value: hex.required(),
  gas: hex.required(),
  gasPrice: hex.required(),
  input: hex.required()
});

export const JoiBlockWithTransactions = JoiBlock.keys({
  transactions: Joi.array().items(JoiTransaction).required()
});

export const JoiTransactionReceipt = Joi.object({
  transactionHash: hex256.required(),
  transactionIndex: hex.required(),
  blockNumber: hex.required(),
  blockHash: hex256.required(),
  cumulativeGasUsed: hex.required(),
  gasUsed: hex.required(),
  logs: Joi.array().items(JoiLog).required(),
  contractAddress: address.allow(null).required(),
  from: address.required(),
  to: Joi.any().when(
    'contractAddress',
    {
      is: null,
      then: address,
      otherwise: Joi.any().valid(null)
    }
  ).required(),
  logsBloom: hex.required(),
  status: Joi.alternatives().valid('0x0', '0x1')
});

export function mustBeValidLog(log: Log): Log {
  return validate(log, JoiLog);
}

export function mustBeValidBlockWithTransactionHashes(block: BlockWithTransactionHashes): BlockWithTransactionHashes {
  return validate(block, JoiBlockWithTransactionHashes);
}

export function mustBeValidBlockWithFullTransactions(block: BlockWithFullTransactions): BlockWithFullTransactions {
  return validate(block, JoiBlockWithTransactions);
}

export function mustBeValidTransaction(transaction: Transaction): Transaction {
  return validate(transaction, JoiTransaction);
}

export function mustBeValidTransactionReceipt(transactionReceipt: TransactionReceipt): TransactionReceipt {
  return validate(transactionReceipt, JoiTransactionReceipt);
}

export function validate<T>(item: T, schema: Joi.Schema): T {
  const { error, value } = schema.validate(item, { allowUnknown: false, convert: false });

  if (error && error.details && error.details.length > 0) {
    throw new Error('schema validation failed: ' + error.message);
  }

  return value;
}
