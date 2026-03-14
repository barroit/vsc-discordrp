/* SPDX-License-Identifier: GPL-3.0-or-later */
/*
 * Copyright 2026 Jiamu Sun <39@barroit.sh>
 */

import {
	ipc_init,
	ipc_ready,
	ipc_start_rx,
	ipc_replace_rx,
	ipc_handshake,
	ipc_presence,
} from '../lib/ipc.js'
import { rp_mark_running, rp_resolve } from '../lib/rp.js'
import { vsc_track_window_state } from '../lib/vsc.js'

function on_handshake_reply(release)
{
	release()
}

function on_rp_reply(_, __, evt, data)
{
	if (evt == 'ERROR')
		console.error('on_rp_reply()', data)
}

function on_window_change(nofity, state)
{
	if (state.focused)
		nofity()
}

export async function exec(cmd_ctx)
{
	const ipc_ctx = cmd_ctx.ipc
	const rp_ctx = RP_INIT
	const nofity = ipc_presence.bind(undefined, ipc_ctx, rp_ctx)
	const on_window_change_fn = on_window_change.bind(undefined, nofity)

	let timer
	let release
	let barrier
	let hook

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
	rp_resolve(rp_ctx)

	hook = vsc_track_window_state(on_window_change_fn)
	cmd_ctx.cleanup.push(hook)
}
