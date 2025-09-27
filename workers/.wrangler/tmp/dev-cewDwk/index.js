var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-gSoyYe/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// .wrangler/tmp/bundle-gSoyYe/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// node_modules/hono/dist/compose.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = Symbol();

// node_modules/hono/dist/utils/body.js
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value) => {
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");

// node_modules/hono/dist/utils/url.js
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match, index) => {
    const mark = `@${index}`;
    groups.push([mark, match]);
    return mark;
  });
  return { groups, path };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") {
    return "*";
  }
  const match = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match[1], new RegExp(`^${match[2]}(?=/${next})`)] : [label, match[1], new RegExp(`^${match[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match) => {
      try {
        return decoder(match);
      } catch {
        return match;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const path = url.slice(start, queryIndex === -1 ? void 0 : queryIndex);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63) {
      break;
    }
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf(`?${key}`, 8);
    if (keyIndex2 === -1) {
      keyIndex2 = url.indexOf(`&${key}`, 8);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURIComponent_), "tryDecodeURIComponent");
var HonoRequest = /* @__PURE__ */ __name(class {
  raw;
  #validatedData;
  #matchResult;
  routeIndex = 0;
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return this.bodyCache.parsedBody ??= await parseBody(this, options);
  }
  #cachedBody = (key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  };
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  text() {
    return this.#cachedBody("text");
  }
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  blob() {
    return this.#cachedBody("blob");
  }
  formData() {
    return this.#cachedBody("formData");
  }
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  get url() {
    return this.raw.url;
  }
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
}, "HonoRequest");

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var Context = /* @__PURE__ */ __name(class {
  #rawRequest;
  #req;
  env = {};
  #var;
  finalized = false;
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  get res() {
    return this.#res ||= new Response(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  set res(_res) {
    if (this.#res && _res) {
      _res = new Response(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  render = (...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  };
  setLayout = (layout) => this.#layout = layout;
  getLayout = () => this.#layout;
  setRenderer = (renderer) => {
    this.#renderer = renderer;
  };
  header = (name, value, options) => {
    if (this.finalized) {
      this.#res = new Response(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  };
  status = (status) => {
    this.#status = status;
  };
  set = (key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  };
  get = (key) => {
    return this.#var ? this.#var.get(key) : void 0;
  };
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return new Response(data, { status, headers: responseHeaders });
  }
  newResponse = (...args) => this.#newResponse(...args);
  body = (data, arg, headers) => this.#newResponse(data, arg, headers);
  text = (text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  };
  json = (object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  };
  html = (html, arg, headers) => {
    const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  };
  redirect = (location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  };
  notFound = () => {
    this.#notFoundHandler ??= () => new Response();
    return this.#notFoundHandler(this);
  };
}, "Context");

// node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = /* @__PURE__ */ __name(class extends Error {
}, "UnsupportedPathError");

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = /* @__PURE__ */ __name(class {
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  router;
  getPath;
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  errorHandler = errorHandler;
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler);
    });
    return this;
  }
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  onError = (handler) => {
    this.errorHandler = handler;
    return this;
  };
  notFound = (handler) => {
    this.#notFoundHandler = handler;
    return this;
  };
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = url.pathname.slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = { basePath: this._basePath, path, method, handler };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  fetch = (request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  };
  request = (input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  };
  fire = () => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  };
}, "Hono");

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = /* @__PURE__ */ __name(class {
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new Node();
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new Node();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
}, "Node");

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = /* @__PURE__ */ __name(class {
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
}, "Trie");

// node_modules/hono/dist/router/reg-exp-router/router.js
var emptyParam = [];
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
__name(clearWildcardRegExpCache, "clearWildcardRegExpCache");
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
__name(buildMatcherFromPreprocessedRoutes, "buildMatcherFromPreprocessedRoutes");
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = /* @__PURE__ */ __name(class {
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match(method, path) {
    clearWildcardRegExpCache();
    const matchers = this.#buildAllMatchers();
    this.match = (method2, path2) => {
      const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
      const staticMatch = matcher[2][path2];
      if (staticMatch) {
        return staticMatch;
      }
      const match = path2.match(matcher[0]);
      if (!match) {
        return [[], emptyParam];
      }
      const index = match.indexOf("", 1);
      return [matcher[1][index], match];
    };
    return this.match(method, path);
  }
  #buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
}, "RegExpRouter");

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = /* @__PURE__ */ __name(class {
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
}, "SmartRouter");

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var Node2 = /* @__PURE__ */ __name(class {
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #getHandlerSets(node, method, nodeParams, params) {
    const handlerSets = [];
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
    return handlerSets;
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              handlerSets.push(
                ...this.#getHandlerSets(nextNode.#children["*"], method, node.#params)
              );
            }
            handlerSets.push(...this.#getHandlerSets(nextNode, method, node.#params));
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              handlerSets.push(...this.#getHandlerSets(astNode, method, node.#params));
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          const restPathString = parts.slice(i).join("/");
          if (matcher instanceof RegExp) {
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              handlerSets.push(...this.#getHandlerSets(child, method, node.#params, params));
              if (Object.keys(child.#children).length) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              handlerSets.push(...this.#getHandlerSets(child, method, params, node.#params));
              if (child.#children["*"]) {
                handlerSets.push(
                  ...this.#getHandlerSets(child.#children["*"], method, params, node.#params)
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      curNodes = tempNodes.concat(curNodesQueue.shift() ?? []);
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
}, "Node");

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = /* @__PURE__ */ __name(class {
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
}, "TrieRouter");

// node_modules/hono/dist/hono.js
var Hono2 = /* @__PURE__ */ __name(class extends Hono {
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
}, "Hono");

// node_modules/hono/dist/middleware/cors/index.js
var cors = /* @__PURE__ */ __name((options) => {
  const defaults = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    allowHeaders: [],
    exposeHeaders: []
  };
  const opts = {
    ...defaults,
    ...options
  };
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function") {
      return optsAllowMethods;
    } else if (Array.isArray(optsAllowMethods)) {
      return () => optsAllowMethods;
    } else {
      return () => [];
    }
  })(opts.allowMethods);
  return /* @__PURE__ */ __name(async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    __name(set, "set");
    const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.origin !== "*") {
      const existingVary = c.req.header("Vary");
      if (existingVary) {
        set("Vary", existingVary);
      } else {
        set("Vary", "Origin");
      }
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (opts.exposeHeaders?.length) {
      set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
    }
    if (c.req.method === "OPTIONS") {
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods.length) {
        set("Access-Control-Allow-Methods", allowMethods.join(","));
      }
      let headers = opts.allowHeaders;
      if (!headers?.length) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headers = requestHeaders.split(/\s*,\s*/);
        }
      }
      if (headers?.length) {
        set("Access-Control-Allow-Headers", headers.join(","));
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
  }, "cors2");
}, "cors");

// node_modules/hono/dist/utils/color.js
function getColorEnabled() {
  const { process, Deno: Deno2 } = globalThis;
  const isNoColor = typeof Deno2?.noColor === "boolean" ? Deno2.noColor : process !== void 0 ? "NO_COLOR" in process?.env : false;
  return !isNoColor;
}
__name(getColorEnabled, "getColorEnabled");
async function getColorEnabledAsync() {
  const { navigator: navigator2 } = globalThis;
  const cfWorkers = "cloudflare:workers";
  const isNoColor = navigator2 !== void 0 && navigator2.userAgent === "Cloudflare-Workers" ? await (async () => {
    try {
      return "NO_COLOR" in ((await import(cfWorkers)).env ?? {});
    } catch {
      return false;
    }
  })() : !getColorEnabled();
  return !isNoColor;
}
__name(getColorEnabledAsync, "getColorEnabledAsync");

// node_modules/hono/dist/middleware/logger/index.js
var humanize = /* @__PURE__ */ __name((times) => {
  const [delimiter, separator] = [",", "."];
  const orderTimes = times.map((v) => v.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + delimiter));
  return orderTimes.join(separator);
}, "humanize");
var time = /* @__PURE__ */ __name((start) => {
  const delta = Date.now() - start;
  return humanize([delta < 1e3 ? delta + "ms" : Math.round(delta / 1e3) + "s"]);
}, "time");
var colorStatus = /* @__PURE__ */ __name(async (status) => {
  const colorEnabled = await getColorEnabledAsync();
  if (colorEnabled) {
    switch (status / 100 | 0) {
      case 5:
        return `\x1B[31m${status}\x1B[0m`;
      case 4:
        return `\x1B[33m${status}\x1B[0m`;
      case 3:
        return `\x1B[36m${status}\x1B[0m`;
      case 2:
        return `\x1B[32m${status}\x1B[0m`;
    }
  }
  return `${status}`;
}, "colorStatus");
async function log(fn, prefix, method, path, status = 0, elapsed) {
  const out = prefix === "<--" ? `${prefix} ${method} ${path}` : `${prefix} ${method} ${path} ${await colorStatus(status)} ${elapsed}`;
  fn(out);
}
__name(log, "log");
var logger = /* @__PURE__ */ __name((fn = console.log) => {
  return /* @__PURE__ */ __name(async function logger2(c, next) {
    const { method, url } = c.req;
    const path = url.slice(url.indexOf("/", 8));
    await log(fn, "<--", method, path);
    const start = Date.now();
    await next();
    await log(fn, "-->", method, path, c.res.status, time(start));
  }, "logger2");
}, "logger");

// node_modules/hono/dist/middleware/pretty-json/index.js
var prettyJSON = /* @__PURE__ */ __name((options) => {
  const targetQuery = options?.query ?? "pretty";
  return /* @__PURE__ */ __name(async function prettyJSON2(c, next) {
    const pretty = c.req.query(targetQuery) || c.req.query(targetQuery) === "";
    await next();
    if (pretty && c.res.headers.get("Content-Type")?.startsWith("application/json")) {
      const obj = await c.res.json();
      c.res = new Response(JSON.stringify(obj, null, options?.space ?? 2), c.res);
    }
  }, "prettyJSON2");
}, "prettyJSON");

// node_modules/hono/dist/http-exception.js
var HTTPException = /* @__PURE__ */ __name(class extends Error {
  res;
  status;
  constructor(status = 500, options) {
    super(options?.message, { cause: options?.cause });
    this.res = options?.res;
    this.status = status;
  }
  getResponse() {
    if (this.res) {
      const newResponse = new Response(this.res.body, {
        status: this.status,
        headers: this.res.headers
      });
      return newResponse;
    }
    return new Response(this.message, {
      status: this.status
    });
  }
}, "HTTPException");

// node_modules/hono/dist/utils/encode.js
var decodeBase64Url = /* @__PURE__ */ __name((str) => {
  return decodeBase64(str.replace(/_|-/g, (m) => ({ _: "/", "-": "+" })[m] ?? m));
}, "decodeBase64Url");
var encodeBase64Url = /* @__PURE__ */ __name((buf) => encodeBase64(buf).replace(/\/|\+/g, (m) => ({ "/": "_", "+": "-" })[m] ?? m), "encodeBase64Url");
var encodeBase64 = /* @__PURE__ */ __name((buf) => {
  let binary = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0, len = bytes.length; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}, "encodeBase64");
var decodeBase64 = /* @__PURE__ */ __name((str) => {
  const binary = atob(str);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  const half = binary.length / 2;
  for (let i = 0, j = binary.length - 1; i <= half; i++, j--) {
    bytes[i] = binary.charCodeAt(i);
    bytes[j] = binary.charCodeAt(j);
  }
  return bytes;
}, "decodeBase64");

// node_modules/hono/dist/utils/jwt/jwa.js
var AlgorithmTypes = /* @__PURE__ */ ((AlgorithmTypes2) => {
  AlgorithmTypes2["HS256"] = "HS256";
  AlgorithmTypes2["HS384"] = "HS384";
  AlgorithmTypes2["HS512"] = "HS512";
  AlgorithmTypes2["RS256"] = "RS256";
  AlgorithmTypes2["RS384"] = "RS384";
  AlgorithmTypes2["RS512"] = "RS512";
  AlgorithmTypes2["PS256"] = "PS256";
  AlgorithmTypes2["PS384"] = "PS384";
  AlgorithmTypes2["PS512"] = "PS512";
  AlgorithmTypes2["ES256"] = "ES256";
  AlgorithmTypes2["ES384"] = "ES384";
  AlgorithmTypes2["ES512"] = "ES512";
  AlgorithmTypes2["EdDSA"] = "EdDSA";
  return AlgorithmTypes2;
})(AlgorithmTypes || {});

// node_modules/hono/dist/helper/adapter/index.js
var knownUserAgents = {
  deno: "Deno",
  bun: "Bun",
  workerd: "Cloudflare-Workers",
  node: "Node.js"
};
var getRuntimeKey = /* @__PURE__ */ __name(() => {
  const global = globalThis;
  const userAgentSupported = typeof navigator !== "undefined" && true;
  if (userAgentSupported) {
    for (const [runtimeKey, userAgent] of Object.entries(knownUserAgents)) {
      if (checkUserAgentEquals(userAgent)) {
        return runtimeKey;
      }
    }
  }
  if (typeof global?.EdgeRuntime === "string") {
    return "edge-light";
  }
  if (global?.fastly !== void 0) {
    return "fastly";
  }
  if (global?.process?.release?.name === "node") {
    return "node";
  }
  return "other";
}, "getRuntimeKey");
var checkUserAgentEquals = /* @__PURE__ */ __name((platform) => {
  const userAgent = "Cloudflare-Workers";
  return userAgent.startsWith(platform);
}, "checkUserAgentEquals");

// node_modules/hono/dist/utils/jwt/types.js
var JwtAlgorithmNotImplemented = /* @__PURE__ */ __name(class extends Error {
  constructor(alg) {
    super(`${alg} is not an implemented algorithm`);
    this.name = "JwtAlgorithmNotImplemented";
  }
}, "JwtAlgorithmNotImplemented");
var JwtTokenInvalid = /* @__PURE__ */ __name(class extends Error {
  constructor(token) {
    super(`invalid JWT token: ${token}`);
    this.name = "JwtTokenInvalid";
  }
}, "JwtTokenInvalid");
var JwtTokenNotBefore = /* @__PURE__ */ __name(class extends Error {
  constructor(token) {
    super(`token (${token}) is being used before it's valid`);
    this.name = "JwtTokenNotBefore";
  }
}, "JwtTokenNotBefore");
var JwtTokenExpired = /* @__PURE__ */ __name(class extends Error {
  constructor(token) {
    super(`token (${token}) expired`);
    this.name = "JwtTokenExpired";
  }
}, "JwtTokenExpired");
var JwtTokenIssuedAt = /* @__PURE__ */ __name(class extends Error {
  constructor(currentTimestamp, iat) {
    super(
      `Invalid "iat" claim, must be a valid number lower than "${currentTimestamp}" (iat: "${iat}")`
    );
    this.name = "JwtTokenIssuedAt";
  }
}, "JwtTokenIssuedAt");
var JwtTokenIssuer = /* @__PURE__ */ __name(class extends Error {
  constructor(expected, iss) {
    super(`expected issuer "${expected}", got ${iss ? `"${iss}"` : "none"} `);
    this.name = "JwtTokenIssuer";
  }
}, "JwtTokenIssuer");
var JwtHeaderInvalid = /* @__PURE__ */ __name(class extends Error {
  constructor(header) {
    super(`jwt header is invalid: ${JSON.stringify(header)}`);
    this.name = "JwtHeaderInvalid";
  }
}, "JwtHeaderInvalid");
var JwtHeaderRequiresKid = /* @__PURE__ */ __name(class extends Error {
  constructor(header) {
    super(`required "kid" in jwt header: ${JSON.stringify(header)}`);
    this.name = "JwtHeaderRequiresKid";
  }
}, "JwtHeaderRequiresKid");
var JwtTokenSignatureMismatched = /* @__PURE__ */ __name(class extends Error {
  constructor(token) {
    super(`token(${token}) signature mismatched`);
    this.name = "JwtTokenSignatureMismatched";
  }
}, "JwtTokenSignatureMismatched");
var CryptoKeyUsage = /* @__PURE__ */ ((CryptoKeyUsage2) => {
  CryptoKeyUsage2["Encrypt"] = "encrypt";
  CryptoKeyUsage2["Decrypt"] = "decrypt";
  CryptoKeyUsage2["Sign"] = "sign";
  CryptoKeyUsage2["Verify"] = "verify";
  CryptoKeyUsage2["DeriveKey"] = "deriveKey";
  CryptoKeyUsage2["DeriveBits"] = "deriveBits";
  CryptoKeyUsage2["WrapKey"] = "wrapKey";
  CryptoKeyUsage2["UnwrapKey"] = "unwrapKey";
  return CryptoKeyUsage2;
})(CryptoKeyUsage || {});

// node_modules/hono/dist/utils/jwt/utf8.js
var utf8Encoder = new TextEncoder();
var utf8Decoder = new TextDecoder();

// node_modules/hono/dist/utils/jwt/jws.js
async function signing(privateKey, alg, data) {
  const algorithm = getKeyAlgorithm(alg);
  const cryptoKey = await importPrivateKey(privateKey, algorithm);
  return await crypto.subtle.sign(algorithm, cryptoKey, data);
}
__name(signing, "signing");
async function verifying(publicKey, alg, signature, data) {
  const algorithm = getKeyAlgorithm(alg);
  const cryptoKey = await importPublicKey(publicKey, algorithm);
  return await crypto.subtle.verify(algorithm, cryptoKey, signature, data);
}
__name(verifying, "verifying");
function pemToBinary(pem) {
  return decodeBase64(pem.replace(/-+(BEGIN|END).*/g, "").replace(/\s/g, ""));
}
__name(pemToBinary, "pemToBinary");
async function importPrivateKey(key, alg) {
  if (!crypto.subtle || !crypto.subtle.importKey) {
    throw new Error("`crypto.subtle.importKey` is undefined. JWT auth middleware requires it.");
  }
  if (isCryptoKey(key)) {
    if (key.type !== "private" && key.type !== "secret") {
      throw new Error(
        `unexpected key type: CryptoKey.type is ${key.type}, expected private or secret`
      );
    }
    return key;
  }
  const usages = [CryptoKeyUsage.Sign];
  if (typeof key === "object") {
    return await crypto.subtle.importKey("jwk", key, alg, false, usages);
  }
  if (key.includes("PRIVATE")) {
    return await crypto.subtle.importKey("pkcs8", pemToBinary(key), alg, false, usages);
  }
  return await crypto.subtle.importKey("raw", utf8Encoder.encode(key), alg, false, usages);
}
__name(importPrivateKey, "importPrivateKey");
async function importPublicKey(key, alg) {
  if (!crypto.subtle || !crypto.subtle.importKey) {
    throw new Error("`crypto.subtle.importKey` is undefined. JWT auth middleware requires it.");
  }
  if (isCryptoKey(key)) {
    if (key.type === "public" || key.type === "secret") {
      return key;
    }
    key = await exportPublicJwkFrom(key);
  }
  if (typeof key === "string" && key.includes("PRIVATE")) {
    const privateKey = await crypto.subtle.importKey("pkcs8", pemToBinary(key), alg, true, [
      CryptoKeyUsage.Sign
    ]);
    key = await exportPublicJwkFrom(privateKey);
  }
  const usages = [CryptoKeyUsage.Verify];
  if (typeof key === "object") {
    return await crypto.subtle.importKey("jwk", key, alg, false, usages);
  }
  if (key.includes("PUBLIC")) {
    return await crypto.subtle.importKey("spki", pemToBinary(key), alg, false, usages);
  }
  return await crypto.subtle.importKey("raw", utf8Encoder.encode(key), alg, false, usages);
}
__name(importPublicKey, "importPublicKey");
async function exportPublicJwkFrom(privateKey) {
  if (privateKey.type !== "private") {
    throw new Error(`unexpected key type: ${privateKey.type}`);
  }
  if (!privateKey.extractable) {
    throw new Error("unexpected private key is unextractable");
  }
  const jwk = await crypto.subtle.exportKey("jwk", privateKey);
  const { kty } = jwk;
  const { alg, e, n } = jwk;
  const { crv, x, y } = jwk;
  return { kty, alg, e, n, crv, x, y, key_ops: [CryptoKeyUsage.Verify] };
}
__name(exportPublicJwkFrom, "exportPublicJwkFrom");
function getKeyAlgorithm(name) {
  switch (name) {
    case "HS256":
      return {
        name: "HMAC",
        hash: {
          name: "SHA-256"
        }
      };
    case "HS384":
      return {
        name: "HMAC",
        hash: {
          name: "SHA-384"
        }
      };
    case "HS512":
      return {
        name: "HMAC",
        hash: {
          name: "SHA-512"
        }
      };
    case "RS256":
      return {
        name: "RSASSA-PKCS1-v1_5",
        hash: {
          name: "SHA-256"
        }
      };
    case "RS384":
      return {
        name: "RSASSA-PKCS1-v1_5",
        hash: {
          name: "SHA-384"
        }
      };
    case "RS512":
      return {
        name: "RSASSA-PKCS1-v1_5",
        hash: {
          name: "SHA-512"
        }
      };
    case "PS256":
      return {
        name: "RSA-PSS",
        hash: {
          name: "SHA-256"
        },
        saltLength: 32
      };
    case "PS384":
      return {
        name: "RSA-PSS",
        hash: {
          name: "SHA-384"
        },
        saltLength: 48
      };
    case "PS512":
      return {
        name: "RSA-PSS",
        hash: {
          name: "SHA-512"
        },
        saltLength: 64
      };
    case "ES256":
      return {
        name: "ECDSA",
        hash: {
          name: "SHA-256"
        },
        namedCurve: "P-256"
      };
    case "ES384":
      return {
        name: "ECDSA",
        hash: {
          name: "SHA-384"
        },
        namedCurve: "P-384"
      };
    case "ES512":
      return {
        name: "ECDSA",
        hash: {
          name: "SHA-512"
        },
        namedCurve: "P-521"
      };
    case "EdDSA":
      return {
        name: "Ed25519",
        namedCurve: "Ed25519"
      };
    default:
      throw new JwtAlgorithmNotImplemented(name);
  }
}
__name(getKeyAlgorithm, "getKeyAlgorithm");
function isCryptoKey(key) {
  const runtime = getRuntimeKey();
  if (runtime === "node" && !!crypto.webcrypto) {
    return key instanceof crypto.webcrypto.CryptoKey;
  }
  return key instanceof CryptoKey;
}
__name(isCryptoKey, "isCryptoKey");

// node_modules/hono/dist/utils/jwt/jwt.js
var encodeJwtPart = /* @__PURE__ */ __name((part) => encodeBase64Url(utf8Encoder.encode(JSON.stringify(part)).buffer).replace(/=/g, ""), "encodeJwtPart");
var encodeSignaturePart = /* @__PURE__ */ __name((buf) => encodeBase64Url(buf).replace(/=/g, ""), "encodeSignaturePart");
var decodeJwtPart = /* @__PURE__ */ __name((part) => JSON.parse(utf8Decoder.decode(decodeBase64Url(part))), "decodeJwtPart");
function isTokenHeader(obj) {
  if (typeof obj === "object" && obj !== null) {
    const objWithAlg = obj;
    return "alg" in objWithAlg && Object.values(AlgorithmTypes).includes(objWithAlg.alg) && (!("typ" in objWithAlg) || objWithAlg.typ === "JWT");
  }
  return false;
}
__name(isTokenHeader, "isTokenHeader");
var sign = /* @__PURE__ */ __name(async (payload, privateKey, alg = "HS256") => {
  const encodedPayload = encodeJwtPart(payload);
  let encodedHeader;
  if (typeof privateKey === "object" && "alg" in privateKey) {
    alg = privateKey.alg;
    encodedHeader = encodeJwtPart({ alg, typ: "JWT", kid: privateKey.kid });
  } else {
    encodedHeader = encodeJwtPart({ alg, typ: "JWT" });
  }
  const partialToken = `${encodedHeader}.${encodedPayload}`;
  const signaturePart = await signing(privateKey, alg, utf8Encoder.encode(partialToken));
  const signature = encodeSignaturePart(signaturePart);
  return `${partialToken}.${signature}`;
}, "sign");
var verify2 = /* @__PURE__ */ __name(async (token, publicKey, algOrOptions) => {
  const optsIn = typeof algOrOptions === "string" ? { alg: algOrOptions } : algOrOptions || {};
  const opts = {
    alg: optsIn.alg ?? "HS256",
    iss: optsIn.iss,
    nbf: optsIn.nbf ?? true,
    exp: optsIn.exp ?? true,
    iat: optsIn.iat ?? true
  };
  const tokenParts = token.split(".");
  if (tokenParts.length !== 3) {
    throw new JwtTokenInvalid(token);
  }
  const { header, payload } = decode(token);
  if (!isTokenHeader(header)) {
    throw new JwtHeaderInvalid(header);
  }
  const now = Date.now() / 1e3 | 0;
  if (opts.nbf && payload.nbf && payload.nbf > now) {
    throw new JwtTokenNotBefore(token);
  }
  if (opts.exp && payload.exp && payload.exp <= now) {
    throw new JwtTokenExpired(token);
  }
  if (opts.iat && payload.iat && now < payload.iat) {
    throw new JwtTokenIssuedAt(now, payload.iat);
  }
  if (opts.iss) {
    if (!payload.iss) {
      throw new JwtTokenIssuer(opts.iss, null);
    }
    if (typeof opts.iss === "string" && payload.iss !== opts.iss) {
      throw new JwtTokenIssuer(opts.iss, payload.iss);
    }
    if (opts.iss instanceof RegExp && !opts.iss.test(payload.iss)) {
      throw new JwtTokenIssuer(opts.iss, payload.iss);
    }
  }
  const headerPayload = token.substring(0, token.lastIndexOf("."));
  const verified = await verifying(
    publicKey,
    opts.alg,
    decodeBase64Url(tokenParts[2]),
    utf8Encoder.encode(headerPayload)
  );
  if (!verified) {
    throw new JwtTokenSignatureMismatched(token);
  }
  return payload;
}, "verify");
var verifyWithJwks = /* @__PURE__ */ __name(async (token, options, init) => {
  const verifyOpts = options.verification || {};
  const header = decodeHeader(token);
  if (!isTokenHeader(header)) {
    throw new JwtHeaderInvalid(header);
  }
  if (!header.kid) {
    throw new JwtHeaderRequiresKid(header);
  }
  if (options.jwks_uri) {
    const response = await fetch(options.jwks_uri, init);
    if (!response.ok) {
      throw new Error(`failed to fetch JWKS from ${options.jwks_uri}`);
    }
    const data = await response.json();
    if (!data.keys) {
      throw new Error('invalid JWKS response. "keys" field is missing');
    }
    if (!Array.isArray(data.keys)) {
      throw new Error('invalid JWKS response. "keys" field is not an array');
    }
    if (options.keys) {
      options.keys.push(...data.keys);
    } else {
      options.keys = data.keys;
    }
  } else if (!options.keys) {
    throw new Error('verifyWithJwks requires options for either "keys" or "jwks_uri" or both');
  }
  const matchingKey = options.keys.find((key) => key.kid === header.kid);
  if (!matchingKey) {
    throw new JwtTokenInvalid(token);
  }
  return await verify2(token, matchingKey, {
    alg: matchingKey.alg || header.alg,
    ...verifyOpts
  });
}, "verifyWithJwks");
var decode = /* @__PURE__ */ __name((token) => {
  try {
    const [h, p] = token.split(".");
    const header = decodeJwtPart(h);
    const payload = decodeJwtPart(p);
    return {
      header,
      payload
    };
  } catch {
    throw new JwtTokenInvalid(token);
  }
}, "decode");
var decodeHeader = /* @__PURE__ */ __name((token) => {
  try {
    const [h] = token.split(".");
    return decodeJwtPart(h);
  } catch {
    throw new JwtTokenInvalid(token);
  }
}, "decodeHeader");

// node_modules/hono/dist/utils/jwt/index.js
var Jwt = { sign, verify: verify2, decode, verifyWithJwks };

// node_modules/hono/dist/middleware/jwt/jwt.js
var verifyWithJwks2 = Jwt.verifyWithJwks;
var verify3 = Jwt.verify;
var decode2 = Jwt.decode;
var sign2 = Jwt.sign;

// src/middleware/auth.ts
async function generateToken(payload, secret, expiresIn = 24 * 60 * 60) {
  const now = Math.floor(Date.now() / 1e3);
  const jwtPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn
  };
  return await sign2(jwtPayload, secret);
}
__name(generateToken, "generateToken");
async function verifyToken(token, secret) {
  try {
    const payload = await verify3(token, secret);
    const now = Math.floor(Date.now() / 1e3);
    if (payload.exp < now) {
      throw new Error("Token\u5DF2\u8FC7\u671F");
    }
    return payload;
  } catch (error) {
    throw new HTTPException(401, { message: "Token\u65E0\u6548\u6216\u5DF2\u8FC7\u671F" });
  }
}
__name(verifyToken, "verifyToken");
function authMiddleware() {
  return async (c, next) => {
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new HTTPException(401, { message: "\u7F3A\u5C11\u8BA4\u8BC1token" });
    }
    const token = authHeader.substring(7);
    try {
      const payload = await verifyToken(token, c.env.JWT_SECRET);
      c.set("user", payload);
      await next();
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      throw new HTTPException(401, { message: "\u8BA4\u8BC1\u5931\u8D25" });
    }
  };
}
__name(authMiddleware, "authMiddleware");
function familyMemberMiddleware() {
  return async (c, next) => {
    const user = c.get("user");
    if (!user) {
      throw new HTTPException(401, { message: "\u9700\u8981\u8BA4\u8BC1" });
    }
    if (!user.familyId) {
      throw new HTTPException(403, { message: "\u7528\u6237\u672A\u52A0\u5165\u4EFB\u4F55\u5BB6\u5EAD" });
    }
    await next();
  };
}
__name(familyMemberMiddleware, "familyMemberMiddleware");
function getCurrentUser(c) {
  const user = c.get("user");
  if (!user) {
    throw new HTTPException(401, { message: "\u7528\u6237\u672A\u8BA4\u8BC1" });
  }
  return user;
}
__name(getCurrentUser, "getCurrentUser");
function checkFamilyAccess(user, familyId) {
  return user.familyId === familyId || user.role === "admin";
}
__name(checkFamilyAccess, "checkFamilyAccess");

// src/routes/auth.ts
var hashPassword = /* @__PURE__ */ __name(async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}, "hashPassword");
var verifyPassword = /* @__PURE__ */ __name(async (password, hash2) => {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash2;
}, "verifyPassword");
var auth = new Hono2();
auth.post("/register", async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    if (!email || !password || !name) {
      throw new HTTPException(400, { message: "\u90AE\u7BB1\u3001\u5BC6\u7801\u548C\u59D3\u540D\u4E0D\u80FD\u4E3A\u7A7A" });
    }
    if (password.length < 6) {
      throw new HTTPException(400, { message: "\u5BC6\u7801\u957F\u5EA6\u81F3\u5C116\u4F4D" });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new HTTPException(400, { message: "\u90AE\u7BB1\u683C\u5F0F\u4E0D\u6B63\u786E" });
    }
    const existingUser = await c.env.DB.prepare(
      "SELECT id FROM users WHERE email = ?"
    ).bind(email).first();
    if (existingUser) {
      throw new HTTPException(400, { message: "\u8BE5\u90AE\u7BB1\u5DF2\u88AB\u6CE8\u518C" });
    }
    const passwordHash = await hashPassword(password);
    const userId = crypto.randomUUID();
    await c.env.DB.prepare(
      "INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)"
    ).bind(userId, email, passwordHash, name).run();
    const token = await generateToken(
      {
        userId,
        email,
        role: "member"
      },
      c.env.JWT_SECRET
    );
    return c.json({
      message: "\u6CE8\u518C\u6210\u529F",
      token,
      user: {
        id: userId,
        email,
        name,
        role: "member"
      }
    });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error("Registration error:", error);
    throw new HTTPException(500, { message: "\u6CE8\u518C\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5" });
  }
});
auth.post("/login", async (c) => {
  try {
    const { email, password } = await c.req.json();
    if (!email || !password) {
      throw new HTTPException(400, { message: "\u90AE\u7BB1\u548C\u5BC6\u7801\u4E0D\u80FD\u4E3A\u7A7A" });
    }
    const user = await c.env.DB.prepare(
      "SELECT id, email, password_hash, name, family_id, role FROM users WHERE email = ?"
    ).bind(email).first();
    if (!user) {
      throw new HTTPException(401, { message: "\u90AE\u7BB1\u6216\u5BC6\u7801\u9519\u8BEF" });
    }
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      throw new HTTPException(401, { message: "\u90AE\u7BB1\u6216\u5BC6\u7801\u9519\u8BEF" });
    }
    const token = await generateToken(
      {
        userId: user.id,
        email: user.email,
        familyId: user.family_id,
        role: user.role
      },
      c.env.JWT_SECRET
    );
    return c.json({
      message: "\u767B\u5F55\u6210\u529F",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        familyId: user.family_id,
        role: user.role
      }
    });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error("Login error:", error);
    throw new HTTPException(500, { message: "\u767B\u5F55\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5" });
  }
});
auth.get("/me", authMiddleware(), async (c) => {
  try {
    const currentUser = getCurrentUser(c);
    const user = await c.env.DB.prepare(
      "SELECT id, email, name, family_id, role, created_at FROM users WHERE id = ?"
    ).bind(currentUser.userId).first();
    if (!user) {
      throw new HTTPException(404, { message: "\u7528\u6237\u4E0D\u5B58\u5728" });
    }
    let family2 = null;
    if (user.family_id) {
      family2 = await c.env.DB.prepare(
        "SELECT id, name, description FROM families WHERE id = ?"
      ).bind(user.family_id).first();
    }
    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        familyId: user.family_id,
        role: user.role,
        createdAt: user.created_at,
        family: family2
      }
    });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error("Get user info error:", error);
    throw new HTTPException(500, { message: "\u83B7\u53D6\u7528\u6237\u4FE1\u606F\u5931\u8D25" });
  }
});
auth.put("/profile", authMiddleware(), async (c) => {
  try {
    const currentUser = getCurrentUser(c);
    const { name, email } = await c.req.json();
    if (!name && !email) {
      throw new HTTPException(400, { message: "\u81F3\u5C11\u9700\u8981\u63D0\u4F9B\u4E00\u4E2A\u66F4\u65B0\u5B57\u6BB5" });
    }
    const updates = [];
    const values = [];
    if (name) {
      updates.push("name = ?");
      values.push(name);
    }
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new HTTPException(400, { message: "\u90AE\u7BB1\u683C\u5F0F\u4E0D\u6B63\u786E" });
      }
      const existingUser = await c.env.DB.prepare(
        "SELECT id FROM users WHERE email = ? AND id != ?"
      ).bind(email, currentUser.userId).first();
      if (existingUser) {
        throw new HTTPException(400, { message: "\u8BE5\u90AE\u7BB1\u5DF2\u88AB\u5176\u4ED6\u7528\u6237\u4F7F\u7528" });
      }
      updates.push("email = ?");
      values.push(email);
    }
    values.push(currentUser.userId);
    await c.env.DB.prepare(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`
    ).bind(...values).run();
    return c.json({ message: "\u7528\u6237\u4FE1\u606F\u66F4\u65B0\u6210\u529F" });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error("Update profile error:", error);
    throw new HTTPException(500, { message: "\u66F4\u65B0\u7528\u6237\u4FE1\u606F\u5931\u8D25" });
  }
});
auth.put("/password", authMiddleware(), async (c) => {
  try {
    const currentUser = getCurrentUser(c);
    const { currentPassword, newPassword } = await c.req.json();
    if (!currentPassword || !newPassword) {
      throw new HTTPException(400, { message: "\u5F53\u524D\u5BC6\u7801\u548C\u65B0\u5BC6\u7801\u4E0D\u80FD\u4E3A\u7A7A" });
    }
    if (newPassword.length < 6) {
      throw new HTTPException(400, { message: "\u65B0\u5BC6\u7801\u957F\u5EA6\u81F3\u5C116\u4F4D" });
    }
    const user = await c.env.DB.prepare(
      "SELECT password_hash FROM users WHERE id = ?"
    ).bind(currentUser.userId).first();
    if (!user) {
      throw new HTTPException(404, { message: "\u7528\u6237\u4E0D\u5B58\u5728" });
    }
    const isValidPassword = await verify(currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw new HTTPException(400, { message: "\u5F53\u524D\u5BC6\u7801\u9519\u8BEF" });
    }
    const newPasswordHash = await hash(newPassword);
    await c.env.DB.prepare(
      "UPDATE users SET password_hash = ? WHERE id = ?"
    ).bind(newPasswordHash, currentUser.userId).run();
    return c.json({ message: "\u5BC6\u7801\u4FEE\u6539\u6210\u529F" });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error("Change password error:", error);
    throw new HTTPException(500, { message: "\u4FEE\u6539\u5BC6\u7801\u5931\u8D25" });
  }
});
auth.post("/refresh", authMiddleware(), async (c) => {
  try {
    const currentUser = getCurrentUser(c);
    const newToken = await generateToken(
      {
        userId: currentUser.userId,
        email: currentUser.email,
        familyId: currentUser.familyId,
        role: currentUser.role
      },
      c.env.JWT_SECRET
    );
    return c.json({
      message: "Token\u5237\u65B0\u6210\u529F",
      token: newToken
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    throw new HTTPException(500, { message: "Token\u5237\u65B0\u5931\u8D25" });
  }
});
var auth_default = auth;

// src/routes/tasks.ts
var tasks = new Hono2();
tasks.use("*", authMiddleware());
tasks.get("/", async (c) => {
  try {
    const user = getCurrentUser(c);
    const { status, priority, assignee, page = "1", limit = "20" } = c.req.query();
    if (!user.familyId) {
      return c.json({ tasks: [], total: 0, page: 1, limit: 20 });
    }
    const conditions = ["family_id = ?"];
    const params = [user.familyId];
    if (status) {
      conditions.push("status = ?");
      params.push(status);
    }
    if (priority) {
      conditions.push("priority = ?");
      params.push(priority);
    }
    if (assignee) {
      conditions.push("assignee_id = ?");
      params.push(assignee);
    }
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;
    const countQuery = `SELECT COUNT(*) as total FROM tasks WHERE ${conditions.join(" AND ")}`;
    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
    const total = countResult?.total || 0;
    const tasksQuery = `
      SELECT 
        t.*,
        creator.name as creator_name,
        assignee.name as assignee_name,
        completer.name as completer_name
      FROM tasks t
      LEFT JOIN users creator ON t.creator_id = creator.id
      LEFT JOIN users assignee ON t.assignee_id = assignee.id
      LEFT JOIN users completer ON t.completer_id = completer.id
      WHERE ${conditions.join(" AND ")}
      ORDER BY 
        CASE t.priority 
          WHEN 'high' THEN 1 
          WHEN 'medium' THEN 2 
          WHEN 'low' THEN 3 
        END,
        t.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const tasksResult = await c.env.DB.prepare(tasksQuery).bind(...params, limitNum, offset).all();
    return c.json({
      tasks: tasksResult.results || [],
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error("Get tasks error:", error);
    throw new HTTPException(500, { message: "\u83B7\u53D6\u4EFB\u52A1\u5217\u8868\u5931\u8D25" });
  }
});
tasks.get("/:id", async (c) => {
  try {
    const user = getCurrentUser(c);
    const taskId = c.req.param("id");
    const task = await c.env.DB.prepare(`
      SELECT 
        t.*,
        creator.name as creator_name,
        assignee.name as assignee_name,
        completer.name as completer_name
      FROM tasks t
      LEFT JOIN users creator ON t.creator_id = creator.id
      LEFT JOIN users assignee ON t.assignee_id = assignee.id
      LEFT JOIN users completer ON t.completer_id = completer.id
      WHERE t.id = ?
    `).bind(taskId).first();
    if (!task) {
      throw new HTTPException(404, { message: "\u4EFB\u52A1\u4E0D\u5B58\u5728" });
    }
    if (!checkFamilyAccess(user, task.family_id)) {
      throw new HTTPException(403, { message: "\u65E0\u6743\u9650\u8BBF\u95EE\u8BE5\u4EFB\u52A1" });
    }
    return c.json({ task });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error("Get task error:", error);
    throw new HTTPException(500, { message: "\u83B7\u53D6\u4EFB\u52A1\u8BE6\u60C5\u5931\u8D25" });
  }
});
tasks.post("/", familyMemberMiddleware(), async (c) => {
  try {
    const user = getCurrentUser(c);
    const { title, description, priority = "medium", type = "regular", assigneeId, dueDate, recurringRule } = await c.req.json();
    if (!title || !assigneeId) {
      throw new HTTPException(400, { message: "\u4EFB\u52A1\u6807\u9898\u548C\u6307\u6D3E\u4EBA\u4E0D\u80FD\u4E3A\u7A7A" });
    }
    if (!["high", "medium", "low"].includes(priority)) {
      throw new HTTPException(400, { message: "\u4F18\u5148\u7EA7\u5FC5\u987B\u662F high\u3001medium \u6216 low" });
    }
    if (!["regular", "long_term", "recurring"].includes(type)) {
      throw new HTTPException(400, { message: "\u4EFB\u52A1\u7C7B\u578B\u5FC5\u987B\u662F regular\u3001long_term \u6216 recurring" });
    }
    const assignee = await c.env.DB.prepare(
      "SELECT id, family_id FROM users WHERE id = ?"
    ).bind(assigneeId).first();
    if (!assignee) {
      throw new HTTPException(400, { message: "\u6307\u6D3E\u4EBA\u4E0D\u5B58\u5728" });
    }
    if (assignee.family_id !== user.familyId) {
      throw new HTTPException(400, { message: "\u53EA\u80FD\u5C06\u4EFB\u52A1\u6307\u6D3E\u7ED9\u540C\u4E00\u5BB6\u5EAD\u7684\u6210\u5458" });
    }
    const taskId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO tasks (
        id, title, description, priority, type, creator_id, assignee_id, 
        family_id, due_date, recurring_rule
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      taskId,
      title,
      description,
      priority,
      type,
      user.userId,
      assigneeId,
      user.familyId,
      dueDate,
      recurringRule
    ).run();
    const newTask = await c.env.DB.prepare(`
      SELECT 
        t.*,
        creator.name as creator_name,
        assignee.name as assignee_name
      FROM tasks t
      LEFT JOIN users creator ON t.creator_id = creator.id
      LEFT JOIN users assignee ON t.assignee_id = assignee.id
      WHERE t.id = ?
    `).bind(taskId).first();
    return c.json({
      message: "\u4EFB\u52A1\u521B\u5EFA\u6210\u529F",
      task: newTask
    }, 201);
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error("Create task error:", error);
    throw new HTTPException(500, { message: "\u521B\u5EFA\u4EFB\u52A1\u5931\u8D25" });
  }
});
tasks.put("/:id", async (c) => {
  try {
    const user = getCurrentUser(c);
    const taskId = c.req.param("id");
    const { title, description, priority, status, assigneeId, dueDate, recurringRule } = await c.req.json();
    const task = await c.env.DB.prepare(
      "SELECT * FROM tasks WHERE id = ?"
    ).bind(taskId).first();
    if (!task) {
      throw new HTTPException(404, { message: "\u4EFB\u52A1\u4E0D\u5B58\u5728" });
    }
    if (!checkFamilyAccess(user, task.family_id)) {
      throw new HTTPException(403, { message: "\u65E0\u6743\u9650\u4FEE\u6539\u8BE5\u4EFB\u52A1" });
    }
    const updates = [];
    const values = [];
    if (title !== void 0) {
      updates.push("title = ?");
      values.push(title);
    }
    if (description !== void 0) {
      updates.push("description = ?");
      values.push(description);
    }
    if (priority !== void 0) {
      if (!["high", "medium", "low"].includes(priority)) {
        throw new HTTPException(400, { message: "\u4F18\u5148\u7EA7\u5FC5\u987B\u662F high\u3001medium \u6216 low" });
      }
      updates.push("priority = ?");
      values.push(priority);
    }
    if (status !== void 0) {
      if (!["pending", "in_progress", "completed"].includes(status)) {
        throw new HTTPException(400, { message: "\u72B6\u6001\u5FC5\u987B\u662F pending\u3001in_progress \u6216 completed" });
      }
      updates.push("status = ?");
      values.push(status);
      if (status === "completed") {
        updates.push("completer_id = ?", "completed_at = ?");
        values.push(user.userId, (/* @__PURE__ */ new Date()).toISOString());
      }
    }
    if (assigneeId !== void 0) {
      const assignee = await c.env.DB.prepare(
        "SELECT id, family_id FROM users WHERE id = ?"
      ).bind(assigneeId).first();
      if (!assignee || assignee.family_id !== user.familyId) {
        throw new HTTPException(400, { message: "\u6307\u6D3E\u4EBA\u5FC5\u987B\u662F\u540C\u4E00\u5BB6\u5EAD\u7684\u6210\u5458" });
      }
      updates.push("assignee_id = ?");
      values.push(assigneeId);
    }
    if (dueDate !== void 0) {
      updates.push("due_date = ?");
      values.push(dueDate);
    }
    if (recurringRule !== void 0) {
      updates.push("recurring_rule = ?");
      values.push(recurringRule);
    }
    if (updates.length === 0) {
      throw new HTTPException(400, { message: "\u81F3\u5C11\u9700\u8981\u63D0\u4F9B\u4E00\u4E2A\u66F4\u65B0\u5B57\u6BB5" });
    }
    values.push(taskId);
    await c.env.DB.prepare(
      `UPDATE tasks SET ${updates.join(", ")} WHERE id = ?`
    ).bind(...values).run();
    return c.json({ message: "\u4EFB\u52A1\u66F4\u65B0\u6210\u529F" });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error("Update task error:", error);
    throw new HTTPException(500, { message: "\u66F4\u65B0\u4EFB\u52A1\u5931\u8D25" });
  }
});
tasks.delete("/:id", async (c) => {
  try {
    const user = getCurrentUser(c);
    const taskId = c.req.param("id");
    const task = await c.env.DB.prepare(
      "SELECT * FROM tasks WHERE id = ?"
    ).bind(taskId).first();
    if (!task) {
      throw new HTTPException(404, { message: "\u4EFB\u52A1\u4E0D\u5B58\u5728" });
    }
    if (task.creator_id !== user.userId && user.role !== "admin") {
      throw new HTTPException(403, { message: "\u53EA\u6709\u4EFB\u52A1\u521B\u5EFA\u8005\u6216\u7BA1\u7406\u5458\u53EF\u4EE5\u5220\u9664\u4EFB\u52A1" });
    }
    await c.env.DB.prepare("DELETE FROM tasks WHERE id = ?").bind(taskId).run();
    return c.json({ message: "\u4EFB\u52A1\u5220\u9664\u6210\u529F" });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error("Delete task error:", error);
    throw new HTTPException(500, { message: "\u5220\u9664\u4EFB\u52A1\u5931\u8D25" });
  }
});
tasks.get("/stats/overview", familyMemberMiddleware(), async (c) => {
  try {
    const user = getCurrentUser(c);
    const familyStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks,
        COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_tasks
      FROM tasks WHERE family_id = ?
    `).bind(user.familyId).first();
    const personalStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as assigned_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks
      FROM tasks WHERE assignee_id = ? AND family_id = ?
    `).bind(user.userId, user.familyId).first();
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const dueTodayStats = await c.env.DB.prepare(`
      SELECT COUNT(*) as due_today
      FROM tasks 
      WHERE family_id = ? 
        AND DATE(due_date) = ? 
        AND status != 'completed'
    `).bind(user.familyId, today).first();
    return c.json({
      family: familyStats || {},
      personal: personalStats || {},
      dueToday: dueTodayStats?.due_today || 0
    });
  } catch (error) {
    console.error("Get task stats error:", error);
    throw new HTTPException(500, { message: "\u83B7\u53D6\u4EFB\u52A1\u7EDF\u8BA1\u5931\u8D25" });
  }
});
var tasks_default = tasks;

