const kibanaUrl = process.env.KIBANA_URL || "http://localhost:5601";
const dataViewId = "conduit-logs";
const dataView = {
  data_view: {
    id: dataViewId,
    name: "Conduit API logs",
    title: "conduit-logs-*",
    timeFieldName: "@timestamp",
  },
};

async function request(path, method = "GET", body) {
  return fetch(`${kibanaUrl.replace(/\/$/, "")}${path}`, {
    method,
    headers: {
      "kbn-xsrf": "true",
      "content-type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(5000),
  });
}

async function setup() {
  let lastError;
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      const response = await request(`/api/data_views/data_view/${dataViewId}`);
      if (response.ok) {
        const updated = await request(`/api/data_views/data_view/${dataViewId}`, "POST", {
          data_view: {
            name: dataView.data_view.name,
            title: dataView.data_view.title,
            timeFieldName: dataView.data_view.timeFieldName,
          },
        });
        if (!updated.ok) throw new Error(`Kibana data view update returned ${updated.status}: ${await updated.text()}`);
        console.log("Kibana data view conduit-logs is ready.");
        return;
      }
      if (response.status !== 404) {
        throw new Error(`Kibana returned ${response.status}: ${await response.text()}`);
      }

      const created = await request("/api/data_views/data_view", "POST", dataView);
      if (!created.ok) throw new Error(`Kibana data view creation returned ${created.status}: ${await created.text()}`);
      console.log("Created Kibana data view conduit-logs.");
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  throw new Error(`Could not configure Kibana at ${kibanaUrl}: ${lastError?.message}`);
}

setup().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
