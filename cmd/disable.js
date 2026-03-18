/* SPDX-License-Identifier: GPL-3.0-or-later */
/*
 * Copyright 2026 Jiamu Sun <39@barroit.sh>
 */

import { rp_mark_disabled } from '../lib/rp.js'
import { vsc_exec_cmd } from '../lib/vsc.js'

export function exec(ctx)
{
	rp_mark_disabled(ctx)

	vsc_exec_cmd('CMD_PAUSE')
}
