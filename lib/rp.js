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
import { isDeepStrictEqual } from 'node:util'

import { runtime_dir } from '../entry.js'
import {
	git_inside_worktree,
	git_resolve_remote,
	git_guess_remote,
	git_resolve_remote_url,
	git_resolve_head,
	git_verify_ref,
	git_dir,
	git_rebase_backend,
	git_rebase_step_merge,
	git_rebase_step_apply,
} from './git.js'
import { vsc_current_editor, vsc_relative_path } from './vsc.js'

function touch(name)
{
	const fd = openSync(name, 'a')

	closeSync(fd)
}

function rp_paused()
{
	return +existsSync(`${runtime_dir}/paused`)
}

export function rp_mark_paused()
{
	touch(`${runtime_dir}/paused`)
}

export function rp_disabled(ctx)
{
	return +!!ctx.ws_state.get('rp_disabled')
}

export function rp_mark_disabled()
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
	let rebase
	let git

	ref = git_resolve_head()
	git = git_dir()

	if (ref && git_verify_ref(ref))
		state = BRANCH
	else if (ref)
		state = UNBORN
	else if (rebase = git_rebase_backend(git))
		state = REBASE
	else
		state = DETACH

	if (state == BRANCH)
		branch = last_segment(ref)

	if (branch)
		remote = git_resolve_remote(branch)
	else
		remote = git_guess_remote()

	if (remote)
		remote_url = git_resolve_remote_url(remote)

	if (remote_url)
		rp.details = last_segment(remote_url)
	else
		rp.details = 'no repo'

	rp.details += ' | '

	switch (state) {
	case BRANCH:
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

	rp.__git = git
	rp.__state = state
	rp.__rebase = rebase
}

function resolve_rebase_step(rp)
{
	let steps

	if (rp.__rebase == GIT_REBASE_MERGE)
		steps = git_rebase_step_merge(rp.__git)
	else
		steps = git_rebase_step_apply(rp.__git)

	rp.party = { id: 'miku', size: steps }
	rp.state = 'processing commit'

	if (steps[1] > 1)
		rp.state += 's'

	rp.assets.large_image = 'DEVICON/git/git-original.png'
}

function resolve_edit_state(rp)
{
	const line = rp.__editor.selection.active.line + 1
	const file = vsc_relative_path(rp.__editor.document.uri, 0)
	const lang = rp.__editor.document.languageId

	rp.state = `at ${file}:${line}`
	rp.assets.large_image = `DEVICON/${lang}/${lang}-original.png`

	if (lang == 'plaintext')
		rp.assets.large_image = 'DEVICON/vscode/vscode-original.png'
}

function resolve_default_state(rp)
{
	rp.assets.large_image = 'DEVICON/vscode/vscode-original.png'
}

function sanitize_rp(rp)
{
	const entries = Object.entries(rp)
	const fields = entries.filter(([ k ]) => !k.startsWith('__'))

	return Object.fromEntries(fields)
}

export function rp_resolve(rp)
{
	let rp_clean = sanitize_rp(rp)
	const prev = structuredClone(rp_clean)

	delete rp.party

	if (git_inside_worktree())
		resolve_repo_detail(rp)

	rp.__editor = vsc_current_editor()

	if (rp.__state == REBASE)
		resolve_rebase_step(rp)
	else if (rp.__editor)
		resolve_edit_state(rp)
	else
		resolve_default_state(rp)

	rp_clean = sanitize_rp(rp)
	return !isDeepStrictEqual(prev, rp_clean)
}
