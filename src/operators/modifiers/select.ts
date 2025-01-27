/* file : select.ts
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

import * as SPARQL from 'sparqljs'
import { PipelineStage } from '../../engine/pipeline/pipeline-engine.js'
import { Pipeline } from '../../engine/pipeline/pipeline.js'
import { Bindings } from '../../rdf/bindings.js'
import { rdf } from '../../utils/index.js'

/**
 * Evaluates a SPARQL SELECT operation, i.e., perform a selection over sets of solutions bindings
 * @see {@link https://www.w3.org/TR/2013/REC-sparql11-query-20130321/#select}
 * @author Thomas Minier
 * @author Corentin Marionneau
 * @param source - Input {@link PipelineStage}
 * @param query - SELECT query
 * @return A {@link PipelineStage} which evaluate the SELECT modifier
 */
export default function select(
  source: PipelineStage<Bindings>,
  query: SPARQL.SelectQuery,
) {
  const variables = query.variables
  const selectAll =
    variables.length === 1 && rdf.isWildcard(variables[0] as SPARQL.Wildcard)
  return Pipeline.getInstance().map(source, (bindings: Bindings) => {
    if (!selectAll) {
      bindings = (variables as rdf.Variable[]).reduce((obj, v) => {
        if (bindings.has(v)) {
          obj.set(v, bindings.get(v)!)
        } else {
          obj.set(v, rdf.createUnbound())
        }
        return obj
      }, bindings.empty())
    }
    return bindings.mapValues((k, v) => (rdf.isVariable(k) ? v : null))
  })
}
