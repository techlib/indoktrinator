#!/usr/bin/make -f

adocs = $(wildcard doc/*.adoc)
htmls = $(adocs:.adoc=.html)
pdfs  = $(adocs:.adoc=.pdf)

all: build doc
doc: ${htmls} ${pdfs}

build: npm
	./node_modules/webpack/bin/webpack.js --progress --colors -p --config webpack/prod.js

dev: npm
	./node_modules/webpack/bin/webpack.js --progress --colors --watch --config webpack/dev.js

lint:
	./node_modules/eslint/bin/eslint.js --ext .js,.jsx indoktrinator/static/js/src/ -c .eslintrc.json

npm:
	npm install

clean:
	rm -rf node_modules
	rm -rf indoktrinator/static/js/node_modules
	rm indoktrinator/static/dist/app.bundle.js
	rm -f doc/*.html doc/*.png doc/*.cache


%.html: %.adoc
	asciidoctor -r asciidoctor-diagram -b html5 -o $@ $<

%.pdf: %.adoc
	asciidoctor-pdf -r asciidoctor-diagram -o $@ $<


.PHONY: dev build npm default lint

# EOF
