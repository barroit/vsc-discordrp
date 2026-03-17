#!/usr/bin/env bun
// SPDX-License-Identifier: GPL-3.0-or-later

import {
	fileIcons as __file_icons,
} from '../material-icon/src/core/icons/fileIcons.ts'
import {
	languageIcons as language_icons,
} from '../material-icon/src/core/icons/languageIcons.ts'

const file_icons = __file_icons.icons

const map = {}

for (const { name, ids } of language_icons) {
	for (const id of ids)
		map[id] = name
}

for (const { name, fileNames: files, fileExtensions: exts } of file_icons) {
	if (files) {
		for (const file of files)
			map[file] = name
	}

	if (exts) {
		for (const ext of exts)
			map[ext] = name
	}
}

console.log(JSON.stringify(map, undefined, 3))
