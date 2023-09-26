import {expect, mock, test} from "bun:test";
import {compileRoute, indexSegments, isSegmentParameter} from "./index.ts";

test("isSegmentParameter", () => {
    expect(isSegmentParameter("segment")).toBeFalse()
    expect(isSegmentParameter(":segment")).toBeTrue()
})

test("indexSegments", () => {
    expect(indexSegments(["my", "full", "path"])).toEqual({
        "0": "my",
        "1": "full",
        "2": "path"
    })
    expect(indexSegments(["my", "full", "path", "with", ":parameter"])).toEqual({
        "0": "my",
        "1": "full",
        "2": "path",
        "3": "with",
        "4": ":parameter"
    })
})

test("compileRoute", () => {
    const handler = mock(() => {
    })
    const compiledRoute = compileRoute({
        path: "api/test/:parameter", handler
    })
    expect(compiledRoute.path).toStrictEqual("api/test/:parameter")
    expect(compiledRoute.paramsExtractor(["api", "test", "my_value"])).toEqual({
        parameter: "my_value"
    })
    expect(compiledRoute.matcher(["api", "test", "my_value"])).toBeTrue()
    expect(compiledRoute.matcher(["api", "invalid", "my_value"])).toBeFalse()
    expect(compiledRoute.matcher(["api", "test"])).toBeFalse()

    // Lastly, check that the handler was accordingly copied to the compiled route
    expect(handler).not.toHaveBeenCalled()
    compiledRoute.handler(null, {})
    expect(handler).toHaveBeenCalled()
})