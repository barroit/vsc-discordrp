/* SPDX-License-Identifier: GPL-3.0-or-later */
/*
 * Copyright 2026 Jiamu Sun <39@barroit.sh>
 */

import { rp_mark_paused } from '../lib/rp.js'

export async function exec(ctx)
{
	rp_mark_paused()

	ctx.ctrl.pause_rp()
}
