/* SPDX-License-Identifier: GPL-3.0-or-later */
/*
 * Copyright 2026 Jiamu Sun <39@barroit.sh>
 */

import { rp_running, rp_resume } from '../lib/rp.js'

export function exec(ctx)
{
	rp_resume()

	if (rp_running())
		ctx.ctrl.resume_rp()
}
