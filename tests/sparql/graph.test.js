/* file : graph-test.js
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

import { beforeEach, describe, expect, it } from 'vitest'
import { rdf } from '../../src/utils'
import { TestEngine, getGraph } from '../utils.js'

const GRAPH_A_IRI = rdf.createIRI('http://example.org#some-graph-a')
const GRAPH_B_IRI = rdf.createIRI('http://example.org#some-graph-b')

describe('GRAPH/FROM queries', () => {
  let engine = null
  beforeEach(() => {
    const gA = getGraph('./tests/data/dblp.nt')
    const gB = getGraph('./tests/data/dblp2.nt')
    engine = new TestEngine(gA, GRAPH_A_IRI)
    engine.addNamedGraph(GRAPH_B_IRI, gB)
  })

  const data = [
    {
      text: 'should evaluate a query with one FROM clause',
      query: `
      PREFIX dblp-pers: <https://dblp.org/pers/m/>
      PREFIX dblp-rdf: <https://dblp.uni-trier.de/rdf/schema-2017-04-18#>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      SELECT ?s ?name ?article
      FROM <${GRAPH_B_IRI.value}>
      WHERE {
        ?s rdf:type dblp-rdf:Person .
        ?s dblp-rdf:primaryFullPersonName ?name .
        ?s dblp-rdf:authorOf ?article .
      }`,
      nbResults: 2,
      testFun: function (b) {
        expect(b).to.have.all.keys(['?s', '?name', '?article'])
        expect(b['?s']).to.equal('https://dblp.org/pers/g/Grall:Arnaud')
        expect(b['?name']).to.equal('"Arnaud Grall"')
        expect(b['?article']).to.be.oneOf([
          'https://dblp.org/rec/conf/semweb/GrallSM18',
          'https://dblp.org/rec/conf/esws/GrallFMSMSV17',
        ])
      },
    },
    {
      text: 'should evaluate a query with several FROM clauses',
      query: `
      PREFIX dblp-pers: <https://dblp.org/pers/m/>
      PREFIX dblp-rdf: <https://dblp.uni-trier.de/rdf/schema-2017-04-18#>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      SELECT ?s ?name ?article
      FROM <${GRAPH_A_IRI.value}>
      FROM <${GRAPH_B_IRI.value}>
      WHERE {
        ?s rdf:type dblp-rdf:Person .
        ?s dblp-rdf:primaryFullPersonName ?name .
        ?s dblp-rdf:authorOf ?article .
      }`,
      nbResults: 7,
      testFun: function (b) {
        expect(b).to.have.all.keys(['?s', '?name', '?article'])
        switch (b['?s']) {
          case 'https://dblp.org/pers/g/Grall:Arnaud':
            expect(b['?s']).to.equal('https://dblp.org/pers/g/Grall:Arnaud')
            expect(b['?name']).to.equal('"Arnaud Grall"')
            expect(b['?article']).to.be.oneOf([
              'https://dblp.org/rec/conf/semweb/GrallSM18',
              'https://dblp.org/rec/conf/esws/GrallFMSMSV17',
            ])
            break
          case 'https://dblp.org/pers/m/Minier:Thomas':
            expect(b['?s']).to.equal('https://dblp.org/pers/m/Minier:Thomas')
            expect(b['?name']).to.equal('"Thomas Minier"@en')
            expect(b['?article']).to.be.oneOf([
              'https://dblp.org/rec/conf/esws/MinierSMV18a',
              'https://dblp.org/rec/conf/esws/MinierSMV18',
              'https://dblp.org/rec/journals/corr/abs-1806-00227',
              'https://dblp.org/rec/conf/esws/MinierMSM17',
              'https://dblp.org/rec/conf/esws/MinierMSM17a',
            ])
            break
          default:
            throw new Error(`Unexpected ?s binding found ${b['?s']}`)
        }
      },
    },
    {
      text: 'should evaluate simple SPARQL GRAPH queries',
      query: `
      PREFIX dblp-pers: <https://dblp.org/pers/m/>
      PREFIX dblp-rdf: <https://dblp.uni-trier.de/rdf/schema-2017-04-18#>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      SELECT * WHERE {
        ?s dblp-rdf:coCreatorWith ?coCreator .
        GRAPH <${GRAPH_B_IRI.value}> {
          ?s2 dblp-rdf:coCreatorWith ?coCreator .
          ?s2 dblp-rdf:primaryFullPersonName ?name .
        }
      }`,
      nbResults: 3,
      testFun: function (b) {
        expect(b).to.have.all.keys(['?s', '?s2', '?coCreator', '?name'])
        expect(b['?s']).to.equal('https://dblp.org/pers/m/Minier:Thomas')
        expect(b['?s2']).to.equal('https://dblp.org/pers/g/Grall:Arnaud')
        expect(b['?name']).to.equal('"Arnaud Grall"')
        expect(b['?coCreator']).to.be.oneOf([
          'https://dblp.org/pers/m/Molli:Pascal',
          'https://dblp.org/pers/m/Montoya:Gabriela',
          'https://dblp.org/pers/s/Skaf=Molli:Hala',
        ])
      },
    },
    {
      text: 'should evaluate SPARQL GRAPH with FROM NAMED clauses',
      query: `
      PREFIX dblp-pers: <https://dblp.org/pers/m/>
      PREFIX dblp-rdf: <https://dblp.uni-trier.de/rdf/schema-2017-04-18#>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      SELECT *
      FROM NAMED <${GRAPH_B_IRI.value}>
      WHERE {
        ?s dblp-rdf:coCreatorWith ?coCreator .
        GRAPH ?g {
          ?s2 dblp-rdf:coCreatorWith ?coCreator .
          ?s2 dblp-rdf:primaryFullPersonName ?name .
        }
      }`,
      nbResults: 3,
      testFun: function (b) {
        expect(b).to.have.all.keys(['?s', '?s2', '?coCreator', '?name', '?g'])
        expect(b['?s']).to.equal('https://dblp.org/pers/m/Minier:Thomas')
        expect(b['?s2']).to.equal('https://dblp.org/pers/g/Grall:Arnaud')
        expect(b['?g']).to.be.oneOf([GRAPH_A_IRI.value, GRAPH_B_IRI.value])
        expect(b['?name']).to.equal('"Arnaud Grall"')
        expect(b['?coCreator']).to.be.oneOf([
          'https://dblp.org/pers/m/Molli:Pascal',
          'https://dblp.org/pers/m/Montoya:Gabriela',
          'https://dblp.org/pers/s/Skaf=Molli:Hala',
        ])
      },
    },
    {
      text: 'should evaluate a query where the graph IRI is a SPARQL variable',
      query: `
      PREFIX dblp-pers: <https://dblp.org/pers/m/>
      PREFIX dblp-rdf: <https://dblp.uni-trier.de/rdf/schema-2017-04-18#>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      SELECT *
      WHERE {
        ?s dblp-rdf:coCreatorWith ?coCreator .
        GRAPH ?g {
          ?s2 dblp-rdf:coCreatorWith ?coCreator .
          ?s2 dblp-rdf:primaryFullPersonName ?name .
        }
      }`,
      nbResults: 7,
      testFun: function (b) {
        expect(b).to.have.all.keys(['?s', '?s2', '?coCreator', '?name', '?g'])
        expect(b['?s']).to.equal('https://dblp.org/pers/m/Minier:Thomas')
        expect(b['?g']).to.be.oneOf([GRAPH_A_IRI.value, GRAPH_B_IRI.value])
        if (b['?g'] === GRAPH_A_IRI.value) {
          expect(b['?s2']).to.equal('https://dblp.org/pers/m/Minier:Thomas')
          expect(b['?name']).to.equal('"Thomas Minier"@en')
          expect(b['?coCreator']).to.be.oneOf([
            'https://dblp.org/pers/m/Molli:Pascal',
            'https://dblp.org/pers/m/Montoya:Gabriela',
            'https://dblp.org/pers/s/Skaf=Molli:Hala',
            'https://dblp.org/pers/v/Vidal:Maria=Esther',
          ])
        } else {
          expect(b['?s2']).to.equal('https://dblp.org/pers/g/Grall:Arnaud')
          expect(b['?name']).to.equal('"Arnaud Grall"')
          expect(b['?coCreator']).to.be.oneOf([
            'https://dblp.org/pers/m/Molli:Pascal',
            'https://dblp.org/pers/m/Montoya:Gabriela',
            'https://dblp.org/pers/s/Skaf=Molli:Hala',
          ])
        }
      },
    },
    {
      text: 'should evaluate a SPARQL query where the graph IRI is bounded by another expression',
      query: `
      PREFIX dblp-pers: <https://dblp.org/pers/m/>
      PREFIX dblp-rdf: <https://dblp.uni-trier.de/rdf/schema-2017-04-18#>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      SELECT * WHERE {
        ?s dblp-rdf:coCreatorWith ?coCreator .
        BIND(<${GRAPH_B_IRI.value}> as ?g)
        GRAPH ?g {
          ?s2 dblp-rdf:coCreatorWith ?coCreator .
          ?s2 dblp-rdf:primaryFullPersonName ?name .
        }
      }`,
      nbResults: 3,
      testFun: function (b) {
        expect(b).to.have.all.keys(['?s', '?s2', '?g', '?coCreator', '?name'])
        expect(b['?s']).to.equal('https://dblp.org/pers/m/Minier:Thomas')
        expect(b['?s2']).to.equal('https://dblp.org/pers/g/Grall:Arnaud')
        expect(b['?g']).to.equals(GRAPH_B_IRI.value)
        expect(b['?name']).to.equal('"Arnaud Grall"')
        expect(b['?coCreator']).to.be.oneOf([
          'https://dblp.org/pers/m/Molli:Pascal',
          'https://dblp.org/pers/m/Montoya:Gabriela',
          'https://dblp.org/pers/s/Skaf=Molli:Hala',
        ])
      },
    },
  ]

  data.forEach((d) => {
    it(d.text, async () => {
      const results = await engine.execute(d.query).toArray()
      results.forEach((b) => {
        d.testFun(b.toObject())
      })
      expect(results).toHaveLength(d.nbResults)
    })
  })
})
