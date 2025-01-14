/* file : update-test.js
MIT License

Copyright (c) 2018-2020 Thomas Minier

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

'use strict'

import { expect } from 'chai'
import { beforeEach, describe, it } from 'vitest'
import { TestEngine, getGraph } from '../utils.js'

describe('SPARQL UPDATE: INSERT/DELETE queries', () => {
  let engine = null
  beforeEach(() => {
    const g = getGraph('./tests/data/dblp.nt')
    engine = new TestEngine(g)
  })

  it('should evaluate basic INSERT queries', async () => {
    const query = `
    PREFIX dblp-pers: <https://dblp.org/pers/m/>
    PREFIX dblp-rdf: <https://dblp.uni-trier.de/rdf/schema-2017-04-18#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX dc: <http://purl.org/dc/elements/1.1/>
    INSERT { ?s dc:name  "Thomas Minier"@fr }
    WHERE {
      ?s rdf:type dblp-rdf:Person .
      ?s dblp-rdf:primaryFullPersonName ?name .
      ?s dblp-rdf:authorOf ?article .
    }`

    await engine
      .execute(query)
      .execute()
      .then(() => {
        const triples = engine._graph._store.getQuads(
          'https://dblp.org/pers/m/Minier:Thomas',
          'http://purl.org/dc/elements/1.1/name',
          null,
        )
        expect(triples.length).to.equal(1)
        expect(triples[0].subject.value).to.equal(
          'https://dblp.org/pers/m/Minier:Thomas',
        )
        expect(triples[0].predicate.value).to.equal(
          'http://purl.org/dc/elements/1.1/name',
        )
        expect(triples[0].object.value).to.equal('Thomas Minier')
        expect(triples[0].object.id).to.equal('"Thomas Minier"@fr')
        expect(triples[0].object.language).to.equal('fr')
        expect(triples[0].object.datatype.value).to.equal(
          'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString',
        )
      })
  })

  it('should evaluate basic DELETE queries', async () => {
    const query = `
    PREFIX dblp-rdf: <https://dblp.uni-trier.de/rdf/schema-2017-04-18#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX dc: <http://purl.org/dc/elements/1.1/>
    DELETE { ?s rdf:type dblp-rdf:Person . }
    WHERE {
      ?s rdf:type dblp-rdf:Person .
    }`

    await engine
      .execute(query)
      .execute()
      .then(() => {
        const triples = engine._graph._store.getQuads(
          'https://dblp.org/pers/m/Minier:Thomas',
          'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
          null,
        )
        expect(triples.length).to.equal(0)
      })
  })

  it('should evaluate basic INSERT/DELETE queries', async () => {
    const query = `
    PREFIX dblp-rdf: <https://dblp.uni-trier.de/rdf/schema-2017-04-18#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX dc: <http://purl.org/dc/elements/1.1/>
    DELETE { ?s rdf:type dblp-rdf:Person . }
    INSERT { ?s rdf:type rdf:Person . }
    WHERE {
      ?s rdf:type dblp-rdf:Person .
    }`

    await engine
      .execute(query)
      .execute()
      .then(() => {
        const triples = engine._graph._store.getQuads(
          'https://dblp.org/pers/m/Minier:Thomas',
          'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
          null,
        )
        expect(triples.length).to.equal(1)
        expect(triples[0].subject.value).to.equal(
          'https://dblp.org/pers/m/Minier:Thomas',
        )
        expect(triples[0].predicate.value).to.equal(
          'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
        )
        expect(triples[0].object.value).to.equal(
          'http://www.w3.org/1999/02/22-rdf-syntax-ns#Person',
        )
      })
  })

  it('should evaluate INSERT/DELETE queries where the WHERE evaluates to 0 solutions', async () => {
    const query = `
    PREFIX dblp-rdf: <https://dblp.uni-trier.de/rdf/schema-2017-04-18#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX dc: <http://purl.org/dc/elements/1.1/>
    DELETE { ?s rdf:type dblp-rdf:Person . }
    INSERT { ?s rdf:type rdf:Person . }
    WHERE {
      ?s rdf:type rdf:Person .
    }`

    await engine
      .execute(query)
      .execute()
      .then(() => {
        const triples = engine._graph._store.getQuads(
          'https://dblp.org/pers/m/Minier:Thomas',
          'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
          null,
        )
        expect(triples.length).to.equal(1)
        expect(triples[0].subject.value).to.equal(
          'https://dblp.org/pers/m/Minier:Thomas',
        )
        expect(triples[0].predicate.value).to.equal(
          'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
        )
        expect(triples[0].object.value).to.equal(
          'https://dblp.uni-trier.de/rdf/schema-2017-04-18#Person',
        )
      })
  })
})
