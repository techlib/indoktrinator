#!/usr/bin/make -f

adocs = $(wildcard doc/*.adoc)
htmls = $(adocs:.adoc=.html)
pdfs  = $(adocs:.adoc=.pdf)
pys   = $(shell find indoktrinator -name '*.py')

all: build
doc: html pdf

html: ${htmls}
pdf: ${pdfs}

build: npm
	node_modules/webpack/bin/webpack.js --progress --colors -p --config webpack/prod.js

dev: npm
	node_modules/webpack/bin/webpack.js --progress --colors --watch --display-error-details --config webpack/dev.js

lang:
	mkdir -p scripts/tmp
	node scripts/extract-lang.js
	rm -rf scripts/tmp

lint:
	node_modules/eslint/bin/eslint.js --ext .js,.jsx indoktrinator/static/js/src/ -c .eslintrc.json

pep:
	@python3-pep8 --show-source --ignore=E221,E712 ${pys}

npm:
	npm update

clean:
	rm -rf node_modules
	rm -rf indoktrinator/static/dist/app.bundle.js
	rm -rf doc/*.html doc/*.pdf doc/*.png doc/*.cache doc/.asciidoctor


%.html: %.adoc
	asciidoctor -r asciidoctor-diagram -b html5 -o $@ $<

%.pdf: %.adoc
	asciidoctor-pdf -r asciidoctor-diagram -o $@ $<


.PHONY: dev build npm default lint

# EOF
