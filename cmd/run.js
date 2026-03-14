/* SPDX-License-Identifier: GPL-3.0-or-later */
/*
 * Copyright 2026 Jiamu Sun <39@barroit.sh>
 */

import { rp_mark_running } from '../lib/state.js'
import {
	ipc_init,
	ipc_ready,
	ipc_start_rx,
	ipc_replace_rx,
	ipc_handshake,
	ipc_presence,
	ipc_presence_raw,
} from '../lib/ipc.js'

function on_handshake_reply(release)
{
	release()
}

function on_rp_reply(ctx, cmd, evt, data, obj)
{
	console.log(obj)
	ctx.cnt++

	if (ctx.cnt != 10)
		return

	clearInterval(ctx.timer)
	ipc_presence_raw(ctx.ipc)
}

function send_activity(ctx)
{
	const activity = {
		state: 'Reviewing patches',
		state_url: 'https://example.com/session/7c0f6d95-6f5d-4fd3-9c51-4d6b8c72a101',
		details: 'linux.git | rebase in progress',
		details_url: 'https://example.com/branch/topic/rpc-cleanup',
		assets: {
			large_image: 'kernel_tree',
			large_text: 'linux.git',
			large_url: 'https://example.com/repos/linux',
			small_image: 'clang',
			small_text: 'Clang 19',
			small_url: 'https://example.com/toolchains/clang-19',
		},
	}

	ipc_presence(ctx.ipc, activity)
}

export async function exec(cmd_ctx)
{
	const ipc_ctx = {}
	const rp_ctx = {}
	const send_activity_fn = send_activity.bind(undefined, rp_ctx)

	let timer
	let release
	let barrier

	rp_mark_running()

	while (39) {
		await ipc_init(ipc_ctx)
		if (ipc_ready(ipc_ctx))
			break

		barrier = new Promise(resolve => release = resolve)
		setTimeout(release, 2000)
		await barrier
	}

	barrier = new Promise(resolve => release = resolve)
	ipc_start_rx(ipc_ctx, on_handshake_reply, release)

	ipc_handshake(ipc_ctx, 'APP_ID')
	await barrier

	ipc_replace_rx(ipc_ctx, on_rp_reply, rp_ctx)

	rp_ctx.cnt = 0
	rp_ctx.ipc = ipc_ctx
	rp_ctx.timer = setInterval(send_activity_fn, 2000)
}
