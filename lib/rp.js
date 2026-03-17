/* SPDX-License-Identifier: GPL-3.0-or-later */
/*
 * Copyright 2026 Jiamu Sun <39@barroit.sh>
 */
divert(-1)

define(UNBORN, 0)
define(REBASE, 1)
define(DETACH, 2)
define(BRANCH, 3)

divert(0)dnl

import { existsSync, openSync, closeSync } from 'node:fs'

import { runtime_dir } from '../entry.js'
import {
	git_inside_worktree,
	git_resolve_remote,
	git_guess_remote,
	git_resolve_remote_url,
	git_resolve_head,
	git_verify_ref,
	git_in_rebase,
} from './git.js'

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

function last_segment(path)
{
	return path.slice(path.lastIndexOf('/') + 1)
}

function resolve_repo_detail(rp)
{
	let ref
	let branch
	let state
	let remote
	let remote_url
	let repo

	ref = git_resolve_head()

	if (ref && git_verify_ref(ref))
		state = BRANCH
	else if (ref)
		state = UNBORN
	else if (git_in_rebase())
		state = REBASE
	else
		state = DETACH

	if (state == BRANCH)
		remote = git_resolve_remote(branch)
	else
		remote = git_guess_remote()

	if (remote) {
		remote_url = git_resolve_remote_url(remote)

		if (remote_url)
			rp.details = last_segment(remote_url)
		else
			rp.details = 'no repo'
	}

	rp.details += ' | '

	switch (state) {
	case BRANCH:
		branch = last_segment(ref)
		rp.details += `on ${branch}`
		break
	case UNBORN:
		rp.details += 'unborn branch'
		break
	case REBASE:
		rp.details += 'rebase in progress'
		break
	case DETACH:
		rp.details += 'HEAD detached'
	}
}

export function rp_resolve(rp)
{
	const as = rp.assets
	const ts = rp.timestamps

	rp.name = 'vscode'

	if (git_inside_worktree())
		resolve_repo_detail(rp)

	// as.large_image = 'kernel_tree'
	// as.large_text = 'klinux.git'
	// as.large_url = 'https://example.com/repos/linux'

	// as.small_image = 'clang'
	// as.small_text = 'Clang 19'
	// as.small_url = 'https://example.com/toolchains/clang-19'

	// rp.party = { id: 'miku', size: [ 1, 17 ] }
}
