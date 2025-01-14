/* file : graph-executor.ts
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
import { Bindings } from '../../rdf/bindings.js'
import { rdf } from '../../utils/index.js'
import ExecutionContext from '../context/execution-context.js'
import ContextSymbols from '../context/symbols.js'
import { PipelineStage } from '../pipeline/pipeline-engine.js'
import { Pipeline } from '../pipeline/pipeline.js'
import StageBuilder from './stage-builder.js'

/**
 * A GraphStageBuilder evaluates GRAPH clauses in a SPARQL query.
 * @author Thomas Minier
 */
export default class GraphStageBuilder extends StageBuilder {
  /**
   * Build a {@link PipelineStage} to evaluate a GRAPH clause
   * @param  source  - Input {@link PipelineStage}
   * @param  pattern    - Graph clause
   * @param  options - Execution options
   * @return A {@link PipelineStage} used to evaluate a GRAPH clause
   */
  execute(
    source: PipelineStage<Bindings>,
    pattern: SPARQL.GraphPattern,
    context: ExecutionContext,
  ): PipelineStage<Bindings> {
    let subquery: SPARQL.Query
    if (pattern.patterns[0].type === 'query') {
      subquery = pattern.patterns[0] as SPARQL.Query
    } else {
      subquery = {
        prefixes: context.getProperty(ContextSymbols.PREFIXES),
        queryType: 'SELECT',
        variables: [new SPARQL.Wildcard()],
        type: 'query',
        where: pattern.patterns,
      }
    }
    // handle the case where the GRAPh IRI is a SPARQL variable
    if (rdf.isVariable(pattern.name)) {
      // clone the source first
      source = Pipeline.getInstance().clone(source)
      let namedGraphs: rdf.NamedNode[] = []
      // use named graphs is provided, otherwise use all named graphs
      if (context.namedGraphs.length > 0) {
        namedGraphs = context.namedGraphs
      } else {
        namedGraphs = this._dataset.getAllGraphs(true).map((g) => g.iri)
      }
      // build a pipeline stage that allows to peek on the first set of input bindings
      return Pipeline.getInstance().peekIf(
        source,
        1,
        (values) => {
          return values[0].has(pattern.name)
        },
        (values) => {
          // if the input bindings bound the graph's variable, use it as graph IRI
          const graphIRI = values[0].get(pattern.name as rdf.Variable)!
          return this._buildIterator(
            source,
            graphIRI as rdf.NamedNode,
            subquery,
            context,
          )
        },
        () => {
          // otherwise, execute the subquery using each graph, and bound the graph var to the graph iri
          return Pipeline.getInstance().merge(
            ...namedGraphs.map((iri: rdf.NamedNode) => {
              const stage = this._buildIterator(source, iri, subquery, context)
              return Pipeline.getInstance().map(stage, (bindings) => {
                return bindings.extendMany([
                  [pattern.name as rdf.Variable, iri],
                ])
              })
            }),
          )
        },
      )
    }
    // otherwise, execute the subquery using the Graph
    return this._buildIterator(source, pattern.name, subquery, context)
  }

  /**
   * Returns a {@link PipelineStage} used to evaluate a GRAPH clause
   * @param  source    - Input {@link PipelineStage}
   * @param  iri       - IRI of the GRAPH clause
   * @param  subquery  - Subquery to be evaluated
   * @param  options   - Execution options
   * @return A {@link PipelineStage} used to evaluate a GRAPH clause
   */
  _buildIterator(
    source: PipelineStage<Bindings>,
    iri: rdf.NamedNode,
    subquery: SPARQL.Query,
    context: ExecutionContext,
  ): PipelineStage<Bindings> {
    const opts = context.clone()
    opts.defaultGraphs = [iri]
    return this._builder!._buildQueryPlan(
      subquery,
      opts,
      source,
    ) as PipelineStage<Bindings>
  }
}
