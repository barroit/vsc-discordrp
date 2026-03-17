/* SPDX-License-Identifier: GPL-3.0-or-later */
/*
 * Copyright 2026 Jiamu Sun <39@barroit.sh>
 */

import { rp_resume } from '../lib/rp.js'

export async function exec(ctx)
{
	rp_resume()

	ctx.ctrl.resume_rp()
}
