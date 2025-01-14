/* file : insert-test.js
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
import { rdf } from '../../src/utils'
import { TestEngine, getGraph } from '../utils.js'

const GRAPH_IRI = rdf.createIRI('htpp://example.org#some-graph')

describe('SPARQL UPDATE: INSERT DATA queries', () => {
  let engine = null
  beforeEach(() => {
    const gA = getGraph(null)
    const gB = getGraph(null)
    engine = new TestEngine(gA)
    engine.addNamedGraph(GRAPH_IRI, gB)
  })

  it('should evaluate INSERT DATA queries without a named Graph', async () => {
    const query = `
    PREFIX dc: <http://purl.org/dc/elements/1.1/>
    INSERT DATA { <http://example/book1>  dc:title  "Fundamentals of Compiler Design" }`

    await engine
      .execute(query)
      .execute()
      .then(() => {
        const triples = engine._graph._store.getQuads(
          'http://example/book1',
          null,
          null,
        )
        expect(triples.length).to.equal(1)
        expect(triples[0].subject.value).to.equal('http://example/book1')
        expect(triples[0].predicate.value).to.equal(
          'http://purl.org/dc/elements/1.1/title',
        )
        expect(triples[0].object.value).to.equal(
          'Fundamentals of Compiler Design',
        )
      })
  })

  it('should evaluate INSERT DATA queries using a named Graph', async () => {
    const query = `
    PREFIX dc: <http://purl.org/dc/elements/1.1/>
    INSERT DATA {
      GRAPH <${GRAPH_IRI.value}> {
        <http://example/book1>  dc:title  "Fundamentals of Compiler Design"
      }
    }`

    await engine
      .execute(query)
      .execute()
      .then(() => {
        const triples = engine
          .getNamedGraph(GRAPH_IRI)
          ._store.getQuads('http://example/book1', null, null)
        expect(triples.length).to.equal(1)
        expect(triples[0].subject.value).to.equal('http://example/book1')
        expect(triples[0].predicate.value).to.equal(
          'http://purl.org/dc/elements/1.1/title',
        )
        expect(triples[0].object.value).to.equal(
          'Fundamentals of Compiler Design',
        )
      })
  })
})
