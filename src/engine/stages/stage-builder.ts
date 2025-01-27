/* file : sateg-builder.ts
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

import { Consumable } from '../../operators/update/consumer.js'
import { Bindings } from '../../rdf/bindings.js'
import Dataset from '../../rdf/dataset.js'
import { PipelineStage } from '../pipeline/pipeline-engine.js'
import { PlanBuilder } from '../plan-builder.js'

/**
 * A StageBuilder encapsulate a strategy for executing a class of SPARQL operations
 * @abstract
 * @author Thomas Minier
 */
export default abstract class StageBuilder {
  protected _builder: PlanBuilder | null = null

  constructor(protected _dataset: Dataset) {}

  get builder(): PlanBuilder | null {
    return this._builder
  }

  set builder(builder: PlanBuilder | null) {
    this._builder = builder
  }

  get dataset(): Dataset {
    return this._dataset
  }

  set dataset(dataset: Dataset) {
    this._dataset = dataset
  }

  abstract execute(...args: unknown[]): PipelineStage<Bindings> | Consumable
}
