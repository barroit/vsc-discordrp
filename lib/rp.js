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

function rp_paused()
{
	return +existsSync(`${runtime_dir}/paused`)
}

export function rp_pause()
{
	touch(`${runtime_dir}/paused`)
}

export function rp_disabled(ctx)
{
	return +!!ctx.ws_state.get('rp_disabled')
}

export function rp_disable()
{
	ctx.ws_state.set('rp_disabled', 1)
}

export function rp_running()
{
	return +existsSync(`${runtime_dir}/running`)
}

export function rp_mark_running()
{
	touch(`${runtime_dir}/running`)
}

export function rp_resolve(rp)
{
	const as = rp.asssets
	const ts = rp.timestamps

	rp.name = 'Tetoteteto'

	rp.state = 'Reviewing patches'
	rp.state_url = 'https://example.com/session/7c0f6d95-6f5d-4fd3-9c51-4d6b8c72a101'

	rp.details = 'linux.git | rebase in progress'
	rp.details_url = 'https://example.com/branch/topic/rpc-cleanup'

	as.large_image = 'kernel_tree'
	as.large_text = 'klinux.git'
	as.large_url = 'https://example.com/repos/linux'

	as.small_image = 'clang'
	as.small_text = 'Clang 19'
	as.small_url = 'https://example.com/toolchains/clang-19'

	ts.start = NOW
}
