/* SPDX-License-Identifier: GPL-3.0-or-later */
/*
 * Copyright 2026 Jiamu Sun <39@barroit.sh>
 */

import { rp_running, rp_mark_paused } from '../lib/rp.js'

export function exec(ctx)
{
	rp_mark_paused()

	if (rp_running())
		ctx.ctrl.pause_rp()
}
