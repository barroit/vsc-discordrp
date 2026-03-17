/* SPDX-License-Identifier: GPL-3.0-or-later */
/*
 * Copyright 2026 Jiamu Sun <39@barroit.sh>
 */

import { ipc_presence } from '../lib/ipc.js'
import { rp_mark_paused } from '../lib/rp.js'

export async function exec(ctx)
{
	ipc_ctx.ignore = 1
	ipc_presence(ctx.ipc, undefined, 1)

	rp_mark_paused()
}
