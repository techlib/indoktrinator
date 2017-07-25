#!/usr/bin/make -f

adocs = $(wildcard doc/*.adoc)
htmls = $(adocs:.adoc=.html)
pdfs  = $(adocs:.adoc=.pdf)
pys   = $(shell find indoktrinator -name '*.py')

all: build
doc: html pdf

html: ${htmls}
pdf: ${pdfs}

build: yarn
	yarn run build

watch: yarn
	yarn run watch

lint: yarn
	yarn run lint

yarn:
	yarn

lang:
	mkdir -p scripts/tmp
	node scripts/extract-lang.js
	rm -rf scripts/tmp

pep:
	python3-pep8 --show-source --ignore=E221,E712 ${pys}

clean:
	rm -rf doc/*.html doc/*.pdf doc/*.png doc/*.cache doc/.asciidoctor
	rm -rf node_modules
	rm -rf indoktrinator/static/dist/*
	rm -f indoktrinator/static/fonts/*
	rm -f indoktrinator/static/css/patternfly*
	rm -f indoktrinator/static/js/patternfly*
	rm -f indoktrinator/static/img/spinner*


%.html: %.adoc
	asciidoctor -r asciidoctor-diagram -b html5 -o $@ $<

%.pdf: %.adoc
	asciidoctor-pdf -r asciidoctor-diagram -o $@ $<


.PHONY: all doc html pdf build watch lint yarn lang pep clean

# EOF
