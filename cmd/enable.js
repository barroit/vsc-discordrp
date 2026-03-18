/* SPDX-License-Identifier: GPL-3.0-or-later */
/*
 * Copyright 2026 Jiamu Sun <39@barroit.sh>
 */

import { rp_enable } from '../lib/rp.js'
import { vsc_exec_cmd } from '../lib/vsc.js'

export async function exec(ctx)
{
	rp_enable(ctx)

	await vsc_exec_cmd('CMD_RUN')
	vsc_exec_cmd('CMD_RESUME')
}
