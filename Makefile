# SPDX-License-Identifier: GPL-3.0-or-later

name := discordrp

pnpm ?= pnpm
pnpm += install
pnpm-d := $(pnpm) -D

m4 ?= m4
m4 := printf '%s\n%s' 'changequote([[, ]])' 'undefine(shift)' | $(m4) -

esbuild ?= esbuild
esbuild += --bundle --format=esm
esbuild += --define:NULL=null --define:NAME='"$(name)"'

terser ?= terser
terser += --module --ecma 2020 --mangle --comments false \
	  --compress 'passes=3,pure_getters=true,unsafe=true'

prefix := build
m4-prefix := $(prefix)/m4
modules-prefix := node_modules

ifneq ($(minimize),)
	minimize := -terser
endif

ifneq ($(debug),)
	debug := -debug
endif

.PHONY: install uninstall publish
install:

package-m4   := $(wildcard package/*.json)

package.json: %: %.in $(package-m4)
	$(m4) $< >$@

npm-modules := escape-string-regexp
npm-modules := $(addprefix $(modules-prefix)/,$(npm-modules))
npm-modules := $(addsuffix /package.json,$(npm-modules))

$(modules-prefix)/%/package.json:
	$(pnpm-d) $*
	touch $(package-json).in

discordrp-m4 := entry.js $(wildcard cmd/*.js) $(wildcard lib/*.js)
discordrp-m4 := $(addprefix $(m4-prefix)/,$(discordrp-m4))
discordrp := $(prefix)/entry.js

$(m4-prefix)/%: %
	mkdir -p $(@D)
	$(m4) $< >$@

$(discordrp)1: $(discordrp-m4) $(npm-modules)
	$(esbuild) --banner:js="import { createRequire } from 'node:module'; \
		   		var require = createRequire(import.meta.url);" \
		   --sourcemap --platform=node --external:vscode --outfile=$@ $<

discordrp-terser := $(addsuffix 1-terser,$(discordrp))
discordrp-debug  := $(addsuffix -debug,$(discordrp))

$(discordrp-terser): %1-terser: %1
	$(terser) <$< >$@

$(discordrp-debug): %-debug: %1
	ln -f $< $@
	ln -f $< $*

$(discordrp): %: %1$(minimize)
	head -n1 entry.js >$@
	printf '\n' >>$@
	cat $< >>$@

images  := $(wildcard image/*)
archive := $(prefix)/$(name).vsix

$(archive): README.md package.json $(discordrp)$(debug) $(images)
	vsce package --skip-license -o $@

install: $(archive)
	code --install-extension $<

uninstall:
	code --uninstall-extension \
	     $$(code --list-extensions | grep $(name) || printf '39\n')

publish: $(archive)
	vsce publish --skip-license

.PHONY: clean distclean

clean:
	rm -f $(archive) $(discordrp-m4) $(discordrp)*

distclean: clean
	test -d $(modules-prefix) && \
	find $(modules-prefix) -mindepth 1 -maxdepth 1 -exec rm -rf {} +
