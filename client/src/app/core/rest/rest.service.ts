import debug from 'debug'
import { SortMeta } from 'primeng/api'
import { HttpParams } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { ComponentPaginationLight } from './component-pagination.model'
import { RestPagination } from './rest-pagination'

const debugLogger = debug('peertube:rest')

type ParseQueryHandlerResult = string | number | boolean | string[] | number[] | boolean[]

interface QueryStringFilterPrefixes {
  [key: string]: {
    prefix: string
    handler?: (v: string) => ParseQueryHandlerResult
    multiple?: boolean
    isBoolean?: boolean
  }
}

// trocamos 'keyof any' por 'string', que eh o que as chaves realmente são
type ParseQueryStringFilters<K extends string> = Partial<Record<K, ParseQueryHandlerResult | ParseQueryHandlerResult[]>>
type ParseQueryStringFiltersResult<K extends string> = ParseQueryStringFilters<K> & { search?: string }

// tipo para os valores permitidos em parâmetros HTTP
type HttpParamValue = string | number | boolean | (string | number | boolean)[] | undefined | null

@Injectable()
export class RestService {
  addRestGetParams (params: HttpParams, pagination?: RestPagination, sort?: SortMeta | string): HttpParams {
    let newParams = params

    if (pagination !== undefined) {
      newParams = newParams.set('start', pagination.start.toString())
        .set('count', pagination.count.toString())
    }

    if (sort !== undefined) {
      newParams = newParams.set('sort', this.buildSortString(sort))
    }

    return newParams
  }

  buildSortString (sort: SortMeta | string): string {
    if (typeof sort === 'string') {
      return sort
    }

    const sortPrefix = sort.order === 1 ? '' : '-'
    return sortPrefix + sort.field
  }

  addArrayParams (params: HttpParams, name: string, values: (string | number)[]): HttpParams {
    let updatedParams = params
    for (const v of values) {
      updatedParams = updatedParams.append(name, v.toString())
    }

    return updatedParams
  }

  // substituímos any por uma record com tipos de valores aceitáveis para a Web API
  addObjectParams (params: HttpParams, object: Record<string, HttpParamValue>): HttpParams {
    let updatedParams = params
    for (const name of Object.keys(object)) {
      const value = object[name]
      if (value === undefined || value === null) continue

      if (Array.isArray(value)) {
        updatedParams = this.addArrayParams(updatedParams, name, value as (string | number)[])
      } else {
        updatedParams = updatedParams.set(name, value.toString())
      }
    }

    return updatedParams
  }

  componentToRestPagination (componentPagination: ComponentPaginationLight): RestPagination {
    const { currentPage, itemsPerPage, itemsRemoved = 0 } = componentPagination

    const start = Math.max(0, (currentPage - 1) * itemsPerPage - itemsRemoved)

    return { start, count: itemsPerPage }
  }

  /*
   * retorna um objeto contendo os filtros e a busca restante
   */
  parseQueryStringFilter<T extends QueryStringFilterPrefixes> (q: string, prefixes: T): ParseQueryStringFiltersResult<Extract<keyof T, string>> {
    if (!q) return {}

    const tokens = this.tokenizeString(q)
    const prefixeStrings = Object.values(prefixes).map(p => p.prefix)

    debugLogger(`Built tokens "${tokens.join(', ')}" for prefixes "${prefixeStrings.join(', ')}"`)

    const searchTokens = tokens.filter(t => {
      return prefixeStrings.every(prefixString => t.startsWith(prefixString) === false)
    })

    // tipagem explícita para o acumulador de filtros
    const additionalFilters = {} as ParseQueryStringFilters<Extract<keyof T, string>>

    for (const prefixKey of Object.keys(prefixes)) {
      const prefixObj = prefixes[prefixKey]
      const prefix = prefixObj.prefix

      const matchedTokens = tokens.filter(t => t.startsWith(prefix))
        .map(t => t.slice(prefix.length))
        .map(t => t.replace(/^"|"$/g, ''))
        .map(t => {
          if (prefixObj.handler) return prefixObj.handler(t)

          if (prefixObj.isBoolean) {
            if (t === 'true') return true
            if (t === 'false') return false
            return undefined
          }

          return t
        })
        .filter(t => t !== null && t !== undefined) as ParseQueryHandlerResult[]

      if (matchedTokens.length === 0) continue

      const key = prefixKey as Extract<keyof T, string>
      additionalFilters[key] = prefixObj.multiple === true
        ? matchedTokens
        : matchedTokens[0]
    }

    const search = searchTokens.join(' ') || undefined
    debugLogger('Built search: ' + search, additionalFilters)

    return {
      search,
      ...additionalFilters
    }
  }

  tokenizeString (q: string): string[] {
    if (!q) return []

    const matches = q.match(/(?:[^\s"]+|"[^"]*")+/g)
    return matches ? matches.filter(token => !!token) : []
  }
}