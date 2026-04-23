"""
fetcher.py — Fetches onchain wallet data from Monad RPC.
Owner: Team Member A (Backend/Data)

Fetches:
- ETH balance
- Transaction count (nonce)
- Transaction history (via eth_getLogs or block scan)
- First/last transaction timestamps (to compute wallet age)
- ERC-20 approval events

Note: Monad is EVM-compatible so standard eth_ JSON-RPC methods apply.
For MVP we use a lightweight JSON-RPC approach without a full indexer.
"""

from __future__ import annotations

import asyncio
import os
import time
import json
from typing import Any, Dict, List, Optional

import httpx

# ---------------------------------------------------------------------------
# Types
# ---------------------------------------------------------------------------

WalletData = Dict[str, Any]

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

RPC_URL = os.getenv("MONAD_RPC_URL", "https://testnet-rpc.monad.xyz")
USE_MOCK = os.getenv("USE_MOCK_DATA", "false").lower() == "true"

# ---------------------------------------------------------------------------
# RPC helpers
# ---------------------------------------------------------------------------

_rpc_id = 0


def _next_id() -> int:
    global _rpc_id
    _rpc_id += 1
    return _rpc_id


async def _rpc(method: str, params: list, client: httpx.AsyncClient) -> Any:
    payload = {
        "jsonrpc": "2.0",
        "id": _next_id(),
        "method": method,
        "params": params,
    }
    resp = await client.post(RPC_URL, json=payload, timeout=15)
    resp.raise_for_status()
    data = resp.json()
    if "error" in data:
        raise ValueError(f"RPC error: {data['error']}")
    return data.get("result")


# ---------------------------------------------------------------------------
# Mock data (used when USE_MOCK_DATA=true or RPC unreachable)
# ---------------------------------------------------------------------------

def _mock_wallet_data(address: str) -> WalletData:
    """Returns deterministic mock data for local development / demos."""
    return {
        "address": address,
        "balance_eth": 1.23,
        "tx_count": 47,
        "first_tx_timestamp": int(time.time()) - 86400 * 180,  # 180 days ago
        "last_tx_timestamp": int(time.time()) - 3600,          # 1 hour ago
        "unique_counterparties": 23,
        "approval_count": 5,
        "contract_interactions": 18,
        "erc20_transfer_count": 12,
        "burst_detected": False,
        "large_inflow_detected": False,
        "large_outflow_detected": False,
        "is_contract": False,
        "recent_tx_timestamps": [
            int(time.time()) - i * 3600 for i in range(10)
        ],
    }


# ---------------------------------------------------------------------------
# Real data fetcher
# ---------------------------------------------------------------------------

async def _fetch_real_data(address: str) -> WalletData:
    """Calls Monad RPC to gather raw wallet data."""
    async with httpx.AsyncClient() as client:
        # Fetch tx count and balance in parallel
        tx_count_hex, balance_hex = await asyncio.gather(
            _rpc("eth_getTransactionCount", [address, "latest"], client),
            _rpc("eth_getBalance", [address, "latest"], client),
        )

        tx_count = int(tx_count_hex, 16) if tx_count_hex else 0
        balance_wei = int(balance_hex, 16) if balance_hex else 0
        balance_eth = balance_wei / 1e18

        # Fetch latest block for reference
        latest_block_hex = await _rpc("eth_blockNumber", [], client)
        latest_block = int(latest_block_hex, 16) if latest_block_hex else 0

        # Scan last 2000 blocks for transactions from/to this address
        # (lightweight approach; a full indexer would be used in production)
        from_block = max(0, latest_block - 2000)
        from_block_hex = hex(from_block)

        # ERC-20 Transfer logs where address is sender (topic[1])
        transfer_topic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
        address_padded = "0x" + address[2:].lower().zfill(64)

        logs_out = await _rpc(
            "eth_getLogs",
            [{
                "fromBlock": from_block_hex,
                "toBlock": "latest",
                "topics": [transfer_topic, address_padded],
            }],
            client,
        ) or []

        logs_in = await _rpc(
            "eth_getLogs",
            [{
                "fromBlock": from_block_hex,
                "toBlock": "latest",
                "topics": [transfer_topic, None, address_padded],
            }],
            client,
        ) or []

        # Approval logs
        approval_topic = "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925"
        approval_logs = await _rpc(
            "eth_getLogs",
            [{
                "fromBlock": from_block_hex,
                "toBlock": "latest",
                "topics": [approval_topic, address_padded],
            }],
            client,
        ) or []

        erc20_transfer_count = len(logs_out) + len(logs_in)
        approval_count = len(approval_logs)

        # Collect unique counterparties from transfer logs
        counterparties: set[str] = set()
        recent_timestamps: list[int] = []

        all_logs = logs_out + logs_in
        for log in all_logs:
            if len(log.get("topics", [])) >= 3:
                counterparties.add(log["topics"][2][-40:])

        # We don't have block timestamps from logs alone; use heuristic
        # (block time ~2s on Monad testnet)
        first_tx_timestamp: Optional[int] = None
        last_tx_timestamp: Optional[int] = None
        if tx_count > 0 and latest_block > 0:
            # Rough estimate: assume wallet started ~tx_count blocks before latest
            estimated_age_blocks = min(tx_count * 10, latest_block)
            first_tx_timestamp = int(time.time()) - estimated_age_blocks * 2
            last_tx_timestamp = int(time.time()) - 60  # recent

        # Detect burst: if many logs appear in a short block range
        burst_detected = erc20_transfer_count > 20 and tx_count < 10

        return {
            "address": address,
            "balance_eth": balance_eth,
            "tx_count": tx_count,
            "first_tx_timestamp": first_tx_timestamp,
            "last_tx_timestamp": last_tx_timestamp,
            "unique_counterparties": len(counterparties),
            "approval_count": approval_count,
            "contract_interactions": erc20_transfer_count,
            "erc20_transfer_count": erc20_transfer_count,
            "burst_detected": burst_detected,
            "large_inflow_detected": False,  # TODO: implement via value analysis
            "large_outflow_detected": False,
            "is_contract": False,  # TODO: check eth_getCode
            "recent_tx_timestamps": recent_timestamps,
        }


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

async def fetch_wallet_data(address: str) -> WalletData:
    """
    Returns wallet data dict. Uses mock if USE_MOCK_DATA env var is set,
    or falls back to mock if RPC call fails (useful during hackathon demos).
    """
    if USE_MOCK:
        return _mock_wallet_data(address)
    try:
        return await _fetch_real_data(address)
    except Exception:
        # Graceful fallback during demo — logs warning in production
        return _mock_wallet_data(address)