// src/routes/family.ts
var family = new Hono2();
family.use("*", authMiddleware());
family.post("/", async (c) => {
  try {
    const user = getCurrentUser(c);
    const { name, description } = await c.req.json();
    if (!name) {
      throw new HTTPException(400, { message: "\u5BB6\u5EAD\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A" });
    }
    if (user.familyId) {
      throw new HTTPException(400, { message: "\u60A8\u5DF2\u7ECF\u52A0\u5165\u4E86\u4E00\u4E2A\u5BB6\u5EAD\uFF0C\u8BF7\u5148\u9000\u51FA\u5F53\u524D\u5BB6\u5EAD" });
    }
    const familyId = crypto.randomUUID();
    await c.env.DB.prepare(
      "INSERT INTO families (id, name, description, admin_id) VALUES (?, ?, ?, ?)"
    ).bind(familyId, name, description, user.userId).run();
    await c.env.DB.prepare(
      "UPDATE users SET family_id = ?, role = ? WHERE id = ?"
    ).bind(familyId, "admin", user.userId).run();
    return c.json({
      message: "\u5BB6\u5EAD\u521B\u5EFA\u6210\u529F",
      family: {
        id: familyId,
        name,
        description,
        adminId: user.userId,
        role: "admin"
      }
    }, 201);
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error("Create family error:", error);
    throw new HTTPException(500, { message: "\u521B\u5EFA\u5BB6\u5EAD\u5931\u8D25" });
  }
});
family.get("/:id", async (c) => {
  try {
    const user = getCurrentUser(c);
    const familyId = c.req.param("id");
    if (!checkFamilyAccess(user, familyId)) {
      throw new HTTPException(403, { message: "\u65E0\u6743\u9650\u8BBF\u95EE\u8BE5\u5BB6\u5EAD\u4FE1\u606F" });
    }
    const familyInfo = await c.env.DB.prepare(`
      SELECT f.*, admin.name as admin_name
      FROM families f
      LEFT JOIN users admin ON f.admin_id = admin.id
      WHERE f.id = ?
    `).bind(familyId).first();
    if (!familyInfo) {
      throw new HTTPException(404, { message: "\u5BB6\u5EAD\u4E0D\u5B58\u5728" });
    }
    const members = await c.env.DB.prepare(`
      SELECT id, name, email, role, created_at
      FROM users
      WHERE family_id = ?
      ORDER BY 
        CASE role WHEN 'admin' THEN 1 ELSE 2 END,
        created_at ASC
    `).bind(familyId).all();
    return c.json({
      family: {
        ...familyInfo,
        members: members.results || []
      }
    });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error("Get family error:", error);
    throw new HTTPException(500, { message: "\u83B7\u53D6\u5BB6\u5EAD\u4FE1\u606F\u5931\u8D25" });
  }
});
family.put("/:id", async (c) => {
  try {
    const user = getCurrentUser(c);
    const familyId = c.req.param("id");
    const { name, description } = await c.req.json();
    const familyInfo = await c.env.DB.prepare(
      "SELECT admin_id FROM families WHERE id = ?"
    ).bind(familyId).first();
    if (!familyInfo) {
      throw new HTTPException(404, { message: "\u5BB6\u5EAD\u4E0D\u5B58\u5728" });
    }
    if (familyInfo.admin_id !== user.userId) {
      throw new HTTPException(403, { message: "\u53EA\u6709\u5BB6\u5EAD\u7BA1\u7406\u5458\u53EF\u4EE5\u4FEE\u6539\u5BB6\u5EAD\u4FE1\u606F" });
    }
    const updates = [];
    const values = [];
    if (name !== void 0) {
      if (!name) {
        throw new HTTPException(400, { message: "\u5BB6\u5EAD\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A" });
      }
      updates.push("name = ?");
      values.push(name);
    }
    if (description !== void 0) {
      updates.push("description = ?");
      values.push(description);
    }
    if (updates.length === 0) {
      throw new HTTPException(400, { message: "\u81F3\u5C11\u9700\u8981\u63D0\u4F9B\u4E00\u4E2A\u66F4\u65B0\u5B57\u6BB5" });
    }
    values.push(familyId);
    await c.env.DB.prepare(
      `UPDATE families SET ${updates.join(", ")} WHERE id = ?`
    ).bind(...values).run();
    return c.json({ message: "\u5BB6\u5EAD\u4FE1\u606F\u66F4\u65B0\u6210\u529F" });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error("Update family error:", error);
    throw new HTTPException(500, { message: "\u66F4\u65B0\u5BB6\u5EAD\u4FE1\u606F\u5931\u8D25" });
  }
});
family.post("/:id/invite", async (c) => {
  try {
    const user = getCurrentUser(c);
    const familyId = c.req.param("id");
    const { expiresIn = 7 } = await c.req.json();
    const familyInfo = await c.env.DB.prepare(
      "SELECT admin_id FROM families WHERE id = ?"
    ).bind(familyId).first();
    if (!familyInfo) {
      throw new HTTPException(404, { message: "\u5BB6\u5EAD\u4E0D\u5B58\u5728" });
    }
    if (familyInfo.admin_id !== user.userId) {
      throw new HTTPException(403, { message: "\u53EA\u6709\u5BB6\u5EAD\u7BA1\u7406\u5458\u53EF\u4EE5\u751F\u6210\u9080\u8BF7\u7801" });
    }
    const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    const expiresAt = new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1e3).toISOString();
    await c.env.DB.prepare(
      "INSERT INTO invite_codes (code, family_id, expires_at) VALUES (?, ?, ?)"
    ).bind(inviteCode, familyId, expiresAt).run();
    return c.json({
      message: "\u9080\u8BF7\u7801\u751F\u6210\u6210\u529F",
      inviteCode,
      expiresAt,
      expiresIn
    });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error("Generate invite code error:", error);
    throw new HTTPException(500, { message: "\u751F\u6210\u9080\u8BF7\u7801\u5931\u8D25" });
  }
});
family.post("/join", async (c) => {
  try {
    const user = getCurrentUser(c);
    const { inviteCode } = await c.req.json();
    if (!inviteCode) {
      throw new HTTPException(400, { message: "\u9080\u8BF7\u7801\u4E0D\u80FD\u4E3A\u7A7A" });
    }
    if (user.familyId) {
      throw new HTTPException(400, { message: "\u60A8\u5DF2\u7ECF\u52A0\u5165\u4E86\u4E00\u4E2A\u5BB6\u5EAD\uFF0C\u8BF7\u5148\u9000\u51FA\u5F53\u524D\u5BB6\u5EAD" });
    }
    const invite = await c.env.DB.prepare(`
      SELECT ic.*, f.name as family_name
      FROM invite_codes ic
      LEFT JOIN families f ON ic.family_id = f.id
      WHERE ic.code = ? AND ic.expires_at > ? AND ic.used_by IS NULL
    `).bind(inviteCode, (/* @__PURE__ */ new Date()).toISOString()).first();
    if (!invite) {
      throw new HTTPException(400, { message: "\u9080\u8BF7\u7801\u65E0\u6548\u6216\u5DF2\u8FC7\u671F" });
    }
    await c.env.DB.prepare(
      "UPDATE users SET family_id = ?, role = ? WHERE id = ?"
    ).bind(invite.family_id, "member", user.userId).run();
    await c.env.DB.prepare(
      "UPDATE invite_codes SET used_by = ? WHERE code = ?"
    ).bind(user.userId, inviteCode).run();
    return c.json({
      message: `\u6210\u529F\u52A0\u5165\u5BB6\u5EAD\uFF1A${invite.family_name}`,
      family: {
        id: invite.family_id,
        name: invite.family_name
      }
    });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error("Join family error:", error);
    throw new HTTPException(500, { message: "\u52A0\u5165\u5BB6\u5EAD\u5931\u8D25" });
  }
});
family.post("/leave", async (c) => {
  try {
    const user = getCurrentUser(c);
    if (!user.familyId) {
      throw new HTTPException(400, { message: "\u60A8\u8FD8\u6CA1\u6709\u52A0\u5165\u4EFB\u4F55\u5BB6\u5EAD" });
    }
    const familyInfo = await c.env.DB.prepare(
      "SELECT admin_id FROM families WHERE id = ?"
    ).bind(user.familyId).first();
    if (familyInfo && familyInfo.admin_id === user.userId) {
      const memberCount = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM users WHERE family_id = ?"
      ).bind(user.familyId).first();
      if (memberCount && memberCount.count > 1) {
        throw new HTTPException(400, { message: "\u4F5C\u4E3A\u7BA1\u7406\u5458\uFF0C\u60A8\u9700\u8981\u5148\u8F6C\u8BA9\u7BA1\u7406\u6743\u9650\u6216\u5220\u9664\u5BB6\u5EAD\u624D\u80FD\u9000\u51FA" });
      }
      await c.env.DB.prepare("DELETE FROM families WHERE id = ?").bind(user.familyId).run();
    }
    await c.env.DB.prepare(
      "UPDATE users SET family_id = NULL, role = ? WHERE id = ?"
    ).bind("member", user.userId).run();
    return c.json({ message: "\u6210\u529F\u9000\u51FA\u5BB6\u5EAD" });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error("Leave family error:", error);
    throw new HTTPException(500, { message: "\u9000\u51FA\u5BB6\u5EAD\u5931\u8D25" });
  }
});
family.delete("/:id/members/:memberId", async (c) => {
  try {
    const user = getCurrentUser(c);
    const familyId = c.req.param("id");
    const memberId = c.req.param("memberId");
    const familyInfo = await c.env.DB.prepare(
      "SELECT admin_id FROM families WHERE id = ?"
    ).bind(familyId).first();
    if (!familyInfo) {
      throw new HTTPException(404, { message: "\u5BB6\u5EAD\u4E0D\u5B58\u5728" });
    }
    if (familyInfo.admin_id !== user.userId) {
      throw new HTTPException(403, { message: "\u53EA\u6709\u5BB6\u5EAD\u7BA1\u7406\u5458\u53EF\u4EE5\u79FB\u9664\u6210\u5458" });
    }
    if (memberId === user.userId) {
      throw new HTTPException(400, { message: "\u4E0D\u80FD\u79FB\u9664\u81EA\u5DF1\uFF0C\u8BF7\u4F7F\u7528\u9000\u51FA\u5BB6\u5EAD\u529F\u80FD" });
    }
    const member = await c.env.DB.prepare(
      "SELECT id, name FROM users WHERE id = ? AND family_id = ?"
    ).bind(memberId, familyId).first();
    if (!member) {
      throw new HTTPException(404, { message: "\u6210\u5458\u4E0D\u5B58\u5728\u6216\u4E0D\u5C5E\u4E8E\u8BE5\u5BB6\u5EAD" });
    }
    await c.env.DB.prepare(
      "UPDATE users SET family_id = NULL, role = ? WHERE id = ?"
    ).bind("member", memberId).run();
    return c.json({ message: `\u6210\u529F\u79FB\u9664\u6210\u5458\uFF1A${member.name}` });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error("Remove member error:", error);
    throw new HTTPException(500, { message: "\u79FB\u9664\u6210\u5458\u5931\u8D25" });
  }
});
family.post("/:id/transfer", async (c) => {
  try {
    const user = getCurrentUser(c);
    const familyId = c.req.param("id");
    const { newAdminId } = await c.req.json();
    if (!newAdminId) {
      throw new HTTPException(400, { message: "\u65B0\u7BA1\u7406\u5458ID\u4E0D\u80FD\u4E3A\u7A7A" });
    }
    const familyInfo = await c.env.DB.prepare(
      "SELECT admin_id FROM families WHERE id = ?"
    ).bind(familyId).first();
    if (!familyInfo) {
      throw new HTTPException(404, { message: "\u5BB6\u5EAD\u4E0D\u5B58\u5728" });
    }
    if (familyInfo.admin_id !== user.userId) {
      throw new HTTPException(403, { message: "\u53EA\u6709\u5F53\u524D\u7BA1\u7406\u5458\u53EF\u4EE5\u8F6C\u8BA9\u7BA1\u7406\u6743\u9650" });
    }
    const newAdmin = await c.env.DB.prepare(
      "SELECT id, name FROM users WHERE id = ? AND family_id = ?"
    ).bind(newAdminId, familyId).first();
    if (!newAdmin) {
      throw new HTTPException(400, { message: "\u65B0\u7BA1\u7406\u5458\u5FC5\u987B\u662F\u5BB6\u5EAD\u6210\u5458" });
    }
    await c.env.DB.batch([
      c.env.DB.prepare("UPDATE families SET admin_id = ? WHERE id = ?").bind(newAdminId, familyId),
      c.env.DB.prepare("UPDATE users SET role = ? WHERE id = ?").bind("admin", newAdminId),
      c.env.DB.prepare("UPDATE users SET role = ? WHERE id = ?").bind("member", user.userId)
    ]);
    return c.json({ message: `\u7BA1\u7406\u6743\u9650\u5DF2\u8F6C\u8BA9\u7ED9\uFF1A${newAdmin.name}` });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error("Transfer admin error:", error);
    throw new HTTPException(500, { message: "\u8F6C\u8BA9\u7BA1\u7406\u6743\u9650\u5931\u8D25" });
  }
});
family.get("/:id/invites", async (c) => {
  try {
    const user = getCurrentUser(c);
    const familyId = c.req.param("id");
    const familyInfo = await c.env.DB.prepare(
      "SELECT admin_id FROM families WHERE id = ?"
    ).bind(familyId).first();
    if (!familyInfo) {
      throw new HTTPException(404, { message: "\u5BB6\u5EAD\u4E0D\u5B58\u5728" });
    }
    if (familyInfo.admin_id !== user.userId) {
      throw new HTTPException(403, { message: "\u53EA\u6709\u5BB6\u5EAD\u7BA1\u7406\u5458\u53EF\u4EE5\u67E5\u770B\u9080\u8BF7\u7801" });
    }
    const invites = await c.env.DB.prepare(`
      SELECT 
        ic.*,
        u.name as used_by_name
      FROM invite_codes ic
      LEFT JOIN users u ON ic.used_by = u.id
      WHERE ic.family_id = ?
      ORDER BY ic.created_at DESC
    `).bind(familyId).all();
    return c.json({ invites: invites.results || [] });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error("Get invites error:", error);
    throw new HTTPException(500, { message: "\u83B7\u53D6\u9080\u8BF7\u7801\u5217\u8868\u5931\u8D25" });
  }
});
var family_default = family;

