/* SPDX-License-Identifier: GPL-3.0-or-later */
/*
 * Copyright 2026 Jiamu Sun <39@barroit.sh>
 */

import { vsc_resolve_config, vsc_add_cmd } from './lib/vsc.js'

const cmds = [
	[ 'enable',      import('./cmd/enable.js')      ],
	[ 'disable',     import('./cmd/disable.js')     ],
	[ 'disable-tmp', import('./cmd/disable-tmp.js') ],
]

function resolve_format()
{
	return vsc_resolve_config('discordrp')
}

async function register_cmd(ctx, [ id, __module ])
{
	const module = await __module

	const cmd_ctx = vsc_map_ctx(ctx)
	const exec = vsc_add_cmd(`discordrp.${id}`, module.exec)

	cmd_ctx.resolve_format = resolve_format
	ctx.subscriptions.push(exec)
}

export async function activate(ctx)
{
	const register_cmd_fn = register_cmd.bind(undefined, ctx)

	cmds.forEach(register_cmd_fn)
}
