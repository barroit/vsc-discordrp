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
import { vsc_track_window_state, vsc_disposable } from '../lib/vsc.js'

function on_handshake_reply(release)
{
	release()
}

function on_rp_reply(_, __, evt, data)
{
	if (evt == 'ERROR')
		console.error('on_rp_reply()', data)
}

function on_window_change(ipc_ctx, rp_ctx, state)
{
	if (state.focused) {
		ipc_ctx.ignore = 0
		ipc_presence(ipc_ctx, rp_ctx)
	} else {
		ipc_ctx.ignore = 1
		ipc_presence(ipc_ctx, undefined, 1)
	}
}

function bump_interval(cmd_ctx, ipc_ctx, rp_ctx)
{
	const on_interval_fn = BIND(on_interval, cmd_ctx, ipc_ctx, rp_ctx)

	clearInterval(cmd_ctx.timer)
	cmd_ctx.timer = setInterval(on_interval_fn, cmd_ctx.conf.interval)
}

function on_interval(cmd_ctx, ipc_ctx, rp_ctx)
{
	let prev_conf

	if (ipc_ctx.ignore)
		return

	prev_conf = cmd_ctx.conf
	cmd_ctx.conf = cmd_ctx.resolve_conf()

	if (prev_conf.interval != cmd_ctx.conf.interval)
		bump_interval(cmd_ctx, ipc_ctx, rp_ctx)

	if (!rp_resolve(rp_ctx))
		return

	ipc_presence(ipc_ctx, rp_ctx)
}

export async function exec(cmd_ctx)
{
	const ipc_ctx = cmd_ctx.ipc
	const rp_ctx = RP_INIT
	const on_window_change_fn = BIND(on_window_change, ipc_ctx, rp_ctx)
	const on_interval_fn = BIND(on_interval, cmd_ctx, ipc_ctx, rp_ctx)

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

	cmd_ctx.conf = cmd_ctx.resolve_conf()
	cmd_ctx.timer = setInterval(on_interval_fn, cmd_ctx.conf.interval)

	hook = new vsc_disposable(() => clearInterval(cmd_ctx.timer))
	cmd_ctx.cleanup.push(hook)

	hook = vsc_track_window_state(on_window_change_fn)
	cmd_ctx.cleanup.push(hook)
}
