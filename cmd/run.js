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
import {
	rp_mark_running,
	rp_resolve,
	rp_paused,
	rp_disabled,
} from '../lib/rp.js'
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

function bump_interval(cmd_ctx)
{
	clearInterval(cmd_ctx.timer)
	cmd_ctx.timer = setInterval(cmd_ctx.ctrl.sync_rp, cmd_ctx.conf.interval)
}

function sync_rp(cmd_ctx, ipc_ctx, rp_ctx, force)
{
	let prev_conf
	let skip

	if (ipc_ctx.ignore)
		return

	prev_conf = cmd_ctx.conf
	cmd_ctx.conf = cmd_ctx.resolve_conf()

	if (prev_conf.interval != cmd_ctx.conf.interval)
		bump_interval(cmd_ctx, ipc_ctx, rp_ctx)

	skip = rp_resolve(rp_ctx)
	if (!force && skip)
		return

	ipc_presence(ipc_ctx, rp_ctx)
}

function clean_rp(ipc_ctx)
{
	ipc_presence(ipc_ctx, undefined, 1)
}

function pause_rp(cmd_ctx, ipc_ctx)
{
	ipc_ctx.ignore = 1
	cmd_ctx.ctrl.clean_rp()
}

function resume_rp(cmd_ctx, ipc_ctx)
{
	ipc_ctx.ignore = 0
	cmd_ctx.ctrl.sync_rp(1)
}

function on_focus_move(cmd_ctx, state)
{
	if (rp_paused() || rp_disabled(cmd_ctx))
		return

	if (state.focused)
		cmd_ctx.ctrl.resume_rp()
	else
		cmd_ctx.ctrl.pause_rp()
}

export async function exec(cmd_ctx)
{
	const ipc_ctx = IPC_INIT
	const rp_ctx = RP_INIT
	const on_focus_move_fn = BIND(on_focus_move, cmd_ctx)

	let release
	let barrier
	let hook

	cmd_ctx.ctrl.sync_rp = BIND(sync_rp, cmd_ctx, ipc_ctx, rp_ctx)
	cmd_ctx.ctrl.clean_rp = BIND(clean_rp, ipc_ctx)
	cmd_ctx.ctrl.pause_rp = BIND(pause_rp, cmd_ctx, ipc_ctx)
	cmd_ctx.ctrl.resume_rp = BIND(resume_rp, cmd_ctx, ipc_ctx)

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
	cmd_ctx.timer = setInterval(cmd_ctx.ctrl.sync_rp, cmd_ctx.conf.interval)

	hook = new vsc_disposable(() => clearInterval(cmd_ctx.timer))
	cmd_ctx.cleanup.push(hook)

	hook = vsc_track_window_state(on_focus_move_fn)
	cmd_ctx.cleanup.push(hook)
}
