/* SPDX-License-Identifier: GPL-3.0-or-later */
/*
 * Copyright 2026 Jiamu Sun <39@barroit.sh>
 */

import { existsSync, openSync, closeSync } from 'node:fs'

import { runtime_dir } from '../entry.js'

function touch(name)
{
	const fd = openSync(name, 'a')

	closeSync(fd)
}

function rp_enabled_tmp()
{
	return +!existsSync(`${runtime_dir}/disabled`)
}

export function rp_mark_disabled_tmp()
{
	touch(`${runtime_dir}/disabled`)
}

export function rp_enabled(ctx)
{
	if (!rp_enabled_tmp())
		return 0

	return +!ctx.ws_state.get('rp_disabled')
}

export function rp_mark_disabled()
{
	ctx.ws_state.set('rp_disabled', 0)
}

export function rp_running()
{
	return +!existsSync(`${runtime_dir}/running`)
}

export function rp_mark_running()
{
	touch(`${runtime_dir}/running`)
}
