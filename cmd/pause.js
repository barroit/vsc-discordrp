/* SPDX-License-Identifier: GPL-3.0-or-later */
/*
 * Copyright 2026 Jiamu Sun <39@barroit.sh>
 */

import { ipc_presence } from '../lib/ipc.js'
import { rp_pause } from '../lib/rp.js'

export async function exec(ctx)
{
	ipc_presence(ctx.ipc)
	rp_pause()
}
