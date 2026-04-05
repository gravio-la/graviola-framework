/**
 * Oxigraph async worker
 *
 * This worker allows you to have an Oxigraph instance running as a worker process and thereby
 * you will not block your browser's main thread while doing heavy operations like loading triples
 * into an Oxigraph store
 */

// Globals
let store;

importScripts("./scripts.bundle.js");
self.addEventListener(
  "message",
  async (ev) => {
    // Input
    const task = ev.data.task;
    const taskID = ev.data.taskID;

    let result = {
      task,
      taskID,
      message: "",
    };
    try {
      switch (task) {
        case "DUMP":
          result = await dump(ev.data.dumpPayload, result);
          break;
        case "INIT":
          result = await init(ev.data.initPayload, result);
          break;
        case "LOAD":
          result = await load(ev.data.loadPayload, result);
          break;
        case "QUERY":
          result = await query(ev.data.queryPayload, result);
          break;
      }
    } catch (err) {
      result.error = err;
    }

    self.postMessage({ ...result, taskID });
  },
  false,
);

// Init oxigraph
async function init(payload, result) {
  // Per default, it expects the wasm file to be in the same folder
  const wasmPath = payload.wasmPath ?? "./web_bg.wasm";
  try {
    // Initialize with explicit WebAssembly options
    await scripts.oxigraph.default(await fetch(wasmPath));
  } catch (err) {
    throw "Instantiation of Oxigraph failed: " + err.toString();
  }
  result.message = "Initialized Oxigraph";
  return result;
}

// Load data
async function load(payload, result) {
  // Create store if none exists
  if (store == undefined) store = new scripts.oxigraph.Store();

  const t1 = new Date().getTime();
  const s1 = store.size;

  if (payload.graphURI != undefined)
    payload.graphURI = scripts.oxigraph.namedNode(payload.graphURI);

  try {
    await store.load(payload.triples, {
      format: payload.mimetype,
      base_iri: payload.baseURI,
      to_graph_name: payload.graphURI,
    });
  } catch (err) {
    throw "Loading failed: " + err.toString();
  }

  const t2 = new Date().getTime();
  const s2 = store.size;

  const count = s2 - s1;
  const timeInSeconds = (t2 - t1) / 1000;

  result.data = store.size;
  result.message = `Loaded ${count} triples in ${timeInSeconds} seconds`;
  return result;
}

// Dump store
async function dump(payload, result) {
  if (store == undefined) {
    result.message = "No store available - nothing to dump.";
    return result;
  }
  const t1 = new Date().getTime();
  const dumpOptions = { format: payload.mimetype };
  if (payload.graphURI != undefined) {
    dumpOptions.from_graph_name = scripts.oxigraph.namedNode(payload.graphURI);
  }
  result.data = store.dump(dumpOptions);
  const t2 = new Date().getTime();

  const timeInSeconds = (t2 - t1) / 1000;
  result.message = `Created RDF dump in ${timeInSeconds} seconds`;
  return result;
}

// Query
async function query(payload, result) {
  // Create store if none exists
  if (store == undefined) {
    result.message = "No store available - nothing to query.";
    return result;
  }

  const queryDetails = scripts.getQueryDetails(payload.query);
  const type = queryDetails.type;

  const t1 = new Date().getTime();

  let results;
  if (type == "update") {
    const s1 = store.size;
    try {
      store.update(payload.query);
    } catch (err) {
      throw "Update query failed: " + err.toString();
    }
    const s2 = store.size;
    results = s2 - s1;
  } else if (type == "query") {
    try {
      results = store.query(payload.query);
    } catch (err) {
      throw "Query failed: " + err.toString();
    }
  } else {
    result.message = "Unknown query type.";
    return result;
  }

  const t2 = new Date().getTime();

  const timeInSeconds = (t2 - t1) / 1000;

  if (type == "update") {
    result.data = { difference: results };
    result.message =
      results > 0
        ? `Added ${results} triples to the store in ${timeInSeconds} seconds.`
        : `Removed ${results} triples from the store in ${timeInSeconds} seconds.`;
    if (results == 0)
      result.message = `Nothing was added. Operation took ${timeInSeconds} seconds.`;
  } else if (type == "query") {
    const t3 = new Date().getTime();
    const [res, resultCount] = scripts.processQueryResponse(
      results,
      payload.query,
      queryDetails,
      payload.responseMimetype,
    );
    result.data = res;
    const t4 = new Date().getTime();

    const postProcessingTimeInSeconds = (t4 - t3) / 1000;
    result.message = `Got ${resultCount} results in ${timeInSeconds} seconds. Post processing took ${postProcessingTimeInSeconds} seconds.`;
  }

  return result;
}
