import {Errorlike, Server} from "bun";

type HttpMethod = "HEAD" | "OPTIONS" | "GET" | "POST" | "PUT" | "DELETE"

type RouteHandler = ((request: Request, params: { [key: string]: string }) => Response | Promise<Response>)

type Route = {
    path: string,
    handler: RouteHandler
}

type CompiledRoute = Route & {
    matcher: (segments: string[]) => boolean,
    paramsExtractor: (segments: string[]) => { [key: string]: string }
}

type RouterMap<T> = { [method in HttpMethod]: T[] }

export const isSegmentParameter = (segment: string): boolean => segment.startsWith(":")

export const indexSegments = (segments: string[]): { [index: number]: string } => {
    return segments.map((value, position) => ({
        [position]: value,
    })).reduce((previousValue, currentValue) => ({
        ...previousValue,
        ...currentValue
    }), {})
}

export const compileRoute = (route: Route): CompiledRoute => {
    const indexedSegments = indexSegments(route.path.split("/"))
    const indexedParameterSegments = Object.keys(indexedSegments).map(Number).filter(value => isSegmentParameter(indexedSegments[value]))
        .map(value => ({[value]: indexedSegments[value]}))
        .reduce((previousValue, currentValue) => ({
            ...previousValue,
            [Object.keys(currentValue)[0]]: currentValue[Number(Object.keys(currentValue)[0])]
        }), {})
    const matcher = (segments: string[]) => segments.length == Object.keys(indexedSegments).length && segments.every((segment, position) => {
        const definedSegment = indexedSegments[position]
        if (segment && isSegmentParameter(definedSegment)) {
            return true;
        }
        return definedSegment.toLowerCase() == segment.toLowerCase()
    })
    const paramsExtractor = (segments: string[]) => {
        return Object.keys(indexedParameterSegments).map(Number).map(index => ({
            [indexedParameterSegments[index].substring(1)]: segments[index]
        })).reduce((previousValue, currentValue) => ({
            ...previousValue,
            ...currentValue
        }), {})
    }

    return {
        path: route.path,
        handler: route.handler,
        matcher,
        paramsExtractor
    }
}

const compileAllRoutes = (routes: RouterMap<Route>): RouterMap<CompiledRoute> => {
    return Object.keys(routes).map(method => method as HttpMethod)
        .map(method => ({[method]: routes[method].map(compileRoute)}))
        .reduce((previousValue, currentValue) => ({
            ...previousValue, ...currentValue
        }), {}) as RouterMap<CompiledRoute>
}

export const newRouter = (routes: RouterMap<Route>, fallback: (request: URL) => Promise<Response>): any => {
    const compiledRoutes = compileAllRoutes(routes)
    const fetch = async (request: Request, _: Server): Promise<Response> => {
        // remove trailing slash, as that breaks further path segment splitting
        const url = new URL(request.url.endsWith("/") ? request.url.substring(0, request.url.length - 1) : request.url)
        const segments = url.pathname.substring(1).split("/").filter(segment => segment.length > 0)
        const method = request.method as HttpMethod;
        const routesForMethod = compiledRoutes[method]

        if ((!routesForMethod || routesForMethod.length === 0) && method != "GET") {
            return new Response(null, {
                status: 404
            })
        }

        for (let route of routesForMethod) {
            if (!(route.matcher(segments))) {
                continue
            }
            const response = await route.handler(request, route.paramsExtractor(segments))
            response.headers.set("Access-Control-Allow-Origin", "*")
            response.headers.set("Access-Control-Allow-Methods", `${method},HEAD,OPTIONS`)
            return response
        }
        return fallback(url)
    }
    const error = (request: Errorlike): Response => {
        console.error("Unhandled error in http server chain", request)
        return new Response(null, {
            status: 500
        })
    }
    return {
        fetch,
        error
    }
}