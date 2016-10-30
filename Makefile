#!/usr/bin/make -f

adocs = $(wildcard doc/*.adoc)
htmls = $(adocs:.adoc=.html)
pdfs  = $(adocs:.adoc=.pdf)

PSQL = /usr/bin/psql
PSQL_ARGS = -U postgres
DB_NAME = indoktrinator

all: build doc
doc: ${htmls} # ${pdfs}

build: npm
	./node_modules/webpack/bin/webpack.js --progress --colors -p --config webpack/prod.js

dev: npm
	./node_modules/webpack/bin/webpack.js --progress --colors --watch --display-error-details --config webpack/dev.js

lint:
	./node_modules/eslint/bin/eslint.js --ext .js,.jsx indoktrinator/static/js/src/ -c .eslintrc.json

npm:
	npm install

clean:
	rm -rf node_modules
	rm indoktrinator/static/dist/app.bundle.js
	rm indoktrinator/static/dist/reactIntlMessages.json
	rm -f doc/*.html doc/*.png doc/*.cache


%.html: %.adoc
	asciidoctor -r asciidoctor-diagram -b html5 -o $@ $<

schema:
	$(PSQL) $(PSQL_ARGS) $(DB_NAME) < sql/schema.sql
triggers:
	$(PSQL) $(PSQL_ARGS) $(DB_NAME) < sql/triggers.sql

db:
	echo "DROP DATABASE IF EXISTS indoktrinator;" | $(PSQL) $(PSQL_ARGS)

	echo "CREATE DATABASE indoktrinator;" | $(PSQL) $(PSQL_ARGS)
	$(PSQL) $(PSQL_ARGS) $(DB_NAME) < sql/schema.sql

#
# %.pdf: %.adoc
# 	asciidoctor-pdf -r asciidoctor-diagram -o $@ $<


.PHONY: dev build npm default lint

# EOF
