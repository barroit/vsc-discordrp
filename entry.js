/* SPDX-License-Identifier: GPL-3.0-or-later */
/*
 * Copyright 2026 Jiamu Sun <39@barroit.sh>
 */

import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'

import { git_ensure_exec } from './lib/git.js'
import { rp_disabled } from './lib/rp.js'
import {
	vsc_resolve_config,
	vsc_map_ctx,
	vsc_add_cmd,
	vsc_exec_cmd,
} from './lib/vsc.js'

const cmds = [
	[ 'enable',  import('./cmd/enable.js')  ],
	[ 'disable', import('./cmd/disable.js') ],
	[ 'disable-global', import('./cmd/disable-global.js') ],

	[ 'pause',  import('./cmd/pause.js') ],
	[ 'resume', import('./cmd/resume.js') ],

	[ 'run',  import('./cmd/run.js')  ],
	[ 'stop', import('./cmd/stop.js') ],
]

const runtime_root = tmpdir()
export const runtime_dir = mkdtempSync(`${runtime_root}/discordrp-`)

function resolve_format()
{
	return vsc_resolve_config('discordrp')
}

async function register_cmd(ctx, [ id, __module ])
{
	const module = await __module
	const cmd_ctx = { ...ctx }

	cmd_ctx.resolve_format = resolve_format

	const exec_fn = BIND(module.exec, cmd_ctx)
	const cmd = vsc_add_cmd(`discordrp.${id}`, exec_fn)

	ctx.cleanup.push(cmd)
}

export async function activate(__ctx)
{
	await git_ensure_exec()

	const ctx = vsc_map_ctx(__ctx)
	const ipc_ctx = IPC_INIT
	const register_cmd_fn = BIND(register_cmd, ctx)

	ctx.ipc = ipc_ctx
	cmds.forEach(register_cmd_fn)

	if (!rp_disabled(ctx))
		vsc_exec_cmd('discordrp.run')
}

export function deactivate()
{
	return vsc_exec_cmd('discordrp.pause')
}