// src/utils/helpers.ts
var Validator = class {
  static email(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  static password(password) {
    const errors = [];
    if (!password) {
      errors.push({ field: "password", message: "\u5BC6\u7801\u4E0D\u80FD\u4E3A\u7A7A" });
    } else {
      if (password.length < 6) {
        errors.push({ field: "password", message: "\u5BC6\u7801\u957F\u5EA6\u81F3\u5C116\u4F4D" });
      }
      if (password.length > 50) {
        errors.push({ field: "password", message: "\u5BC6\u7801\u957F\u5EA6\u4E0D\u80FD\u8D85\u8FC750\u4F4D" });
      }
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  static name(name) {
    const errors = [];
    if (!name || name.trim().length === 0) {
      errors.push({ field: "name", message: "\u59D3\u540D\u4E0D\u80FD\u4E3A\u7A7A" });
    } else {
      if (name.trim().length < 2) {
        errors.push({ field: "name", message: "\u59D3\u540D\u957F\u5EA6\u81F3\u5C112\u4F4D" });
      }
      if (name.trim().length > 20) {
        errors.push({ field: "name", message: "\u59D3\u540D\u957F\u5EA6\u4E0D\u80FD\u8D85\u8FC720\u4F4D" });
      }
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  static familyName(name) {
    const errors = [];
    if (!name || name.trim().length === 0) {
      errors.push({ field: "name", message: "\u5BB6\u5EAD\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A" });
    } else {
      if (name.trim().length < 2) {
        errors.push({ field: "name", message: "\u5BB6\u5EAD\u540D\u79F0\u957F\u5EA6\u81F3\u5C112\u4F4D" });
      }
      if (name.trim().length > 30) {
        errors.push({ field: "name", message: "\u5BB6\u5EAD\u540D\u79F0\u957F\u5EA6\u4E0D\u80FD\u8D85\u8FC730\u4F4D" });
      }
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  static taskTitle(title) {
    const errors = [];
    if (!title || title.trim().length === 0) {
      errors.push({ field: "title", message: "\u4EFB\u52A1\u6807\u9898\u4E0D\u80FD\u4E3A\u7A7A" });
    } else {
      if (title.trim().length < 2) {
        errors.push({ field: "title", message: "\u4EFB\u52A1\u6807\u9898\u957F\u5EA6\u81F3\u5C112\u4F4D" });
      }
      if (title.trim().length > 100) {
        errors.push({ field: "title", message: "\u4EFB\u52A1\u6807\u9898\u957F\u5EA6\u4E0D\u80FD\u8D85\u8FC7100\u4F4D" });
      }
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  static uuid(id) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }
  static date(dateString) {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }
  static inviteCode(code) {
    const codeRegex = /^[A-Z0-9]{8}$/;
    return codeRegex.test(code);
  }
};
var PasswordUtils = class {
  static async hash(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  static async verify(password, hash2) {
    const passwordHash = await this.hash(password);
    return passwordHash === hash2;
  }
  static generate(length = 12) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
};
__name(PasswordUtils, "PasswordUtils");
var InviteCodeUtils = class {
  static generate() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  static isExpired(expiresAt) {
    return new Date(expiresAt) < /* @__PURE__ */ new Date();
  }
  static getExpirationDate(days) {
    const date = /* @__PURE__ */ new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }
};
__name(InviteCodeUtils, "InviteCodeUtils");

// src/routes/migration.ts
var migration = new Hono2();
migration.use("*", authMiddleware());
migration.post("/migrate", async (c) => {
  try {
    const user = getCurrentUser(c);
    const localData = await c.req.json();
    if (!localData || typeof localData !== "object") {
      throw new HTTPException(400, { message: "\u65E0\u6548\u7684\u6570\u636E\u683C\u5F0F" });
    }
    const result = {
      success: false,
      message: "",
      migratedCounts: {
        users: 0,
        families: 0,
        tasks: 0,
        inviteCodes: 0
      },
      errors: []
    };
    try {
      if (localData.users && Array.isArray(localData.users)) {
        const userResult = await migrateUsers(c.env.DB, localData.users, user.userId);
        result.migratedCounts.users = userResult.count;
        if (userResult.errors.length > 0) {
          result.errors.push(...userResult.errors);
        }
      }
      if (localData.families && Array.isArray(localData.families)) {
        const familyResult = await migrateFamilies(c.env.DB, localData.families, user.userId);
        result.migratedCounts.families = familyResult.count;
        if (familyResult.errors.length > 0) {
          result.errors.push(...familyResult.errors);
        }
      }
      if (localData.tasks && Array.isArray(localData.tasks)) {
        const taskResult = await migrateTasks(c.env.DB, localData.tasks, user.userId);
        result.migratedCounts.tasks = taskResult.count;
        if (taskResult.errors.length > 0) {
          result.errors.push(...taskResult.errors);
        }
      }
      if (localData.inviteCodes && Array.isArray(localData.inviteCodes)) {
        const inviteResult = await migrateInviteCodes(c.env.DB, localData.inviteCodes, user.userId);
        result.migratedCounts.inviteCodes = inviteResult.count;
        if (inviteResult.errors.length > 0) {
          result.errors.push(...inviteResult.errors);
        }
      }
      result.success = true;
      result.message = "\u6570\u636E\u8FC1\u79FB\u5B8C\u6210";
      const migrationLog = {
        userId: user.userId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        result
      };
      await c.env.KV.put(`migration:${user.userId}:${Date.now()}`, JSON.stringify(migrationLog), {
        expirationTtl: 30 * 24 * 60 * 60
        // 30天过期
      });
    } catch (error) {
      console.error("Migration error:", error);
      result.success = false;
      result.message = "\u6570\u636E\u8FC1\u79FB\u5931\u8D25";
      result.errors.push(error instanceof Error ? error.message : "\u672A\u77E5\u9519\u8BEF");
    }
    return c.json(result);
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error("Migration endpoint error:", error);
    throw new HTTPException(500, { message: "\u6570\u636E\u8FC1\u79FB\u670D\u52A1\u5F02\u5E38" });
  }
});
migration.get("/history", async (c) => {
  try {
    const user = getCurrentUser(c);
    const { keys } = await c.env.KV.list({ prefix: `migration:${user.userId}:` });
    const histories = [];
    for (const key of keys) {
      const data = await c.env.KV.get(key.name);
      if (data) {
        try {
          histories.push(JSON.parse(data));
        } catch (e) {
          console.error("Parse migration history error:", e);
        }
      }
    }
    histories.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return c.json({ histories });
  } catch (error) {
    console.error("Get migration history error:", error);
    throw new HTTPException(500, { message: "\u83B7\u53D6\u8FC1\u79FB\u5386\u53F2\u5931\u8D25" });
  }
});
migration.post("/validate", async (c) => {
  try {
    const localData = await c.req.json();
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      summary: {
        users: 0,
        families: 0,
        tasks: 0,
        inviteCodes: 0
      }
    };
    if (localData.users) {
      if (!Array.isArray(localData.users)) {
        validation.errors.push("\u7528\u6237\u6570\u636E\u683C\u5F0F\u9519\u8BEF\uFF1A\u5E94\u4E3A\u6570\u7EC4");
        validation.isValid = false;
      } else {
        validation.summary.users = localData.users.length;
        localData.users.forEach((user, index) => {
          if (!user.id || !user.name || !user.email) {
            validation.errors.push(`\u7528\u6237\u6570\u636E[${index}]\u7F3A\u5C11\u5FC5\u8981\u5B57\u6BB5`);
            validation.isValid = false;
          }
          if (user.email && !Validator.email(user.email)) {
            validation.errors.push(`\u7528\u6237\u6570\u636E[${index}]\u90AE\u7BB1\u683C\u5F0F\u9519\u8BEF`);
            validation.isValid = false;
          }
        });
      }
    }
    if (localData.families) {
      if (!Array.isArray(localData.families)) {
        validation.errors.push("\u5BB6\u5EAD\u6570\u636E\u683C\u5F0F\u9519\u8BEF\uFF1A\u5E94\u4E3A\u6570\u7EC4");
        validation.isValid = false;
      } else {
        validation.summary.families = localData.families.length;
        localData.families.forEach((family2, index) => {
          if (!family2.id || !family2.name || !family2.adminId) {
            validation.errors.push(`\u5BB6\u5EAD\u6570\u636E[${index}]\u7F3A\u5C11\u5FC5\u8981\u5B57\u6BB5`);
            validation.isValid = false;
          }
        });
      }
    }
    if (localData.tasks) {
      if (!Array.isArray(localData.tasks)) {
        validation.errors.push("\u4EFB\u52A1\u6570\u636E\u683C\u5F0F\u9519\u8BEF\uFF1A\u5E94\u4E3A\u6570\u7EC4");
        validation.isValid = false;
      } else {
        validation.summary.tasks = localData.tasks.length;
        localData.tasks.forEach((task, index) => {
          if (!task.id || !task.title || !task.familyId || !task.assignedBy) {
            validation.errors.push(`\u4EFB\u52A1\u6570\u636E[${index}]\u7F3A\u5C11\u5FC5\u8981\u5B57\u6BB5`);
            validation.isValid = false;
          }
        });
      }
    }
    if (localData.inviteCodes) {
      if (!Array.isArray(localData.inviteCodes)) {
        validation.errors.push("\u9080\u8BF7\u7801\u6570\u636E\u683C\u5F0F\u9519\u8BEF\uFF1A\u5E94\u4E3A\u6570\u7EC4");
        validation.isValid = false;
      } else {
        validation.summary.inviteCodes = localData.inviteCodes.length;
        localData.inviteCodes.forEach((invite, index) => {
          if (!invite.id || !invite.code || !invite.familyId) {
            validation.errors.push(`\u9080\u8BF7\u7801\u6570\u636E[${index}]\u7F3A\u5C11\u5FC5\u8981\u5B57\u6BB5`);
            validation.isValid = false;
          }
        });
      }
    }
    return c.json(validation);
  } catch (error) {
    console.error("Validate data error:", error);
    throw new HTTPException(400, { message: "\u6570\u636E\u9A8C\u8BC1\u5931\u8D25" });
  }
});
async function migrateUsers(db, users, currentUserId) {
  const result = { count: 0, errors: [] };
  for (const user of users) {
    try {
      if (user.id === currentUserId) {
        continue;
      }
      if (!user.id || !user.name || !user.email) {
        result.errors.push(`\u7528\u6237 ${user.name || user.id} \u6570\u636E\u4E0D\u5B8C\u6574`);
        continue;
      }
      if (!Validator.email(user.email)) {
        result.errors.push(`\u7528\u6237 ${user.name} \u90AE\u7BB1\u683C\u5F0F\u9519\u8BEF`);
        continue;
      }
      const defaultPassword = await PasswordUtils.hash("123456");
      await db.prepare(`
        INSERT OR IGNORE INTO users (id, name, email, password, family_id, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        user.id,
        user.name,
        user.email,
        defaultPassword,
        user.familyId || null,
        user.role || "member",
        user.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
        user.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
      ).run();
      result.count++;
    } catch (error) {
      result.errors.push(`\u8FC1\u79FB\u7528\u6237 ${user.name} \u5931\u8D25: ${error}`);
    }
  }
  return result;
}
__name(migrateUsers, "migrateUsers");
async function migrateFamilies(db, families, currentUserId) {
  const result = { count: 0, errors: [] };
  for (const family2 of families) {
    try {
      if (!family2.id || !family2.name || !family2.adminId) {
        result.errors.push(`\u5BB6\u5EAD ${family2.name || family2.id} \u6570\u636E\u4E0D\u5B8C\u6574`);
        continue;
      }
      await db.prepare(`
        INSERT OR IGNORE INTO families (id, name, description, admin_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        family2.id,
        family2.name,
        family2.description || null,
        family2.adminId,
        family2.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
        family2.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
      ).run();
      result.count++;
    } catch (error) {
      result.errors.push(`\u8FC1\u79FB\u5BB6\u5EAD ${family2.name} \u5931\u8D25: ${error}`);
    }
  }
  return result;
}
__name(migrateFamilies, "migrateFamilies");
async function migrateTasks(db, tasks2, currentUserId) {
  const result = { count: 0, errors: [] };
  for (const task of tasks2) {
    try {
      if (!task.id || !task.title || !task.familyId || !task.assignedBy) {
        result.errors.push(`\u4EFB\u52A1 ${task.title || task.id} \u6570\u636E\u4E0D\u5B8C\u6574`);
        continue;
      }
      await db.prepare(`
        INSERT OR IGNORE INTO tasks (
          id, title, description, assigned_to, assigned_by, family_id,
          status, priority, due_date, completed_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        task.id,
        task.title,
        task.description || null,
        task.assignedTo || null,
        task.assignedBy,
        task.familyId,
        task.status || "pending",
        task.priority || "medium",
        task.dueDate || null,
        task.completedAt || null,
        task.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
        task.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
      ).run();
      result.count++;
    } catch (error) {
      result.errors.push(`\u8FC1\u79FB\u4EFB\u52A1 ${task.title} \u5931\u8D25: ${error}`);
    }
  }
  return result;
}
__name(migrateTasks, "migrateTasks");
async function migrateInviteCodes(db, inviteCodes, currentUserId) {
  const result = { count: 0, errors: [] };
  for (const invite of inviteCodes) {
    try {
      if (!invite.id || !invite.code || !invite.familyId) {
        result.errors.push(`\u9080\u8BF7\u7801 ${invite.code || invite.id} \u6570\u636E\u4E0D\u5B8C\u6574`);
        continue;
      }
      if (InviteCodeUtils.isExpired(invite.expiresAt)) {
        continue;
      }
      await db.prepare(`
        INSERT OR IGNORE INTO invite_codes (id, code, family_id, used_by, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        invite.id,
        invite.code,
        invite.familyId,
        invite.usedBy || null,
        invite.expiresAt,
        invite.createdAt || (/* @__PURE__ */ new Date()).toISOString()
      ).run();
      result.count++;
    } catch (error) {
      result.errors.push(`\u8FC1\u79FB\u9080\u8BF7\u7801 ${invite.code} \u5931\u8D25: ${error}`);
    }
  }
  return result;
}
__name(migrateInviteCodes, "migrateInviteCodes");
var migration_default = migration;

// src/index.ts
var app = new Hono2();
app.use("*", logger());
app.use("*", prettyJSON());
app.use("*", async (c, next) => {
  const corsOrigin = c.env.CORS_ORIGIN || "http://localhost:5173";
  return cors({
    origin: corsOrigin,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })(c, next);
});
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    environment: c.env.ENVIRONMENT || "development",
    version: "1.0.0"
  });
});
app.get("/", (c) => {
  return c.json({
    message: "Home List API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      tasks: "/api/tasks",
      family: "/api/family",
      migration: "/api/migration",
      health: "/health"
    }
  });
});
app.route("/api/auth", auth_default);
app.route("/api/tasks", tasks_default);
app.route("/api/family", family_default);
app.route("/api/migration", migration_default);
app.onError((err, c) => {
  console.error("Global error handler:", err);
  if (err instanceof HTTPException) {
    return c.json(
      {
        error: err.message,
        status: err.status
      },
      err.status
    );
  }
  if (err.message.includes("UNIQUE constraint failed")) {
    return c.json(
      {
        error: "\u6570\u636E\u5DF2\u5B58\u5728\uFF0C\u8BF7\u68C0\u67E5\u8F93\u5165\u4FE1\u606F",
        details: err.message
      },
      400
    );
  }
  if (err.message.includes("jwt") || err.message.includes("token")) {
    return c.json(
      {
        error: "\u8BA4\u8BC1\u5931\u8D25\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55",
        details: err.message
      },
      401
    );
  }
  return c.json(
    {
      error: "\u670D\u52A1\u5668\u5185\u90E8\u9519\u8BEF",
      details: c.env.ENVIRONMENT === "development" ? err.message : void 0
    },
    500
  );
});
app.notFound((c) => {
  return c.json(
    {
      error: "\u63A5\u53E3\u4E0D\u5B58\u5728",
      path: c.req.path,
      method: c.req.method
    },
    404
  );
});
var src_default = app;

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-gSoyYe/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-gSoyYe/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
