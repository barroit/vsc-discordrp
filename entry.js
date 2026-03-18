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

import cmds from './cmdlist.js'

const runtime_root = tmpdir()
export const runtime_dir = mkdtempSync(`${runtime_root}/discordrp-`)

function resolve_conf()
{
	return vsc_resolve_config('discordrp')
}

async function register_cmd(ctx, [ name, __module ])
{
	const module = await __module
	const cmd_ctx = { ...ctx }

	cmd_ctx.resolve_conf = resolve_conf

	const exec_fn = BIND(module.exec, cmd_ctx)
	const cmd = vsc_add_cmd(name, exec_fn)

	ctx.cleanup.push(cmd)
}

export async function activate(__ctx)
{
	await git_ensure_exec()

	const ctx = vsc_map_ctx(__ctx)
	const register_cmd_fn = BIND(register_cmd, ctx)

	ctx.ctrl = {}
	cmds.forEach(register_cmd_fn)

	if (!rp_disabled(ctx))
		vsc_exec_cmd('CMD_RUN')
}

export function deactivate()
{
	return vsc_exec_cmd('CMD_PAUSE')
}
